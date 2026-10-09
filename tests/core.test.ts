import { describe, expect, it } from 'vitest';
import { dataset } from '../src/data';
import { nodeDiameter, pairRelationships, queryEvents, searchCompanies, selectCompany } from '../src/lib/queries';
import { date, validateDataset } from '../src/lib/schema';

describe('公司选择与查询语义', () => {
  it('第一家保留，第三家替换第二家，取消后剩余公司成为第一家', () => {
    let selected = selectCompany([], 'huawei');
    selected = selectCompany(selected, 'alibaba');
    expect(selectCompany(selected, 'moonshot')).toEqual(['huawei', 'moonshot']);
    expect(selectCompany(selected, 'huawei')).toEqual(['alibaba']);
    expect(selectCompany(['alibaba'], 'alibaba')).toEqual([]);
  });
  it('别名及英文大小写搜索使用同一公司身份', () => {
    expect(searchCompanies(dataset.companies, 'QWEN').map(c => c.id)).toEqual(['alibaba']);
    expect(searchCompanies(dataset.companies, '昇腾').map(c => c.id)).toEqual(['huawei']);
    expect(searchCompanies(dataset.companies, '02513').map(c => c.id)).toEqual(['zhipu']);
    expect(searchCompanies(dataset.companies, 'MiMo').map(c => c.id)).toEqual(['xiaomi']);
    expect(searchCompanies(dataset.companies, '01810').map(c => c.id)).toEqual(['xiaomi']);
    expect(searchCompanies(dataset.companies, '   ')).toEqual([]);
  });
  it('共同报道不要求正式关系存在', () => {
    const pair = ['siliconflow', 'moonshot'];
    expect(pairRelationships(dataset.relationships, pair)).toEqual([]);
    expect(queryEvents(dataset.events, dataset.articles, pair, true).map(e => e.id)).toContain('event-sf-kimi');
  });
  it('双方所有关系不受地图视图影响', () => {
    expect(pairRelationships(dataset.relationships, ['huawei', 'wondershare']).map(r => r.type).sort()).toEqual(['partnership', 'supply']);
    expect(pairRelationships(dataset.relationships, ['alibaba', 'moonshot'])[0].type).toBe('investment');
  });
  it('硬件适配可查共同报道，但不会生成供应、合作或资本连线', () => {
    for (const [pair, event] of [
      [['biren', 'zhipu'], 'event-biren-zhipu-glm53-adaptation'],
      [['mthreads', 'deepseek'], 'event-mthreads-deepseek-v41-adaptation'],
    ] as const) {
      expect(pairRelationships(dataset.relationships, [...pair])).toEqual([]);
      expect(queryEvents(dataset.events, dataset.articles, [...pair], true).map(e => e.id)).toContain(event);
    }
  });
  it('同一融资披露支持两条投向智谱的边，不产生投资方之间的边', () => {
    for (const investor of ['alibaba', 'tencent']) {
      expect(pairRelationships(dataset.relationships, [investor, 'zhipu'])).toEqual(expect.arrayContaining([
        expect.objectContaining({ source: investor, target: 'zhipu', type: 'investment', ownershipPercent: null }),
      ]));
    }
    expect(pairRelationships(dataset.relationships, ['alibaba', 'tencent'])).toEqual([]);
    expect(pairRelationships(dataset.relationships, ['alibaba', 'minimax'])[0].ownershipPercent).toBeNull();
    expect(queryEvents(dataset.events, dataset.articles, ['lenovo', 'mthreads'], true).map(e => e.id)).toContain('event-lenovo-hardware-portfolio');
    expect(pairRelationships(dataset.relationships, ['cambricon', 'hygon'])).toEqual([]);
  });
  it('共同报道与各自动态不同，并按真实发表日期倒序', () => {
    expect(queryEvents(dataset.events, dataset.articles, ['tencent', 'wondershare'], true)).toEqual([]);
    const sampleIds = ['event-tencent-hy3', 'event-huawei-wonder', 'event-zhipu-financing-disclosure'];
    const sample = dataset.events.filter(e => sampleIds.includes(e.id));
    expect(queryEvents(sample, dataset.articles, ['tencent', 'wondershare']).map(e => e.id)).toEqual(sampleIds);
  });
  it('市值缺失保持固定大小，等大模式不受数值影响', () => {
    expect(nodeDiameter(dataset.companies[0], 'marketCap')).toBe(36);
    expect(nodeDiameter(dataset.companies[0], 'equal')).toBe(36);
  });
  it('已上市快照改变节点大小，未上市融资估值不进入映射', () => {
    const listed = dataset.companies.find(c => c.id === 'tencent')!;
    expect(nodeDiameter(listed, 'marketCap')).toBeGreaterThan(36);
    expect(nodeDiameter(listed, 'equal')).toBe(36);
    const unlisted = { ...listed, securities: [], marketCap: null, valuation: { value: 1e12, currency: 'CNY', date: '2026-03-31', source: listed.sources[0], note: '仅为测试夹具的虚构估值，未进入发布数据' } };
    expect(nodeDiameter(unlisted, 'marketCap')).toBe(36);
  });
});

