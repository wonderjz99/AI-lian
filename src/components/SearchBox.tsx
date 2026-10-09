import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { dataset } from '../data';
import { searchCompanies } from '../lib/queries';
import { layerLabels } from '../lib/constants';

export function SearchBox({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = searchCompanies(dataset.companies, query);
  const choose = (id: string) => { onSelect(id); setQuery(''); setOpen(false); setActive(0); };
  return <div className="search-box" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <Search aria-hidden="true" size={19} />
    <input aria-label="搜索公司、英文名或别名" placeholder="搜索公司、英文名或别名" role="combobox"
      aria-expanded={open && !!query.trim()} aria-controls="company-results" aria-autocomplete="list"
      aria-activedescendant={open && results[active] ? `search-${results[active].id}` : undefined}
      value={query} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }}
      onKeyDown={e => {
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
        if (e.key === 'Enter' && results[active]) { e.preventDefault(); choose(results[active].id); }
      }} />
    {query ? <button className="icon-button search-clear" aria-label="清空搜索" onClick={() => setQuery('')}><X size={15} /></button> : null}
    {open && query.trim() ? <div id="company-results" className="search-results" role="listbox" aria-label="公司搜索结果">
      {results.length ? results.map((c, index) => <button id={`search-${c.id}`} key={c.id} role="option" aria-selected={index === active}
        className={index === active ? 'active' : ''} onMouseDown={e => e.preventDefault()} onClick={() => choose(c.id)}>
        <span><strong>{c.name}</strong><small>{c.englishName}</small></span><small>{layerLabels[c.layer]}</small>
      </button>) : <p className="search-empty">当前名单未收录匹配的公司</p>}
    </div> : null}
  </div>;
}
