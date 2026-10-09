import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { articleById, companyById, dataset } from '../data';
import { layerLabels, relationLabels, statusLabels } from '../lib/constants';
import { pairRelationships, queryEvents } from '../lib/queries';
import type { Company, Relationship } from '../lib/schema';
import { EventList } from './EventList';

function Valuation({ company: c }: { company: Company }) {
  const m = c.marketCap;
  const v = c.valuation;
  return <section className="company-financials"><h3>市值与估值</h3>
    {m ? <><strong>约 {new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(m.rmbValue / 1e8)} 亿元人民币</strong><p>{m.date} · {m.basis}</p><p>原值：{m.value.toLocaleString('zh-CN')} {m.currency}；人民币转换率 {m.fxRate.toPrecision(8)}</p><a href={m.source.url} target="_blank" rel="noopener noreferrer">市值来源<ExternalLink size={12} /></a><a href={m.fxSource.url} target="_blank" rel="noopener noreferrer">转换依据<ExternalLink size={12} /></a></> : <p>无可比市值。当前资料未收录同日、同口径的上市公司市值。</p>}
    {v ? <p>融资估值：{v.value.toLocaleString('zh-CN')} {v.currency} · {v.date}。{v.note}<a href={v.source.url} target="_blank" rel="noopener noreferrer">估值来源<ExternalLink size={12} /></a></p> : null}
  </section>;
}
function RelationRow({ relation: r, onOpen, showNames = false }: { relation: Relationship; onOpen: (id: string) => void; showNames?: boolean }) {
  return <button className={`relation-row ${r.type}`} onClick={() => onOpen(r.id)}>
    <span className="relation-top"><strong>{relationLabels[r.type]}</strong><small>{r.confirmedOn} · {statusLabels[r.status]}</small></span>
    {showNames ? <span className="relation-parties">{companyById.get(r.source)!.name}{r.type === 'partnership' ? ' × ' : ' → '}{companyById.get(r.target)!.name}</span> : null}
    <span>{r.summary}</span><span className="relation-more">查看证据<ArrowRight size={13} /></span>
  </button>;
}
type Props = { selected: string[]; activeRelationship: string | null; onRelationship: (id: string | null) => void; onClear: () => void };
export function Inspector(p: Props) {
  const [tab, setTab] = useState<'shared' | 'individual'>('shared');
  const [collapsed, setCollapsed] = useState(false);
  const selected = p.selected.map(id => companyById.get(id)!);
  const relationship = dataset.relationships.find(r => r.id === p.activeRelationship);
  const pair = pairRelationships(dataset.relationships, p.selected);
  const shared = queryEvents(dataset.events, dataset.articles, p.selected, true);
  const isPair = selected.length === 2;
  const title = selected.map(c => c.name).join(' × ');
  const individual = (c: Company) => {
    const events = queryEvents(dataset.events, dataset.articles, [c.id]);
    return <section key={c.id} className="individual-news"><h3>{c.name}的动态</h3>{events.length ? <EventList events={events} /> : <p className="empty-text">当前资料未收录该公司的新闻动态。</p>}</section>;
  };
  return <aside className={`inspector ${selected.length ? 'has-selection' : ''} ${collapsed ? 'collapsed' : ''}`} aria-label="公司与关系详情">
    <button className="drawer-toggle" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? '展开详情' : '收起详情'}><span />{collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
    <div className="inspector-scroll">
      {!selected.length ? <div className="welcome-panel">
        <div className="section-label">探索产业联系</div><h2>从一家公司，<br />看见整个网络。</h2>
        <p>沿着五个产业层级，查看中国 AI 公司之间有出处的业务与资本关系。</p>
        <ol><li><span>01</span><div><strong>选择一家公司</strong><p>点击地图节点，或搜索公司名称。</p></div></li><li><span>02</span><div><strong>再选择另一家公司</strong><p>查看双方关系、共同报道与各自动态。</p></div></li><li><span>03</span><div><strong>沿着证据继续探索</strong><p>点击关系或报道，阅读原始来源。</p></div></li></ol>
        <p className="coverage-note">{dataset.metadata.coverage}</p>
      </div> : <>
        <div className="inspector-heading"><span className="section-label">{relationship ? '关系证据' : isPair ? '公司对照' : layerLabels[selected[0].layer]}</span><button className="icon-button" aria-label="清除选择" onClick={p.onClear}><X size={17} /></button></div>
        <h2>{title}</h2>
        {relationship ? <section className="relationship-detail">
          <button className="text-button" onClick={() => p.onRelationship(null)}><ArrowLeft size={14} />返回共同报道</button>
          <div className={`relation-type ${relationship.type}`}>{relationLabels[relationship.type]}</div>
          <h3>{companyById.get(relationship.source)!.name}{relationship.type === 'partnership' ? ' × ' : ' → '}{companyById.get(relationship.target)!.name}</h3>
          <p>{relationship.summary}</p>
          <dl><div><dt>状态</dt><dd>{statusLabels[relationship.status]}</dd></div><div><dt>确认日期</dt><dd>{relationship.confirmedOn}</dd></div>{relationship.effectiveOn ? <div><dt>发生 / 生效日期</dt><dd>{relationship.effectiveOn}</dd></div> : null}{relationship.ownershipPercent !== null ? <div><dt>持股记录</dt><dd>约 {relationship.ownershipPercent}% · {relationship.ownershipAsOf}</dd></div> : null}</dl>
          <p className="evidence-note">{relationship.note}</p>
          <h3>支持来源</h3>
          {relationship.evidenceArticleIds.map(id => { const a = articleById.get(id)!; return <div className="evidence-source" key={id}><time>{a.publishedOn}{a.historical ? ' · 历史依据' : ''}</time><h4>{a.title}</h4><p>{a.evidenceNote}</p><a href={a.url} target="_blank" rel="noopener noreferrer">{a.publisher} · 查看原文<ExternalLink size={13} /></a></div>; })}
        </section> : isPair ? <>
          <section className="pair-relations"><h3>已收录关系 <span className="count">{pair.length}</span></h3>
            {pair.length ? pair.map(r => <RelationRow key={r.id} relation={r} onOpen={id => p.onRelationship(id)} />) : <p className="empty-text">当前资料未收录两家公司的已确认关系。</p>}
            <p className="minor-note">这里展示双方全部关系，不受地图视图筛选影响。</p>
          </section>
          <div className="news-tabs" role="tablist" aria-label="公司新闻">
            <button role="tab" id="shared-tab" aria-selected={tab === 'shared'} aria-controls="news-content" onClick={() => setTab('shared')}>共同报道</button>
            <button role="tab" id="individual-tab" aria-selected={tab === 'individual'} aria-controls="news-content" onClick={() => setTab('individual')}>各自动态</button>
          </div>
          <div id="news-content" role="tabpanel" aria-labelledby={tab === 'shared' ? 'shared-tab' : 'individual-tab'}>
            {tab === 'shared' ? shared.length ? <EventList events={shared} /> : <div className="news-empty"><h3>暂未收录共同报道</h3><p>当前资料范围内未找到共同报道，不代表现实中不存在共同事件。</p><button className="text-button" onClick={() => setTab('individual')}>查看各自动态<ArrowRight size={14} /></button></div> : selected.map(individual)}
          </div>
          <p className="coverage-note">共同报道不等于已确认的业务或资本关系。</p>
        </> : <>
          <p className="english-name">{selected[0].englishName}</p><p className="company-description">{selected[0].description}</p>
          {selected[0].securities.length ? <p className="security-codes">{selected[0].securities.map(s => `${s.exchange} ${s.ticker}`).join(' · ')}</p> : null}
          <div className="role-tags">{selected[0].roles.map(role => <span key={role}>{role}</span>)}</div>
          <section><h3>主要产品 / 模型</h3><p>{selected[0].products.join(' · ')}</p></section>
          <Valuation company={selected[0]} />
          <details className="identity-details"><summary>公司身份与分类依据</summary><p>{selected[0].identityNote}</p><p>{selected[0].classificationReason}</p><p>{selected[0].region === 'mainland' ? '主要经营地域：中国大陆' : '主要经营地域：中国香港'}</p>{selected[0].securities.length ? <p>{selected[0].securities.map(s => `${s.exchange} ${s.ticker}`).join(' · ')}</p> : null}{selected[0].sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ExternalLink size={12} /></a>)}</details>
          <section><h3>已收录关系</h3>{dataset.relationships.filter(r => r.source === selected[0].id || r.target === selected[0].id).map(r => <RelationRow key={r.id} relation={r} showNames onOpen={id => p.onRelationship(id)} />)}{!dataset.relationships.some(r => r.source === selected[0].id || r.target === selected[0].id) ? <p className="empty-text">当前资料未收录该公司的已确认关系。</p> : null}</section>
          {individual(selected[0])}
        </>}
      </>}
    </div>
  </aside>;
}
