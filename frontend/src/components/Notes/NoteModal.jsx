import { useState } from 'react';
import { Modal } from '../UI/Modal';
import api from '../../api/axios';

export function NoteModal({ note, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: note?.title || '',
    body: note?.body || '',
    visibility: note?.visibility || 'private',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (note) {
        const { data } = await api.put(`/notes/${note.id}`, form);
        onSaved(data, 'update');
      } else {
        const { data } = await api.post('/notes', form);
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
    <Modal title={note ? 'Editează notiță' : 'Notiță nouă'} onClose={onClose}>
      <form onSubmit={submit} className="modal-form">
        <div className="form-group">
          <label>Titlu *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Titlul notiței"
            required
          />
        </div>
        <div className="form-group">
          <label>Conținut</label>
          <textarea
            rows={6}
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Scrie notița ta..."
          />
        </div>
        <div className="form-group">
          <label>Vizibilitate</label>
          <div className="visibility-toggle">
            <button
              type="button"
              className={form.visibility === 'private' ? 'active' : ''}
              onClick={() => setForm(f => ({ ...f, visibility: 'private' }))}
            >🔒 Privată</button>
            <button
              type="button"
              className={form.visibility === 'public' ? 'active' : ''}
              onClick={() => setForm(f => ({ ...f, visibility: 'public' }))}
            >🌐 Publică</button>
          </div>
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
