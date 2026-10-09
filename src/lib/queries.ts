import type { Article, Company, NewsEvent, Relationship } from './schema';

export function selectCompany(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter(value => value !== id);
  return selected.length < 2 ? [...selected, id] : [selected[0], id];
}
export function searchCompanies(companies: Company[], query: string): Company[] {
  const q = query.trim().toLocaleLowerCase();
  return q ? companies.filter(c => [c.name, c.englishName, ...c.aliases, ...c.securities.map(s => s.ticker)].some(n => n.toLocaleLowerCase().includes(q))) : [];
}
export function pairRelationships(relationships: Relationship[], selected: string[]) {
  if (selected.length !== 2) return [];
  return relationships.filter(r => selected.includes(r.source) && selected.includes(r.target));
}
export function queryEvents(events: NewsEvent[], articles: Article[], companyIds: string[], shared = false): NewsEvent[] {
  if (!companyIds.length) return [];
  const dates = new Map(articles.map(a => [a.id, a.publishedOn]));
  const latest = (e: NewsEvent) => e.articleIds.map(id => dates.get(id) ?? '').sort().at(-1) ?? '';
  return events.filter(e => shared ? companyIds.every(id => e.companyIds.includes(id)) : companyIds.some(id => e.companyIds.includes(id)))
    .sort((a, b) => latest(b).localeCompare(latest(a)));
}
export function nodeDiameter(company: Company, mode: 'equal' | 'marketCap'): number {
  if (mode === 'equal' || company.marketCap === null) return 36;
  // Bounded log-area mapping: readable across orders of magnitude; UI explicitly labels compression.
  const area = 36 ** 2 + Math.max(0, Math.log10(company.marketCap.rmbValue / 1e9)) * 1100;
  return Math.min(76, Math.sqrt(area));
}
