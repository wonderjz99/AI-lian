import { z } from 'zod';

const text = z.string().trim().min(1);
export const date = text.regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, '无效日历日期');
const url = z.url().refine(value => /^https?:\/\//.test(value), '来源仅支持 HTTP(S)');
const source = z.object({ title: text, publisher: text, url, accessedOn: date });
export const layers = ['hardware', 'cloud', 'model', 'platform', 'application'] as const;
export const relationTypes = ['supply', 'partnership', 'control', 'investment'] as const;
export const statuses = ['announced', 'ongoing', 'completed', 'ended'] as const;

export const companySchema = z.object({
  id: text, name: text, englishName: text, aliases: z.array(text),
  layer: z.enum(layers), roles: z.array(text).min(1), description: text,
  products: z.array(text), region: z.enum(['mainland', 'hong-kong']),
  identityNote: text, classificationReason: text, sources: z.array(source).min(1),
  securities: z.array(z.object({ exchange: text, ticker: text })),
  marketCap: z.object({
    value: z.number().positive(), currency: z.enum(['CNY', 'HKD', 'USD', 'SGD']),
    rmbValue: z.number().positive(), date,
    fxRate: z.number().positive(), fxSource: source,
    basis: text, source,
  }).nullable(),
  valuation: z.object({ value: z.number().positive(), currency: text, date, source, note: text }).nullable(),
});

export const articleSchema = z.object({
  id: text, title: text, publisher: text, url,
  publishedOn: date, accessedOn: date,
  evidenceNote: text, historical: z.boolean(),
});
export const eventSchema = z.object({
  id: text, title: text, summary: text, eventDate: date.nullable(),
  companyIds: z.array(text).min(1), articleIds: z.array(text).min(1),
});
export const relationshipSchema = z.object({
  id: text, source: text, target: text, type: z.enum(relationTypes),
  status: z.enum(statuses), confirmedOn: date, effectiveOn: date.nullable(),
  summary: text, evidenceArticleIds: z.array(text).min(1),
  ownershipPercent: z.number().min(0).max(100).nullable(), ownershipAsOf: date.nullable(),
  note: text,
});
export const metadataSchema = z.object({
  version: text, cutoff: date, newsWindowStart: date,
  marketCapDate: date.nullable(), currency: z.literal('CNY'),
  coverage: text, companyScope: text, marketCapNote: text,
});
export const datasetSchema = z.object({
  companies: z.array(companySchema), articles: z.array(articleSchema),
  events: z.array(eventSchema), relationships: z.array(relationshipSchema),
  metadata: metadataSchema,
});

export type Company = z.infer<typeof companySchema>;
export type Article = z.infer<typeof articleSchema>;
export type NewsEvent = z.infer<typeof eventSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type Layer = typeof layers[number];
export type RelationType = typeof relationTypes[number];
export type View = 'industry' | 'capital';

export function validateDataset(input: unknown, requireFull = false): string[] {
  const parsed = datasetSchema.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
  const d = parsed.data;
  const errors: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) errors.push(message); };
  for (const key of ['companies', 'articles', 'events', 'relationships'] as const) {
    const ids = d[key].map(item => item.id);
    check(new Set(ids).size === ids.length, `${key}: 重复 ID`);
  }
  const companies = new Set(d.companies.map(c => c.id));
  const articles = new Map(d.articles.map(a => [a.id, a]));
  const identities = d.companies.map(c => `${c.name}:${c.region}`);
  check(new Set(identities).size === identities.length, 'companies: 重复公司身份');
  const securities = d.companies.flatMap(c => c.securities.map(s => `${s.exchange}:${s.ticker}`));
  check(new Set(securities).size === securities.length, 'companies: 重复证券身份');
  check(d.metadata.newsWindowStart <= d.metadata.cutoff, 'metadata: 新闻窗口晚于截止日');
  if (requireFull) check(d.companies.length >= 30 && d.companies.length <= 40, '正式版本应包含 30–40 家公司');
  for (const layer of layers) check(d.companies.some(c => c.layer === layer), `缺少产业层 ${layer}`);
  for (const c of d.companies) {
    for (const s of c.sources) check(s.accessedOn <= d.metadata.cutoff, `${c.id}: 来源查阅日晚于截止日`);
    if (c.marketCap) {
      const m = c.marketCap;
      check(m.date === d.metadata.marketCapDate, `${c.id}: 市值日期与快照不同`);
      check(c.securities.length > 0, `${c.id}: 有市值但未记录上市证券`);
      check(Math.abs(m.value * m.fxRate - m.rmbValue) <= Math.max(1, m.rmbValue * 0.00001), `${c.id}: 市值换算不一致`);
      if (m.currency === 'CNY') check(m.fxRate === 1, `${c.id}: 人民币转换率应为 1`);
      check(m.date <= d.metadata.cutoff, `${c.id}: 市值晚于截止日`);
    }
  }
  for (const a of d.articles) {
    check(a.publishedOn <= d.metadata.cutoff, `${a.id}: 报道晚于截止日`);
    check(a.accessedOn <= d.metadata.cutoff, `${a.id}: 查阅日晚于截止日`);
    check(a.historical === (a.publishedOn < d.metadata.newsWindowStart), `${a.id}: 历史依据标识与窗口不一致`);
  }
  for (const e of d.events) {
    check(new Set(e.companyIds).size === e.companyIds.length, `${e.id}: 重复参与公司`);
    check(new Set(e.articleIds).size === e.articleIds.length, `${e.id}: 重复报道引用`);
    for (const id of e.companyIds) check(companies.has(id), `${e.id}: 无效公司 ${id}`);
    for (const id of e.articleIds) check(articles.has(id), `${e.id}: 无效报道 ${id}`);
    if (e.eventDate) check(e.eventDate <= d.metadata.cutoff, `${e.id}: 事件晚于截止日`);
  }
  for (const r of d.relationships) {
    check(companies.has(r.source) && companies.has(r.target), `${r.id}: 无效公司引用`);
    check(r.source !== r.target, `${r.id}: 不能自连`);
    check(r.confirmedOn <= d.metadata.cutoff, `${r.id}: 确认日晚于截止日`);
    if (r.effectiveOn) check(r.effectiveOn <= d.metadata.cutoff, `${r.id}: 生效日晚于截止日`);
    if (r.ownershipAsOf) check(r.ownershipAsOf <= d.metadata.cutoff, `${r.id}: 持股比例日晚于截止日`);
    for (const id of r.evidenceArticleIds) check(articles.has(id), `${r.id}: 无效来源 ${id}`);
    if (r.ownershipPercent !== null) {
      check(r.type === 'investment' || r.type === 'control', `${r.id}: 非资本关系不能记录持股`);
      check(r.ownershipAsOf !== null, `${r.id}: 缺少持股比例日期`);
    }
  }
  return errors;
}
