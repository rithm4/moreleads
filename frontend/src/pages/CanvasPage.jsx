import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Users, FolderKanban, TrendingUp, Plus, X, Trash2, Link, Unlink, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/* ─── constants ─── */
const NODE_COLORS = {
  note:    { bg: '#EFE347', text: '#121721', icon: FileText,    label: 'Notiță' },
  contact: { bg: '#3462EE', text: '#fff',    icon: Users,       label: 'Contact' },
  project: { bg: '#4A91A8', text: '#fff',    icon: FolderKanban,label: 'Proiect' },
  deal:    { bg: '#121721', text: '#fff',    icon: TrendingUp,  label: 'Deal' },
};
const NODE_W = 200;
const NODE_H = 110;
const HANDLE_SIZE = 12;

/* ─── helpers ─── */
function mid(node) {
  return { x: node.pos_x + NODE_W / 2, y: node.pos_y + NODE_H / 2 };
}

function svgPath(ax, ay, bx, by) {
  const dx = Math.abs(bx - ax) * 0.5;
  return `M ${ax},${ay} C ${ax + dx},${ay} ${bx - dx},${by} ${bx},${by}`;
}

/* ─── sub-components ─── */
function NodeCard({ node, selected, connecting, onMouseDown, onEdit, onDelete, onStartEdge, onEndEdge }) {
  const meta = NODE_COLORS[node.type] || NODE_COLORS.note;
  const Icon = meta.icon;
  const col  = node.color || meta.bg;

  return (
    <div
      className="cv-node"
      style={{
        left: node.pos_x,
        top: node.pos_y,
        width: NODE_W,
        minHeight: NODE_H,
        background: col,
        color: meta.text,
        outline: selected ? '2.5px solid #fff' : 'none',
        outlineOffset: 2,
        cursor: connecting ? 'crosshair' : 'grab',
      }}
      onMouseDown={e => onMouseDown(e, node.id)}
      onDoubleClick={e => { e.stopPropagation(); onEdit(node); }}
    >
      <div className="cv-node-hd">
        <Icon size={13} opacity={0.75} />
        <span className="cv-node-title">{node.title}</span>
        <button className="cv-node-del" onClick={e => { e.stopPropagation(); onDelete(node.id); }}>
          <X size={11} />
        </button>
      </div>
      {node.body && <p className="cv-node-body">{node.body}</p>}

      {/* connection handles */}
      {['right', 'bottom', 'left', 'top'].map(side => (
        <div
          key={side}
          className={`cv-handle cv-handle-${side}`}
          style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
          onMouseDown={e => { e.stopPropagation(); onStartEdge(e, node.id); }}
          onMouseUp={e => { e.stopPropagation(); onEndEdge(node.id); }}
        />
      ))}
    </div>
  );
}

function EdgeSvg({ nodes, edges, onDeleteEdge, pendingEdge, mousePos }) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <svg
      className="cv-edges"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,.5)" />
        </marker>
      </defs>

      {edges.map(e => {
        const s = nodeMap[e.source_id];
        const t = nodeMap[e.target_id];
        if (!s || !t) return null;
        const sm = mid(s), tm = mid(t);
        return (
          <g key={e.id} style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onClick={() => onDeleteEdge(e.id)}>
            {/* fat invisible hit area */}
            <path d={svgPath(sm.x, sm.y, tm.x, tm.y)} stroke="transparent" strokeWidth={14} fill="none" />
            <path d={svgPath(sm.x, sm.y, tm.x, tm.y)}
              stroke="rgba(255,255,255,.35)" strokeWidth={2} fill="none"
              strokeDasharray="6 3" markerEnd="url(#arr)" />
            {e.label && (
              <text x={(sm.x + tm.x) / 2} y={(sm.y + tm.y) / 2 - 6}
                textAnchor="middle" fontSize={11} fill="rgba(255,255,255,.6)">{e.label}</text>
            )}
          </g>
        );
      })}

      {/* pending edge while dragging */}
      {pendingEdge && mousePos && (() => {
        const s = nodeMap[pendingEdge.sourceId];
        if (!s) return null;
        const sm = mid(s);
        return (
          <path d={svgPath(sm.x, sm.y, mousePos.x, mousePos.y)}
            stroke="rgba(255,255,255,.5)" strokeWidth={2} fill="none" strokeDasharray="4 3" />
        );
      })()}
    </svg>
  );
}

