import { lazy, Suspense, useCallback, useState } from 'react';
import { dataset } from './data';
import { selectCompany } from './lib/queries';
import { viewTypes } from './lib/constants';
import type { RelationType, View } from './lib/schema';
import { SearchBox } from './components/SearchBox';
import { Toolbar } from './components/Toolbar';
import { Inspector } from './components/Inspector';
import { AboutDialog } from './components/AboutDialog';

const CompanyMap = lazy(() => import('./components/CompanyMap').then(module => ({ default: module.CompanyMap })));

export default function App() {
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<View>('industry');
  const [sizeMode, setSizeMode] = useState<'equal' | 'marketCap'>('equal');
  const [types, setTypes] = useState<RelationType[]>(viewTypes.industry);
  const [role, setRole] = useState('all');
  const [relationship, setRelationship] = useState<string | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const choose = useCallback((id: string) => { setSelected(s => selectCompany(s, id)); setRelationship(null); }, []);
  const openRelationship = useCallback((id: string | null) => {
    setRelationship(id);
    if (id) {
      const r = dataset.relationships.find(r => r.id === id)!;
      setSelected([r.source, r.target]);
    }
  }, []);
  const changeView = (value: View) => { setView(value); setTypes(viewTypes[value]); };
  const clear = () => { setSelected([]); setRelationship(null); };
  const reset = () => { clear(); setView('industry'); setTypes(viewTypes.industry); setRole('all'); setSizeMode('equal'); setResetVersion(n => n + 1); };
  return <div className="app-shell">
    <header className="app-header"><div className="brand"><h1>AI 经纬</h1><span>中国 AI 公司关系地图</span></div><SearchBox onSelect={choose} /><AboutDialog /></header>
    <main className="workspace">
      <section className="map-workspace" aria-label="公司关系探索">
        <Toolbar view={view} setView={changeView} sizeMode={sizeMode} setSizeMode={setSizeMode} types={types}
          toggleType={type => setTypes(current => current.includes(type) ? current.filter(t => t !== type) : [...current, type])}
          role={role} setRole={setRole} selected={selected} remove={choose} reset={reset} />
        <Suspense fallback={<div className="map-surface map-loading" role="status">正在载入公司地图…</div>}>
          <CompanyMap selected={selected} view={view} types={types} role={role} sizeMode={sizeMode} activeRelationship={relationship} resetVersion={resetVersion} onSelect={choose} onRelationship={openRelationship} />
        </Suspense>
        <footer className="map-footer"><span>固定资料快照 · 资料截至 <time>{dataset.metadata.cutoff}</time></span><span>新闻按原始发布时间排序</span></footer>
      </section>
      <Inspector key={selected.join(':')} selected={selected} activeRelationship={relationship} onRelationship={openRelationship} onClear={clear} />
    </main>
  </div>;
}
