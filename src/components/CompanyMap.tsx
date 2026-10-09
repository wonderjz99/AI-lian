import cytoscape, { type Core, type StylesheetJson } from 'cytoscape';
import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { dataset } from '../data';
import { layers, type RelationType, type View } from '../lib/schema';
import { layerLabels, relationLabels, viewTypes } from '../lib/constants';
import { nodeDiameter } from '../lib/queries';

const WIDTH = 1160, BAND = 164, HEIGHT = BAND * 5;
const positions = new Map(dataset.companies.map(c => {
  const group = dataset.companies.filter(other => other.layer === c.layer);
  const index = group.findIndex(other => other.id === c.id);
  const columns = group.length > 7 ? 6 : group.length;
  const row = Math.floor(index / columns);
  const rowCount = Math.min(columns, group.length - row * columns);
  return [c.id, {
    x: rowCount === 1 ? 660 : 250 + (index % columns) * (810 / Math.max(rowCount - 1, 1)),
    y: layers.indexOf(c.layer) * BAND + (group.length > 7 ? 40 + row * 79 : 74),
  }];
}));
const style: StylesheetJson = [
  { selector: 'node', style: {
    'background-color': '#e3e9f0', 'border-color': '#8a98aa', 'border-width': 1.2,
    width: 'data(diameter)', height: 'data(diameter)', label: 'data(label)',
    color: '#243146', 'font-size': 16, 'font-weight': 500,
    'font-family': 'system-ui, PingFang SC, Microsoft YaHei, sans-serif',
    'text-valign': 'bottom', 'text-margin-y': 10, 'text-halign': 'center',
    'overlay-opacity': 0, 'min-zoomed-font-size': 9,
  } },
  { selector: 'edge', style: {
    width: 1.3, 'line-color': '#b1bfd0', 'target-arrow-color': '#b1bfd0',
    'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'control-point-step-size': 80,
    'arrow-scale': 0.7, opacity: 0.5, 'overlay-opacity': 0,
    'font-size': 11, color: '#647084', 'text-rotation': 'autorotate',
    'text-background-color': '#f6f8fa', 'text-background-opacity': 0.92, 'text-background-padding': '3px',
  } },
  { selector: 'edge[type="partnership"]', style: { 'line-style': 'dashed', 'target-arrow-shape': 'none', 'line-color': '#159ba6' } },
  { selector: 'edge[type="control"]', style: { 'line-color': '#8564b2', 'target-arrow-color': '#8564b2', width: 2.2 } },
  { selector: 'edge[type="investment"]', style: { 'line-color': '#8564b2', 'target-arrow-color': '#8564b2', 'line-style': 'dashed' } },
  { selector: '.dim', style: { opacity: 0.30, 'text-opacity': 0.8 } },
  { selector: 'node.chosen', style: { 'background-color': '#e4edff', 'border-color': '#0755ef', 'border-width': 3.2, color: '#0755ef', 'font-weight': 700, opacity: 1, 'text-opacity': 1 } },
  { selector: 'node.neighbor', style: { 'border-color': '#7b9acb', opacity: 1 } },
  { selector: 'node.no-cap', style: { 'border-style': 'dashed', 'border-width': 1.8 } },
  { selector: 'edge.highlight', style: { opacity: 0.92, width: 2.1 } },
  { selector: 'edge.direct', style: { label: 'data(label)', opacity: 1, width: 2.7, 'font-weight': 600 } },
  { selector: 'edge.inspect', style: { label: 'data(label)', width: 3.2, opacity: 1 } },
  { selector: '.hidden', style: { display: 'none' } },
];

