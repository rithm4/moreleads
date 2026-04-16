import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Users, FolderKanban, TrendingUp, Plus, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/* ─── constants ─── */
const NODE_TYPES = {
  note:    { bg: '#EFE347', text: '#121721', icon: FileText,     label: 'Notiță' },
  contact: { bg: '#3462EE', text: '#ffffff', icon: Users,        label: 'Contact' },
  project: { bg: '#4A91A8', text: '#ffffff', icon: FolderKanban, label: 'Proiect' },
  deal:    { bg: '#1e2a3a', text: '#ffffff', icon: TrendingUp,   label: 'Deal' },
};

const COLOR_PALETTE = [
  '#EFE347','#3462EE','#4A91A8','#1e2a3a',
  '#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#ec4899','#06b6d4','#f97316','#e2e8f0',
];

const SIZE_OPTIONS = [
  { label: 'S',  value: 150 },
  { label: 'M',  value: 200 },
  { label: 'L',  value: 280 },
  { label: 'XL', value: 360 },
];

const DEFAULT_W = 200;

/* ─── helpers ─── */
function autoText(hex) {
  try {
    const h = (hex || '').replace('#', '').padEnd(6, '0');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 0.55 ? '#121721' : '#ffffff';
  } catch { return '#ffffff'; }
}

function nodeMid(node) {
  const w = node.node_width || DEFAULT_W;
  return { x: node.pos_x + w / 2, y: node.pos_y + 55 };
}

function bezier(ax, ay, bx, by) {
  const dx = Math.abs(bx - ax) * 0.55;
  return `M ${ax},${ay} C ${ax + dx},${ay} ${bx - dx},${by} ${bx},${by}`;
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getNodeId(el) {
  let cur = el;
  while (cur && cur !== document.body) {
    if (cur.dataset?.nodeid) return Number(cur.dataset.nodeid);
    cur = cur.parentElement;
  }
  return null;
}

/* ─── NodeCard ─── */
function NodeCard({ node, selected, onPointerDown, onEdit, onDelete, onHandlePointerDown }) {
  const meta  = NODE_TYPES[node.type] || NODE_TYPES.note;
  const Icon  = meta.icon;
  const bg    = node.color || meta.bg;
  const col   = node.color ? autoText(node.color) : meta.text;
  const w     = node.node_width || DEFAULT_W;

  return (
    <div
      className={`cv-node ${selected ? 'selected' : ''}`}
      data-nodeid={node.id}
      style={{ left: node.pos_x, top: node.pos_y, width: w, background: bg, color: col }}
      onPointerDown={e => onPointerDown(e, node.id)}
      onDoubleClick={e => { e.stopPropagation(); onEdit(node); }}
    >
      <div className="cv-node-hd">
        <Icon size={13} opacity={0.7} />
        <span className="cv-node-title">{node.title}</span>
        <button
          className="cv-node-del"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(node.id); }}
        >
          <X size={11} />
        </button>
      </div>
      {node.body && <p className="cv-node-body">{node.body}</p>}

      {/* connection handles */}
      {['top', 'right', 'bottom', 'left'].map(side => (
        <div
          key={side}
          className={`cv-handle cv-handle-${side}`}
          onPointerDown={e => { e.stopPropagation(); onHandlePointerDown(e, node.id); }}
        />
      ))}
    </div>
  );
}

/* ─── EdgeLayer — SVG sibling to cv-world ─── */
function EdgeLayer({ nodes, edges, pan, zoom, onDeleteEdge, pendingSource, cursorPos }) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));
  const tf  = `translate(${pan.x} ${pan.y}) scale(${zoom})`;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        <marker id="cv-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill="rgba(255,255,255,.55)" />
        </marker>
      </defs>

      <g transform={tf}>
        {edges.map(e => {
          const s = map[e.source_id], t = map[e.target_id];
          if (!s || !t) return null;
          const sm = nodeMid(s), tm = nodeMid(t);
          return (
            <g key={e.id} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={() => onDeleteEdge(e.id)}>
              {/* fat invisible hit zone */}
              <path d={bezier(sm.x, sm.y, tm.x, tm.y)} stroke="transparent" strokeWidth={16} fill="none" />
              <path
                d={bezier(sm.x, sm.y, tm.x, tm.y)}
                stroke="rgba(255,255,255,.45)"
                strokeWidth={2}
                fill="none"
                strokeDasharray="6 3"
                markerEnd="url(#cv-arr)"
              />
              {e.label && (
                <text
                  x={(sm.x + tm.x) / 2} y={(sm.y + tm.y) / 2 - 7}
                  textAnchor="middle" fontSize={10} fill="rgba(255,255,255,.55)"
                >{e.label}</text>
              )}
            </g>
          );
        })}

        {/* live preview while dragging a new edge */}
        {pendingSource !== null && cursorPos && (() => {
          const s = map[pendingSource];
          if (!s) return null;
          const sm = nodeMid(s);
          return (
            <path
              d={bezier(sm.x, sm.y, cursorPos.x, cursorPos.y)}
              stroke="rgba(255,255,255,.65)"
              strokeWidth={2}
              fill="none"
              strokeDasharray="4 3"
            />
          );
        })()}
      </g>
    </svg>
  );
}

