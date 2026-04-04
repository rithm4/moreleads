import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import api from '../../api/axios';

const STATUSES = [
  { value: 'todo',       label: 'De făcut',  color: '#6366f1' },
  { value: 'inprogress', label: 'În lucru',  color: '#f59e0b' },
  { value: 'done',       label: 'Finalizat', color: '#10b981' },
];

export function TaskModal({ task, defaultStatus, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: defaultStatus || 'todo',
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
