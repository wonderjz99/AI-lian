import { RotateCcw, X } from 'lucide-react';
import { companyById } from '../data';
import { relationLabels, viewTypes, layerLabels } from '../lib/constants';
import { layers, type RelationType, type View } from '../lib/schema';

type Props = {
  view: View; setView: (view: View) => void;
  sizeMode: 'equal' | 'marketCap'; setSizeMode: (mode: 'equal' | 'marketCap') => void;
  types: RelationType[]; toggleType: (type: RelationType) => void;
  role: string; setRole: (role: string) => void;
  selected: string[]; remove: (id: string) => void; reset: () => void;
};
export function Toolbar(p: Props) {
  return <>
    <div className="toolbar">
      <div className="view-switch" role="group" aria-label="关系视图">
        <button aria-pressed={p.view === 'industry'} className={p.view === 'industry' ? 'selected' : ''} onClick={() => p.setView('industry')}>产业关系</button>
        <button aria-pressed={p.view === 'capital'} className={p.view === 'capital' ? 'selected' : ''} onClick={() => p.setView('capital')}>资本关系</button>
      </div>
      <label className="select-control"><span>节点</span><select aria-label="节点大小" value={p.sizeMode} onChange={e => p.setSizeMode(e.target.value as Props['sizeMode'])}>
        <option value="equal">等大</option><option value="marketCap">市值</option>
      </select></label>
      <label className="select-control role-control"><select aria-label="角色筛选" value={p.role} onChange={e => p.setRole(e.target.value)}>
        <option value="all">全部角色</option>{layers.map(l => <option key={l} value={layerLabels[l]}>{layerLabels[l]}</option>)}
      </select></label>
      <button className="reset-button" aria-label="重置" title="重置" onClick={p.reset}><RotateCcw size={15} /><span>重置</span></button>
    </div>
    <div className="selection-bar">
      <div className="selection-items" aria-label="已选公司" aria-live="polite">
        <span className="selection-label">已选公司</span>
        {p.selected.length ? p.selected.map(id => <button className="company-chip" key={id} onClick={() => p.remove(id)} aria-label={`取消选择${companyById.get(id)!.name}`}>
          {companyById.get(id)!.name}<X size={13} />
        </button>) : <span className="selection-hint">点选任意两家公司，查看关系与共同报道</span>}
      </div>
      <div className="type-filters" role="group" aria-label="关系类型筛选">
        {viewTypes[p.view].map(t => <label key={t}><input type="checkbox" checked={p.types.includes(t)} onChange={() => p.toggleType(t)} />{relationLabels[t]}</label>)}
      </div>
    </div>
  </>;
}
