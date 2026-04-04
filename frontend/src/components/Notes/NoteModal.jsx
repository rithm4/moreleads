import { useState } from 'react';
import { Pencil, Globe, Lock } from 'lucide-react';
import { Modal } from '../UI/Modal';
import api from '../../api/axios';

export function NoteModal({ note, viewOnly: initialViewOnly, onClose, onSaved, onDelete, canEdit }) {
  const [viewOnly, setViewOnly] = useState(initialViewOnly ?? false);
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

  if (viewOnly && note) {
    const isPublic = note.visibility === 'public';
    return (
      <Modal title="Notiță" onClose={onClose}>
        <div className="note-view">
          <div className="note-view-meta">
            <span className={`note-badge ${note.visibility}`}>
              {isPublic ? <Globe size={11} /> : <Lock size={11} />}
              {isPublic ? 'Publică' : 'Privată'}
            </span>
            <span className="note-view-date">
              {note.owner_name} · {new Date(note.updated_at).toLocaleDateString('ro-RO')}
            </span>
          </div>

          <h3 className="note-view-title">{note.title}</h3>

          {note.body ? (
            <p className="note-view-body">{note.body}</p>
          ) : (
            <p className="note-view-empty">Fără conținut.</p>
          )}

          {canEdit && (
            <div className="modal-submit-row" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="btn-ghost btn-danger-ghost"
                onClick={() => { onDelete(note.id); onClose(); }}
              >
                Șterge
              </button>
              <button
                type="button"
                className="btn-primary btn-full"
                onClick={() => setViewOnly(false)}
              >
                <Pencil size={15} style={{ marginRight: 6 }} />
                Editează
              </button>
            </div>
          )}
        </div>
      </Modal>
    );
  }

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
            autoFocus
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