type Props = {
  selected: string[]; view: View; types: RelationType[]; role: string;
  sizeMode: 'equal' | 'marketCap'; activeRelationship: string | null; resetVersion: number;
  onSelect: (id: string) => void; onRelationship: (id: string) => void;
};
export function CompanyMap(p: Props) {
  const host = useRef<HTMLDivElement>(null);
  const bands = useRef<HTMLDivElement>(null);
  const core = useRef<Core | null>(null);
  const callbacks = useRef(p);
  callbacks.current = p;
  const [zoom, setZoom] = useState(100);
  const fit = (showAll = false) => {
    const cy = core.current;
    if (!cy || !host.current) return;
    const available = host.current.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const scale = mobile && !showAll ? 0.72 : Math.max(0.28, Math.min((available.width - 28) / WIDTH, (available.height - 40) / HEIGHT, 1.25));
    cy.viewport({ zoom: scale, pan: mobile && !showAll ? { x: 0, y: 12 } : { x: (available.width - WIDTH * scale) / 2, y: Math.max(18, (available.height - HEIGHT * scale) / 2) } });
    if (mobile && !showAll && callbacks.current.selected.length) cy.center(cy.getElementById(callbacks.current.selected.at(-1)!));
  };
  useEffect(() => {
    if (!host.current) return;
    const cy = cytoscape({ container: host.current, layout: { name: 'preset' }, style,
      elements: [
        ...dataset.companies.map(c => ({ data: { id: c.id, label: c.name, diameter: 36 }, position: positions.get(c.id) })),
        ...dataset.relationships.map(r => ({ data: { id: r.id, source: r.source, target: r.target, type: r.type, label: relationLabels[r.type] } })),
      ], minZoom: 0.25, maxZoom: 2.5,
      autoungrabify: true, autounselectify: true, boxSelectionEnabled: false,
    });
    core.current = cy;
    let previousScale = 0;
    const viewport = () => {
      if (bands.current) {
        bands.current.style.transform = `translate(${cy.pan().x}px, ${cy.pan().y}px) scale(${cy.zoom()})`;
        bands.current.style.setProperty('--map-scale', String(cy.zoom()));
      }
      if (previousScale !== cy.zoom()) {
        const desktop = window.innerWidth > 760;
        cy.batch(() => {
          cy.nodes().style('font-size', desktop ? Math.max(16, 12 / cy.zoom()) : 16);
          cy.edges().style('font-size', desktop ? Math.max(11, 10 / cy.zoom()) : 11);
        });
        previousScale = cy.zoom();
      }
      setZoom(Math.round(cy.zoom() * 100));
    };
    cy.on('viewport', viewport);
    cy.on('tap', 'node', e => callbacks.current.onSelect(e.target.id()));
    cy.on('tap', 'edge', e => callbacks.current.onRelationship(e.target.id()));
    cy.on('mouseover', 'node, edge', () => { if (host.current) host.current.style.cursor = 'pointer'; });
    cy.on('mouseout', 'node, edge', () => { if (host.current) host.current.style.cursor = 'grab'; });
    const observer = new ResizeObserver(() => { cy.resize(); fit(); });
    observer.observe(host.current);
    fit(); viewport();
    return () => { observer.disconnect(); cy.destroy(); core.current = null; };
  }, []);
  useEffect(() => {
    const cy = core.current;
    if (!cy) return;
    const allowed = new Set(viewTypes[p.view].filter(t => p.types.includes(t)));
    const roleIds = new Set(dataset.companies.filter(c => p.role === 'all' || c.roles.includes(p.role)).map(c => c.id));
    const visible = dataset.relationships.filter(r => allowed.has(r.type) && roleIds.has(r.source) && roleIds.has(r.target));
    const neighbors = new Set(p.selected);
    visible.forEach(r => { if (p.selected.includes(r.source) || p.selected.includes(r.target)) { neighbors.add(r.source); neighbors.add(r.target); } });
    cy.batch(() => {
      cy.elements().removeClass('chosen neighbor dim hidden highlight direct inspect no-cap');
      dataset.companies.forEach(c => {
        const node = cy.getElementById(c.id);
        node.data('diameter', nodeDiameter(c, p.sizeMode));
        if (p.sizeMode === 'marketCap' && c.marketCap === null) node.addClass('no-cap');
        if (!roleIds.has(c.id) && !p.selected.includes(c.id)) node.addClass('dim');
        if (p.selected.length && !neighbors.has(c.id)) node.addClass('dim');
        if (neighbors.has(c.id) && !p.selected.includes(c.id)) node.addClass('neighbor');
        if (p.selected.includes(c.id)) node.addClass('chosen');
      });
      dataset.relationships.forEach(r => {
        const edge = cy.getElementById(r.id);
        if (!visible.some(v => v.id === r.id)) edge.addClass('hidden');
        else if (p.selected.length) {
          if (p.selected.includes(r.source) || p.selected.includes(r.target)) edge.addClass('highlight');
          else edge.addClass('dim');
          if (p.selected.includes(r.source) && p.selected.includes(r.target)) edge.addClass('direct');
        }
        if (r.id === p.activeRelationship) edge.addClass('inspect');
      });
    });
  }, [p.selected, p.view, p.types, p.role, p.sizeMode, p.activeRelationship]);
  useEffect(() => { fit(); }, [p.resetVersion]);
  useEffect(() => {
    if (p.selected.length && window.matchMedia('(max-width: 760px)').matches) core.current?.center(core.current.getElementById(p.selected.at(-1)!));
  }, [p.selected]);
  const zoomBy = (factor: number) => {
    const cy = core.current;
    if (cy) cy.zoom({ level: Math.max(cy.minZoom(), Math.min(cy.maxZoom(), cy.zoom() * factor)), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };
  return <div className="map-surface">
    <div className="map-bands" ref={bands} style={{ width: WIDTH, height: HEIGHT }} aria-hidden="true">
      {layers.map((layer, index) => <div className="map-band" style={{ height: BAND }} key={layer}><span>{String(index + 1).padStart(2, '0')}</span><strong>{layerLabels[layer]}</strong></div>)}
    </div>
    <div className="cytoscape-host" ref={host} role="img" aria-label={`五层公司地图，${p.view === 'industry' ? '产业关系' : '资本关系'}。可拖动和缩放，也可通过顶部搜索选择公司。`} />
    <div className="map-controls">
      <button className="icon-button" aria-label="放大地图" onClick={() => zoomBy(1.25)}><Plus /></button>
      <button className="icon-button" aria-label="缩小地图" onClick={() => zoomBy(0.8)}><Minus /></button>
      <button className="icon-button" aria-label="显示全图" onClick={() => fit(true)}><Maximize size={17} /></button>
      <span aria-label="缩放比例">{zoom}%</span>
    </div>
    <div className="map-legend">
      <div>{viewTypes[p.view].map(t => <span key={t}><i className={`legend-line ${t}`} />{relationLabels[t]}</span>)}</div>
      {p.sizeMode === 'marketCap' ? <p>面积按市值对数压缩，非严格比例 · 虚线圆：无可比市值</p> : <p>节点等大 · 箭头由提供方 / 投资方指向对方</p>}
      {p.sizeMode === 'marketCap' ? <p>市值快照 {dataset.metadata.marketCapDate ?? '未收录'} · {dataset.companies.filter(c => c.marketCap).length}/{dataset.companies.length} 家有可比数据</p> : null}
      {p.role !== 'all' ? <p>角色筛选：{p.role}；未匹配公司淡化，已选公司保留</p> : null}
    </div>
    <details className="accessible-companies"><summary>公司文字列表</summary><div>{dataset.companies.map(c => <button key={c.id} onClick={() => p.onSelect(c.id)} aria-pressed={p.selected.includes(c.id)}>{c.name}</button>)}</div></details>
  </div>;
}