/* ─── AddNodeModal ─── */
function AddNodeModal({ onAdd, onClose }) {
  const [type,  setType]  = useState('note');
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) { toast.error('Adaugă un titlu'); return; }
    onAdd({ type, title: title.trim(), body: body.trim() });
  }

  return (
    <div className="cv-modal-bg" onClick={onClose}>
      <div className="cv-modal" onClick={e => e.stopPropagation()}>
        <div className="cv-modal-hd"><span>Nod nou</span><button onClick={onClose}><X size={16} /></button></div>
        <form onSubmit={submit} className="cv-modal-form">
          <div className="cv-modal-types">
            {Object.entries(NODE_TYPES).map(([k, v]) => {
              const Icon = v.icon;
              return (
                <button key={k} type="button"
                  className={`cv-type-btn ${type === k ? 'active' : ''}`}
                  style={type === k ? { background: v.bg, color: v.text } : {}}
                  onClick={() => setType(k)}>
                  <Icon size={13} /> {v.label}
                </button>
              );
            })}
          </div>
          <input className="cv-input" placeholder="Titlu *" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="cv-input cv-textarea" placeholder="Conținut (opțional)" value={body} onChange={e => setBody(e.target.value)} rows={3} />
          <button className="cv-submit-btn" type="submit">Adaugă</button>
        </form>
      </div>
    </div>
  );
}

