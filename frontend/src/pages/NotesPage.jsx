import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Lock, Globe, FileText } from 'lucide-react';
import { NoteModal } from '../components/Notes/NoteModal';
import { SkeletonCard } from '../components/UI/Skeleton';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { useBadges } from '../context/BadgeContext';
import { useFab } from '../context/FabContext';
import { t } from '../utils/toast';

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const { markSeen } = useBadges();
  const { setFabAction } = useFab();

  useEffect(() => { markSeen('notes'); }, [markSeen]);
  useEffect(() => {
    setFabAction(() => setModal({}));
    return () => setFabAction(null);
  }, [setFabAction]);

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await api.get('/notes');
      setNotes(data);
    } catch {
      setError('Nu s-au putut încărca notițele');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSaved = (note, action) => {
    if (action === 'create') { setNotes(prev => [note, ...prev]); t.saved('Notiță adăugată!'); }
    else { setNotes(prev => prev.map(n => n.id === note.id ? note : n)); t.saved('Notiță actualizată!'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Ștergi această notiță?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
      t.deleted('Notiță ștearsă!');
    } catch { t.error(); }
  };

  const filtered = notes.filter(n => {
    if (filter === 'mine') return n.owner_id === user.id;
    if (filter === 'public') return n.visibility === 'public';
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title"><FileText size={22} /> Notițe</h1>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Notiță nouă
        </button>
      </div>

      <div className="filter-tabs" style={{ marginBottom: '16px' }}>
        {['all', 'mine', 'public'].map(f => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Toate' : f === 'mine' ? 'Ale mele' : 'Publice'}
          </button>
        ))}
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <div className="skeleton-grid">{Array.from({length:6}).map((_,i)=><SkeletonCard key={i} lines={3}/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>Nicio notiță găsită.</p>
          <button className="btn-primary" onClick={() => setModal({})}>Adaugă prima notiță</button>
        </div>
      ) : (
        <div className="notes-grid">
          {filtered.map(note => {
            const canEdit = note.owner_id === user.id || user.role === 'admin';
            return (
              <div key={note.id} className="note-card note-card-clickable" onClick={() => setModal({ note, viewOnly: true })}>
                <div className="note-card-header">
                  <h3>{note.title}</h3>
                  <span className={`note-badge ${note.visibility}`}>
                    {note.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                    {note.visibility === 'public' ? 'Publică' : 'Privată'}
                  </span>
                </div>
                {note.body && <p className="note-body">{note.body}</p>}
                <div className="note-footer">
                  <span className="note-meta">{note.owner_name} · {new Date(note.updated_at).toLocaleDateString('ro-RO')}</span>
                  {canEdit && (
                    <div className="note-actions">
                      <button className="btn-icon" onClick={e => { e.stopPropagation(); setModal({ note }); }} title="Editează"><Pencil size={13} /></button>
                      <button className="btn-icon danger" onClick={e => { e.stopPropagation(); handleDelete(note.id); }} title="Șterge"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <NoteModal
          note={modal.note}
          viewOnly={modal.viewOnly}
          canEdit={modal.note ? (modal.note.owner_id === user.id || user.role === 'admin') : true}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