function AddNodeModal({ onAdd, onClose }) {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) { toast.error('Adaugă un titlu'); return; }
    onAdd({ type, title: title.trim(), body: body.trim() });
  }

  return (
    <div className="cv-modal-bg" onClick={onClose}>
      <div className="cv-modal" onClick={e => e.stopPropagation()}>
        <div className="cv-modal-hd">
          <span>Nod nou</span>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="cv-modal-form">
          <div className="cv-modal-types">
            {Object.entries(NODE_COLORS).map(([k, v]) => {
              const Icon = v.icon;
              return (
                <button key={k} type="button"
                  className={`cv-type-btn ${type === k ? 'active' : ''}`}
                  style={type === k ? { background: v.bg, color: v.text } : {}}
                  onClick={() => setType(k)}>
                  <Icon size={14} /> {v.label}
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

function EditNodeModal({ node, onSave, onClose }) {
  const [title, setTitle] = useState(node.title);
  const [body, setBody] = useState(node.body || '');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) { toast.error('Titlul este obligatoriu'); return; }
    onSave(node.id, { title: title.trim(), body: body.trim() });
  }

  const meta = NODE_COLORS[node.type] || NODE_COLORS.note;

  return (
    <div className="cv-modal-bg" onClick={onClose}>
      <div className="cv-modal" onClick={e => e.stopPropagation()}>
        <div className="cv-modal-hd" style={{ background: node.color || meta.bg, color: meta.text }}>
          <span>Editează nod</span>
          <button onClick={onClose} style={{ color: meta.text }}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="cv-modal-form">
          <input className="cv-input" placeholder="Titlu *" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="cv-input cv-textarea" placeholder="Conținut" value={body} onChange={e => setBody(e.target.value)} rows={4} />
          <button className="cv-submit-btn" type="submit">Salvează</button>
        </form>
      </div>
    </div>
  );
}

/* ─── main page ─── */
export default function CanvasPage() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  // viewport
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // interaction states
  const [draggingNode, setDraggingNode]     = useState(null); // { id, startMouse, startPos }
  const [panStart, setPanStart]             = useState(null);  // { x, y, panX, panY }
  const [connectMode, setConnectMode]       = useState(false);
  const [pendingEdge, setPendingEdge]       = useState(null);  // { sourceId }
  const [mousePos, setMousePos]             = useState(null);  // canvas coords for pending edge
  const [showAdd, setShowAdd]               = useState(false);
  const [editNode, setEditNode]             = useState(null);
  const [selected, setSelected]             = useState(null);

  const canvasRef = useRef(null);
  const saveTimer = useRef({});

  // ── load ──
  useEffect(() => {
    api.get('/canvas').then(r => {
      setNodes(r.data.nodes);
      setEdges(r.data.edges);
    }).catch(() => toast.error('Nu am putut încărca canvas-ul')).finally(() => setLoading(false));
  }, []);

  // ── canvas coords from screen event ──
  const toCanvas = useCallback((clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top  - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // ── node drag ──
  const onNodeMouseDown = useCallback((e, id) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (connectMode) return; // handled by handles
    setSelected(id);
    const node = nodes.find(n => n.id === id);
    setDraggingNode({
      id,
      startMouse: { x: e.clientX, y: e.clientY },
      startPos: { x: node.pos_x, y: node.pos_y },
    });
  }, [nodes, connectMode]);

  // ── canvas pan (background mousedown) ──
  const onBgMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setSelected(null);
    if (connectMode) { setPendingEdge(null); return; }
    setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  }, [pan, connectMode]);

  const onMouseMove = useCallback((e) => {
    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startMouse.x) / zoom;
      const dy = (e.clientY - draggingNode.startMouse.y) / zoom;
      const newX = draggingNode.startPos.x + dx;
      const newY = draggingNode.startPos.y + dy;
      setNodes(prev => prev.map(n => n.id === draggingNode.id ? { ...n, pos_x: newX, pos_y: newY } : n));
    } else if (panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
    }
    if (pendingEdge) {
      setMousePos(toCanvas(e.clientX, e.clientY));
    }
  }, [draggingNode, panStart, pendingEdge, zoom, toCanvas]);

  const onMouseUp = useCallback((e) => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode.id);
      if (node) {
        clearTimeout(saveTimer.current[node.id]);
        saveTimer.current[node.id] = setTimeout(() => {
          api.patch(`/canvas/nodes/${node.id}`, { pos_x: node.pos_x, pos_y: node.pos_y })
            .catch(() => {});
        }, 400);
      }
      setDraggingNode(null);
    }
    setPanStart(null);
  }, [draggingNode, nodes]);

  // ── zoom ──
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(3, Math.max(0.2, z * delta)));
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── add node ──
  async function handleAddNode({ type, title, body }) {
    const cx = (canvasRef.current.clientWidth  / 2 - pan.x) / zoom - NODE_W / 2;
    const cy = (canvasRef.current.clientHeight / 2 - pan.y) / zoom - NODE_H / 2;
    try {
      const r = await api.post('/canvas/nodes', { type, title, body, pos_x: cx, pos_y: cy });
      setNodes(prev => [...prev, r.data]);
      setShowAdd(false);
    } catch { toast.error('Eroare la creare nod'); }
  }

  // ── edit node ──
  async function handleEditSave(id, { title, body }) {
    try {
      const r = await api.patch(`/canvas/nodes/${id}`, { title, body });
      setNodes(prev => prev.map(n => n.id === id ? r.data : n));
      setEditNode(null);
    } catch { toast.error('Eroare la salvare'); }
  }

  // ── delete node ──
  async function handleDeleteNode(id) {
    try {
      await api.delete(`/canvas/nodes/${id}`);
      setNodes(prev => prev.filter(n => n.id !== id));
      setEdges(prev => prev.filter(e => e.source_id !== id && e.target_id !== id));
    } catch { toast.error('Eroare la ștergere'); }
  }

  // ── edge creation ──
  function onStartEdge(e, sourceId) {
    if (!connectMode) return;
    e.stopPropagation();
    setPendingEdge({ sourceId });
    setMousePos(toCanvas(e.clientX, e.clientY));
  }

  async function onEndEdge(targetId) {
    if (!connectMode || !pendingEdge) return;
    const { sourceId } = pendingEdge;
    setPendingEdge(null);
    setMousePos(null);
    if (sourceId === targetId) return;
    try {
      const r = await api.post('/canvas/edges', { source_id: sourceId, target_id: targetId });
      setEdges(prev => {
        if (prev.find(e => e.id === r.data.id)) return prev;
        return [...prev, r.data];
      });
    } catch { toast.error('Eroare la conectare'); }
  }

  async function handleDeleteEdge(id) {
    try {
      await api.delete(`/canvas/edges/${id}`);
      setEdges(prev => prev.filter(e => e.id !== id));
    } catch { toast.error('Eroare la ștergere legătură'); }
  }

  // ── fit to content ──
  function fitView() {
    if (!nodes.length) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const xs = nodes.map(n => n.pos_x), ys = nodes.map(n => n.pos_y);
    const minX = Math.min(...xs), maxX = Math.max(...xs) + NODE_W;
    const minY = Math.min(...ys), maxY = Math.max(...ys) + NODE_H;
    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;
    const z = Math.min(2, 0.9 * Math.min(w / (maxX - minX + 80), h / (maxY - minY + 80)));
    setPan({ x: (w - (maxX + minX) * z) / 2, y: (h - (maxY + minY) * z) / 2 });
    setZoom(z);
  }

  if (loading) return <div className="cv-loading">Se încarcă canvas-ul...</div>;

  return (
    <div className="cv-page">
      {/* toolbar */}
      <div className="cv-toolbar">
        <span className="cv-toolbar-title">
          <span className="cv-dot" />
          Canvas
        </span>
        <div className="cv-toolbar-actions">
          <button
            className={`cv-tb-btn ${connectMode ? 'active' : ''}`}
            onClick={() => { setConnectMode(c => !c); setPendingEdge(null); }}
            title={connectMode ? 'Ieși din modul conectare' : 'Conectează noduri'}
          >
            {connectMode ? <Unlink size={15} /> : <Link size={15} />}
            {connectMode ? 'Anulează' : 'Conectează'}
          </button>
          <button className="cv-tb-btn" onClick={() => setZoom(z => Math.min(3, z * 1.2))} title="Zoom in"><ZoomIn size={15} /></button>
          <button className="cv-tb-btn" onClick={() => setZoom(z => Math.max(0.2, z / 1.2))} title="Zoom out"><ZoomOut size={15} /></button>
          <button className="cv-tb-btn" onClick={fitView} title="Fit"><Maximize2 size={15} /></button>
          <button className="cv-tb-btn primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Nod nou
          </button>
        </div>
      </div>

      {/* hint */}
      {connectMode && (
        <div className="cv-connect-hint">
          Trage de pe un handle (cerc alb) la alt nod pentru a crea o legătură. Click pe o legătură o șterge.
        </div>
      )}

      {/* canvas area */}
      <div
        ref={canvasRef}
        className={`cv-canvas ${connectMode ? 'connect-mode' : ''} ${panStart ? 'panning' : ''}`}
        onMouseDown={onBgMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className="cv-world"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          {/* SVG edges layer */}
          <EdgeSvg
            nodes={nodes}
            edges={edges}
            onDeleteEdge={handleDeleteEdge}
            pendingEdge={pendingEdge}
            mousePos={mousePos}
          />

          {/* nodes */}
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selected === node.id}
              connecting={connectMode}
              onMouseDown={onNodeMouseDown}
              onEdit={setEditNode}
              onDelete={handleDeleteNode}
              onStartEdge={onStartEdge}
              onEndEdge={onEndEdge}
            />
          ))}
        </div>

        {/* empty state */}
        {!nodes.length && (
          <div className="cv-empty">
            <div className="cv-empty-icon">◈</div>
            <p>Canvas gol</p>
            <p style={{ opacity: .6, fontSize: 13 }}>Adaugă primul nod cu butonul din dreapta sus</p>
          </div>
        )}
      </div>

      {/* zoom badge */}
      <div className="cv-zoom-badge">{Math.round(zoom * 100)}%</div>

      {/* modals */}
      {showAdd && <AddNodeModal onAdd={handleAddNode} onClose={() => setShowAdd(false)} />}
      {editNode && <EditNodeModal node={editNode} onSave={handleEditSave} onClose={() => setEditNode(null)} />}
    </div>
  );
}
