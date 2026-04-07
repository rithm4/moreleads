import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, TrendingUp, CheckSquare, FileText } from 'lucide-react';
import api from '../../api/axios';

const ICONS = { contact: Users, deal: TrendingUp, task: CheckSquare, note: FileText };
const TYPE_LABEL = { contact: 'Contact', deal: 'Deal', task: 'Task', note: 'Notiță' };
const TYPE_COLOR = { contact: '#3b82f6', deal: '#8b5cf6', task: '#f59e0b', note: '#10b981' };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const search = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const [contacts, deals, tasks, notes] = await Promise.all([
        api.get('/contacts'),
        api.get('/deals'),
        api.get('/tasks'),
        api.get('/notes'),
      ]);
      const ql = q.toLowerCase();
      const matches = [
        ...contacts.data.filter(c => c.name.toLowerCase().includes(ql) || (c.company||'').toLowerCase().includes(ql) || (c.email||'').toLowerCase().includes(ql))
          .map(c => ({ type: 'contact', id: c.id, title: c.name, sub: c.company || c.email || '' })),
        ...deals.data.filter(d => d.title.toLowerCase().includes(ql) || (d.contact_name||'').toLowerCase().includes(ql))
          .map(d => ({ type: 'deal', id: d.id, title: d.title, sub: d.contact_name || '' })),
        ...tasks.data.filter(t => t.title.toLowerCase().includes(ql) || (t.description||'').toLowerCase().includes(ql))
          .map(t => ({ type: 'task', id: t.id, title: t.title, sub: t.assigned_name || '' })),
        ...notes.data.filter(n => n.title.toLowerCase().includes(ql) || (n.body||'').toLowerCase().includes(ql))
          .map(n => ({ type: 'note', id: n.id, title: n.title, sub: n.owner_name || '' })),
      ].slice(0, 8);
      setResults(matches);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const goTo = (item) => {
    setOpen(false); setQuery(''); setResults([]);
    const paths = { contact: `/contacts/${item.id}`, deal: '/pipeline', task: '/tasks', note: '/notes' };
    navigate(paths[item.type]);
  };

  return (
    <div className="global-search">
      <button className="global-search-btn" onClick={() => setOpen(true)} aria-label="Caută">
        <Search size={17} />
      </button>

      {open && (
        <div className="global-search-overlay" onClick={() => setOpen(false)}>
          <div className="global-search-box" onClick={e => e.stopPropagation()}>
            <div className="global-search-input-row">
              <Search size={16} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Caută contacte, deal-uri, taskuri, notițe..."
                className="global-search-input"
              />
              {query && <button onClick={() => { setQuery(''); setResults([]); }} className="global-search-clear"><X size={15} /></button>}
            </div>

            {query.length >= 2 && (
              <div className="global-search-results">
                {loading ? (
                  <div className="global-search-empty">Se caută...</div>
                ) : results.length === 0 ? (
                  <div className="global-search-empty">Niciun rezultat pentru „{query}"</div>
                ) : results.map((item, i) => {
                  const Icon = ICONS[item.type];
                  return (
                    <button key={i} className="global-search-result" onClick={() => goTo(item)}>
                      <span className="global-search-icon" style={{ background: TYPE_COLOR[item.type] + '18', color: TYPE_COLOR[item.type] }}>
                        <Icon size={13} />
                      </span>
                      <span className="global-search-result-body">
                        <span className="global-search-result-title">{item.title}</span>
                        {item.sub && <span className="global-search-result-sub">{item.sub}</span>}
                      </span>
                      <span className="global-search-type-label">{TYPE_LABEL[item.type]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