/* ─── EditNodeModal ─── */
function EditNodeModal({ node, onSave, onClose }) {
  const meta  = NODE_TYPES[node.type] || NODE_TYPES.note;
  const [title,  setTitle]  = useState(node.title);
  const [body,   setBody]   = useState(node.body || '');
  const [color,  setColor]  = useState(node.color || meta.bg);
  const [width,  setWidth]  = useState(node.node_width || DEFAULT_W);
  const [custom, setCustom] = useState(node.color || meta.bg);

  function pickColor(c) { setColor(c); setCustom(c); }

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) { toast.error('Titlul este obligatoriu'); return; }
    onSave(node.id, { title: title.trim(), body: body.trim(), color, node_width: width });
  }

  return (
    <div className="cv-modal-bg" onClick={onClose}>
      <div className="cv-modal" onClick={e => e.stopPropagation()}>
        <div className="cv-modal-hd" style={{ background: color, color: autoText(color) }}>
          <span>Editează nod</span>
          <button onClick={onClose} style={{ color: autoText(color) }}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="cv-modal-form">
          <input className="cv-input" placeholder="Titlu *" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="cv-input cv-textarea" placeholder="Conținut" value={body} onChange={e => setBody(e.target.value)} rows={3} />

          <div>
            <div className="cv-label">Culoare</div>
            <div className="cv-color-grid">
              {COLOR_PALETTE.map(c => (
                <div key={c}
                  className={`cv-color-swatch ${color === c ? 'active' : ''}`}
                  style={{ background: c, border: c === '#e2e8f0' ? '1px solid rgba(255,255,255,.15)' : 'none' }}
                  onClick={() => pickColor(c)}
                />
              ))}
              <input
                type="color"
                className="cv-color-custom"
                value={custom.match(/^#[0-9a-f]{6}$/i) ? custom : '#3462EE'}
                onChange={e => pickColor(e.target.value)}
                title="Culoare personalizată"
              />
            </div>
          </div>

          <div>
            <div className="cv-label">Mărime</div>
            <div className="cv-size-btns">
              {SIZE_OPTIONS.map(s => (
                <button key={s.value} type="button"
                  className={`cv-size-btn ${width === s.value ? 'active' : ''}`}
                  onClick={() => setWidth(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button className="cv-submit-btn" type="submit">Salvează</button>
        </form>
      </div>
    </div>
  );
}

/* ═══ CanvasPage ═══ */
export default function CanvasPage() {
  const [nodes,   setNodes]   = useState([]);
  const [edges,   setEdges]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [pan,     setPan]     = useState({ x: 60, y: 60 });
  const [zoom,    setZoom]    = useState(1);

  // live edge drag preview
  const [pendingSource, setPendingSource] = useState(null);
  const [cursorPos,     setCursorPos]     = useState(null);

  const [selected, setSelected] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editNode, setEditNode] = useState(null);

  const canvasRef  = useRef(null);
  const nodesRef   = useRef(nodes);
  const panRef     = useRef(pan);
  const zoomRef    = useRef(zoom);
  const saveTimers = useRef({});
  const touchState = useRef(null); // for pinch zoom

  useEffect(() => { nodesRef.current   = nodes; }, [nodes]);
  useEffect(() => { panRef.current     = pan;   }, [pan]);
  useEffect(() => { zoomRef.current    = zoom;  }, [zoom]);

  /* ── load ── */
  useEffect(() => {
    api.get('/canvas')
      .then(r => { setNodes(r.data.nodes); setEdges(r.data.edges); })
      .catch(() => toast.error('Nu am putut încărca canvas-ul'))
      .finally(() => setLoading(false));
  }, []);

  /* ── helpers ── */
  function clientToCanvas(clientX, clientY) {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = panRef.current, z = zoomRef.current;
    return { x: (clientX - rect.left - p.x) / z, y: (clientY - rect.top - p.y) / z };
  }

  /* ── node drag — window listeners, no pointer capture ── */
  function onNodePointerDown(e, id) {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelected(id);

    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    const startMx = e.clientX, startMy = e.clientY;
    const startPx = node.pos_x,  startPy = node.pos_y;
    let moved = false;

    function onMove(ev) {
      moved = true;
      const z  = zoomRef.current;
      const dx = (ev.clientX - startMx) / z;
      const dy = (ev.clientY - startMy) / z;
      setNodes(prev => prev.map(n => n.id === id ? { ...n, pos_x: startPx + dx, pos_y: startPy + dy } : n));
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      if (moved) {
        const latest = nodesRef.current.find(n => n.id === id);
        if (latest) {
          clearTimeout(saveTimers.current[id]);
          saveTimers.current[id] = setTimeout(() => {
            api.patch(`/canvas/nodes/${id}`, { pos_x: latest.pos_x, pos_y: latest.pos_y }).catch(() => {});
          }, 300);
        }
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }

  /* ── handle drag (edge creation) ── */
  function onHandlePointerDown(e, sourceId) {
    if (e.button !== 0) return;
    e.stopPropagation();
    setPendingSource(sourceId);
    setCursorPos(clientToCanvas(e.clientX, e.clientY));

    function onMove(ev) {
      setCursorPos(clientToCanvas(ev.clientX, ev.clientY));
    }

    async function onUp(ev) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      setPendingSource(null);
      setCursorPos(null);

      const el       = document.elementFromPoint(ev.clientX, ev.clientY);
      const targetId = el ? getNodeId(el) : null;
      if (targetId !== null && targetId !== sourceId) {
        try {
          const r = await api.post('/canvas/edges', { source_id: sourceId, target_id: targetId });
          setEdges(prev => prev.find(x => x.id === r.data.id) ? prev : [...prev, r.data]);
        } catch { toast.error('Eroare la conectare'); }
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }

  /* ── canvas pan — window listeners ── */
  function onBgPointerDown(e) {
    if (e.button !== 0) return;
    setSelected(null);
    const startMx = e.clientX, startMy = e.clientY;
    const startPx = panRef.current.x, startPy = panRef.current.y;

    function onMove(ev) {
      setPan({ x: startPx + (ev.clientX - startMx), y: startPy + (ev.clientY - startMy) });
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }

  /* ── mouse wheel zoom ── */
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.09;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    // read current values from refs so both updates use consistent state
    const z  = zoomRef.current;
    const p  = panRef.current;
    const nz = Math.min(4, Math.max(0.1, z * factor));
    setZoom(nz);
    setPan({
      x: mx - (mx - p.x) * (nz / z),
      y: my - (my - p.y) * (nz / z),
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  /* ── touch pinch zoom ── */
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchState.current = {
        dist: getTouchDist(e.touches),
        zoom: zoomRef.current,
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && touchState.current) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const scale   = newDist / touchState.current.dist;
      const nz      = Math.min(4, Math.max(0.1, touchState.current.zoom * scale));
      const rect    = canvasRef.current.getBoundingClientRect();
      const mx      = touchState.current.midX - rect.left;
      const my      = touchState.current.midY - rect.top;
      const oz      = touchState.current.zoom;
      setZoom(nz);
      setPan({
        x: mx - (mx - touchState.current.panX) * (nz / oz),
        y: my - (my - touchState.current.panY) * (nz / oz),
      });
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) touchState.current = null;
  }

  /* ── add node ── */
  async function handleAddNode({ type, title, body }) {
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    const cx = (cw / 2 - pan.x) / zoom - DEFAULT_W / 2;
    const cy = (ch / 2 - pan.y) / zoom - 55;
    try {
      const r = await api.post('/canvas/nodes', { type, title, body, pos_x: cx, pos_y: cy });
      setNodes(prev => [...prev, r.data]);
      setShowAdd(false);
    } catch { toast.error('Eroare la creare nod'); }
  }

  /* ── edit node ── */
  async function handleEditSave(id, data) {
    try {
      const r = await api.patch(`/canvas/nodes/${id}`, data);
      setNodes(prev => prev.map(n => n.id === id ? r.data : n));
      setEditNode(null);
    } catch { toast.error('Eroare la salvare'); }
  }

  /* ── delete node ── */
  async function handleDeleteNode(id) {
    await api.delete(`/canvas/nodes/${id}`).catch(() => {});
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source_id !== id && e.target_id !== id));
  }

  /* ── delete edge ── */
  async function handleDeleteEdge(id) {
    await api.delete(`/canvas/edges/${id}`).catch(() => {});
    setEdges(prev => prev.filter(e => e.id !== id));
  }

  /* ── fit view ── */
  function fitView() {
    if (!nodes.length) { setPan({ x: 60, y: 60 }); setZoom(1); return; }
    const minX = Math.min(...nodes.map(n => n.pos_x));
    const minY = Math.min(...nodes.map(n => n.pos_y));
    const maxX = Math.max(...nodes.map(n => n.pos_x + (n.node_width || DEFAULT_W)));
    const maxY = Math.max(...nodes.map(n => n.pos_y + 120));
    const cw   = canvasRef.current.clientWidth;
    const ch   = canvasRef.current.clientHeight;
    const z    = Math.min(2, 0.85 * Math.min(cw / (maxX - minX + 80), ch / (maxY - minY + 80)));
    setPan({ x: (cw - (maxX + minX) * z) / 2, y: (ch - (maxY + minY) * z) / 2 });
    setZoom(z);
  }

  if (loading) return <div className="cv-loading">Se încarcă canvas-ul...</div>;

  return (
    <div className="cv-page">
      {/* toolbar */}
      <div className="cv-toolbar">
        <span className="cv-toolbar-title"><span className="cv-dot" />Canvas</span>
        <div className="cv-toolbar-actions">
          <button className="cv-tb-btn" onClick={() => { const nz = Math.min(4, zoom * 1.2); const cw = canvasRef.current.clientWidth / 2; const ch = canvasRef.current.clientHeight / 2; setPan(p => ({ x: cw - (cw - p.x) * (nz / zoom), y: ch - (ch - p.y) * (nz / zoom) })); setZoom(nz); }} title="Zoom in"><ZoomIn size={15} /></button>
          <button className="cv-tb-btn" onClick={() => { const nz = Math.max(0.1, zoom / 1.2); const cw = canvasRef.current.clientWidth / 2; const ch = canvasRef.current.clientHeight / 2; setPan(p => ({ x: cw - (cw - p.x) * (nz / zoom), y: ch - (ch - p.y) * (nz / zoom) })); setZoom(nz); }} title="Zoom out"><ZoomOut size={15} /></button>
          <button className="cv-tb-btn" onClick={fitView} title="Fit în ecran"><Maximize2 size={15} /></button>
          <button className="cv-tb-btn primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Nod nou</button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={canvasRef}
        className="cv-canvas"
        onPointerDown={onBgPointerDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* ── edges SVG — direct child of canvas, NOT inside cv-world ── */}
        <EdgeLayer
          nodes={nodes}
          edges={edges}
          pan={pan}
          zoom={zoom}
          onDeleteEdge={handleDeleteEdge}
          pendingSource={pendingSource}
          cursorPos={cursorPos}
        />

        {/* ── world (nodes) ── */}
        <div
          className="cv-world"
          style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selected === node.id}
              onPointerDown={onNodePointerDown}
              onEdit={setEditNode}
              onDelete={handleDeleteNode}
              onHandlePointerDown={onHandlePointerDown}
            />
          ))}
        </div>

        {!nodes.length && (
          <div className="cv-empty">
            <div className="cv-empty-icon">◈</div>
            <p>Canvas gol</p>
            <p style={{ opacity: .55, fontSize: 13 }}>Adaugă primul nod cu butonul din dreapta sus</p>
          </div>
        )}
      </div>

      <div className="cv-zoom-badge">{Math.round(zoom * 100)}%</div>
      <div className="cv-help-hint">Trage de pe ● pentru a conecta &nbsp;·&nbsp; Dublu-click pentru editare &nbsp;·&nbsp; Scroll / pinch pentru zoom</div>

      {showAdd  && <AddNodeModal onAdd={handleAddNode}   onClose={() => setShowAdd(false)} />}
      {editNode && <EditNodeModal node={editNode} onSave={handleEditSave} onClose={() => setEditNode(null)} />}
    </div>
  );
}
