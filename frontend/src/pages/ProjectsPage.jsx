import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Trash2, ChevronRight, Folder, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/UI/Modal';
import { Spinner } from '../components/UI/Spinner';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

function ProjectForm({ initial, parentName, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [color, setColor] = useState(initial?.color || '#6366f1');

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ name, description, color }); }}>
      {parentName && (
        <div className="form-hint">Sub-proiect în <strong>{parentName}</strong></div>
      )}
      <div className="form-group">
        <label>Nume proiect *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Campanie Social Media" required autoFocus />
      </div>
      <div className="form-group">
        <label>Descriere</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Scurtă descriere..." rows={2} />
      </div>
      <div className="form-group">
        <label>Culoare</label>
        <div className="color-picker">
          {COLORS.map(c => (
            <button key={c} type="button" className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Anulează</button>
        <button type="submit" className="btn-primary">Salvează</button>
      </div>
    </form>
  );
}

function ProjectCard({ project, subProjects, onDelete, onAddSub }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="project-card">
      <div className="project-card-bar" style={{ background: project.color }} />
      <div className="project-card-content">
        <div className="project-card-header">
          <div className="project-card-icon" style={{ background: project.color + '22', color: project.color }}>
            <FolderKanban size={18} />
          </div>
          <div className="project-card-info" onClick={() => navigate(`/projects/${project.id}`)}>
            <div className="project-card-name">{project.name}</div>
            {project.description && <div className="project-card-desc">{project.description}</div>}
          </div>
        </div>

        {subProjects.length > 0 && (
          <button className="sub-toggle" onClick={() => setExpanded(e => !e)}>
            <ChevronRight size={14} className={expanded ? 'rotated' : ''} />
            {subProjects.length} sub-proiect{subProjects.length !== 1 ? 'e' : ''}
          </button>
        )}

        {expanded && (
          <div className="sub-projects">
            {subProjects.map(sub => (
              <div key={sub.id} className="sub-project-row" onClick={() => navigate(`/projects/${sub.id}`)}>
                <span className="sub-dot" style={{ background: sub.color }} />
                <span>{sub.name}</span>
                <ArrowRight size={12} className="sub-arrow" />
              </div>
            ))}
          </div>
        )}

        <div className="project-card-footer">
          <button className="btn-icon" title="Adaugă sub-proiect" onClick={() => onAddSub(project)}>
            <Plus size={14} />
          </button>
          <button className="btn-icon" title="Deschide" onClick={() => navigate(`/projects/${project.id}`)}>
            <ArrowRight size={14} />
          </button>
          <button className="btn-icon danger" title="Șterge" onClick={() => onDelete(project.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.get('/projects').then(r => { setProjects(r.data); setLoading(false); });
  }, []);

  const roots = projects.filter(p => !p.parent_id);
  const subs = (parentId) => projects.filter(p => p.parent_id === parentId);

  const handleCreate = async (data) => {
    const payload = { ...data };
    if (modal?.parent) payload.parent_id = modal.parent.id;
    const res = await api.post('/projects', payload);
    setProjects(prev => [...prev, res.data]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ștergi proiectul și tot ce conține?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(prev => prev.filter(p => p.id !== id && p.parent_id !== id));
  };

  if (loading) return <div className="page-loading"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FolderKanban size={22} /> Proiecte</h1>
          <p className="page-subtitle">{roots.length} proiecte active</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ type: 'new' })}>
          <Plus size={16} /> Proiect nou
        </button>
      </div>

      {roots.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={52} />
          <p>Niciun proiect încă. Creează primul!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {roots.map(p => (
            <ProjectCard key={p.id} project={p} subProjects={subs(p.id)}
              onDelete={handleDelete} onAddSub={(parent) => setModal({ parent })} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.parent ? 'Sub-proiect nou' : 'Proiect nou'} onClose={() => setModal(null)}>
          <ProjectForm parentName={modal.parent?.name} onSave={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
