import { useState, useEffect, useRef } from 'react';
import { Pencil, Calendar, Send, Trash2 } from 'lucide-react';
import { Modal } from '../UI/Modal';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

const STATUSES = [
  { value: 'todo',       label: 'De făcut',  color: '#6366f1' },
  { value: 'inprogress', label: 'În lucru',  color: '#f59e0b' },
  { value: 'done',       label: 'Finalizat', color: '#10b981' },
];

function CommentsSection({ taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/comments/${taskId}`).then(r => setComments(r.data));
  }, [taskId]);

  const send = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/comments/${taskId}`, { text });
      setComments(prev => [...prev, data]);
      setText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally { setSending(false); }
  };

  const remove = async (id) => {
    await api.delete(`/comments/${id}`);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="comments-section">
      <div className="comments-title">Comentarii ({comments.length})</div>
      <div className="comments-list">
        {comments.length === 0 && <div className="comments-empty">Niciun comentariu.</div>}
        {comments.map(c => (
          <div key={c.id} className="comment-row">
            <div className="comment-avatar">{c.user_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-user">{c.user_name}</span>
                <span className="comment-time">{new Date(c.created_at).toLocaleString('ro-RO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              <div className="comment-text">{c.text}</div>
            </div>
            {(c.user_id === user?.id) && (
              <button className="btn-icon danger comment-del" onClick={() => remove(c.id)}><Trash2 size={12} /></button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="comment-form">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Scrie un comentariu..."
          className="comment-input"
        />
        <button type="submit" className="btn-primary comment-send" disabled={sending || !text.trim()}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

export function TaskModal({ task, defaultStatus, viewOnly: initialViewOnly, onClose, onSaved, onDelete }) {
  const [viewOnly, setViewOnly] = useState(initialViewOnly ?? false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: defaultStatus || 'todo',
    due_date: '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data));
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        status: task.status || 'todo',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      });
    }
  }, [task]);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to || null,
        status: form.status,
        due_date: form.due_date || null,
      };
      if (task) {
        const { data } = await api.put(`/tasks/${task.id}`, payload);
        onSaved(data, 'update');
      } else {
        const { data } = await api.post('/tasks', payload);
        onSaved(data, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la salvare');
    } finally {
      setLoading(false);
    }
  };

  const statusMeta = STATUSES.find(s => s.value === (task?.status || form.status));
  const assignedUser = users.find(u => String(u.id) === String(task?.assigned_to));

  if (viewOnly && task) {
    return (
      <Modal title="Detalii task" onClose={onClose}>
        <div className="task-view">
          <div className="task-view-status">
            <span
              className="task-view-badge"
              style={{ background: statusMeta?.color + '22', color: statusMeta?.color, borderColor: statusMeta?.color + '55' }}
            >
              {statusMeta?.label}
            </span>
          </div>

          <h3 className="task-view-title">{task.title}</h3>

          {task.description && (
            <p className="task-view-desc">{task.description}</p>
          )}

          {task.due_date && (
            <div className="task-view-row">
              <span className="task-view-label"><Calendar size={13} style={{marginRight:4}}/>Termen</span>
              <span className="task-view-value" style={{ color: new Date(task.due_date) < new Date() && task.status !== 'done' ? '#ef4444' : undefined }}>
                {new Date(task.due_date).toLocaleDateString('ro-RO')}
                {new Date(task.due_date) < new Date() && task.status !== 'done' && ' — Întârziat!'}
              </span>
            </div>
          )}
          {(task.assigned_name || assignedUser) && (
            <div className="task-view-row">
              <span className="task-view-label">Asignat</span>
              <span className="task-view-value">{task.assigned_name || assignedUser?.name}</span>
            </div>
          )}

          <div className="modal-submit-row" style={{ marginTop: '24px' }}>
            {onDelete && (
              <button
                type="button"
                className="btn-ghost btn-danger-ghost"
                onClick={() => { onDelete(task.id); onClose(); }}
              >
                Șterge
              </button>
            )}
            <button
              type="button"
              className="btn-primary btn-full"
              onClick={() => setViewOnly(false)}
            >
              <Pencil size={15} style={{ marginRight: 6 }} />
              Editează
            </button>
          </div>

          <CommentsSection taskId={task.id} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={task ? 'Editează task' : 'Task nou'} onClose={onClose}>
      <form onSubmit={submit} className="modal-form">

        <div className="form-group">
          <label>Titlu *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ce trebuie făcut?"
            required
            autoFocus
          />
        </div>

        {/* Status selector — pill buttons */}
        <div className="form-group">
          <label>Status</label>
          <div className="status-pills">
            {STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                className={`status-pill ${form.status === s.value ? 'active' : ''}`}
                style={form.status === s.value ? { background: s.color + '22', color: s.color, borderColor: s.color } : {}}
                onClick={() => setForm(f => ({ ...f, status: s.value }))}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Descriere</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Detalii opționale..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Termen limită</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Asignat la</label>
            <select
              value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
            >
              <option value="">— Nealocat —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-submit-row">
          <button type="button" className="btn-ghost" onClick={onClose}>Anulează</button>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
