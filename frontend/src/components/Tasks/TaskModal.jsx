import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import api from '../../api/axios';

export function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '' });
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
          />
        </div>
        <div className="form-group">
          <label>Descriere</label>
          <textarea
            rows={3}
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
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Anulează</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