describe('数据质量门禁', () => {
  it('逐公司关系覆盖没有孤立节点，联合研发不误记为交叉持股', () => {
    for (const company of dataset.companies) {
      expect(dataset.relationships.some(r => r.source === company.id || r.target === company.id), company.name).toBe(true);
    }
    const smicHuawei = pairRelationships(dataset.relationships, ['smic', 'huawei']);
    expect(smicHuawei.some(r => r.type === 'partnership')).toBe(true);
    expect(smicHuawei.some(r => r.type === 'investment' || r.type === 'control')).toBe(false);
  });
  it('每家公司至少有一项可追溯动态，新增小米保持单一身份', () => {
    for (const company of dataset.companies) {
      const events = queryEvents(dataset.events, dataset.articles, [company.id]);
      expect(events.length, company.name).toBeGreaterThan(0);
      expect(events.every(e => e.articleIds.length > 0), company.name).toBe(true);
    }
    expect(dataset.companies.filter(c => c.id === 'xiaomi')).toHaveLength(1);
    expect(pairRelationships(dataset.relationships, ['xiaomi', 'zhipu'])).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'xiaomi', target: 'zhipu', type: 'investment', ownershipPercent: null }),
    ]));
  });
  it('正式资料满足全量门禁，小批资料不能作为正式发布', () => {
    expect(validateDataset(dataset)).toEqual([]);
    expect(validateDataset(dataset, true)).toEqual([]);
    expect(validateDataset({ ...dataset, companies: dataset.companies.slice(0, 8) }, true)).toContain('正式版本应包含 30–40 家公司');
  });
  it('拒绝不存在的日历日期', () => {
    expect(date.safeParse('2026-02-30').success).toBe(false);
    expect(date.safeParse('2024-02-29').success).toBe(true);
  });
  it('阻止重复身份、无效引用、自连与缺失来源', () => {
    const copy = structuredClone(dataset);
    copy.companies.push(copy.companies[0]);
    copy.relationships[0].source = 'missing';
    copy.relationships[1].target = copy.relationships[1].source;
    expect(validateDataset(copy)).toEqual(expect.arrayContaining([
      'companies: 重复 ID', 'companies: 重复公司身份',
      `${copy.relationships[0].id}: 无效公司引用`, `${copy.relationships[1].id}: 不能自连`,
    ]));
    copy.articles[0].url = '';
    expect(validateDataset(copy).length).toBeGreaterThan(0);
  });
  it('拒绝未知关系类型与市值口径缺失', () => {
    const copy: any = structuredClone(dataset);
    copy.relationships[0].type = 'co-mentioned';
    copy.companies[0].marketCap = { value: 100 };
    const errors = validateDataset(copy);
    expect(errors.some(e => e.startsWith('relationships.0.type'))).toBe(true);
    expect(errors.some(e => e.startsWith('companies.0.marketCap'))).toBe(true);
  });
});
