import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, TrendingUp, User, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api/axios';
import { Modal } from '../components/UI/Modal';
import { Spinner } from '../components/UI/Spinner';

const STAGES = [
  { id: 'lead',        label: 'Lead',       color: '#94a3b8' },
  { id: 'contacted',   label: 'Contactat',  color: '#3b82f6' },
  { id: 'proposal',    label: 'Propunere',  color: '#f59e0b' },
  { id: 'negotiation', label: 'Negociere',  color: '#8b5cf6' },
  { id: 'won',         label: 'Câștigat',   color: '#10b981' },
  { id: 'lost',        label: 'Pierdut',    color: '#ef4444' },
];

function DealForm({ initial, contacts, users, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: '', value: '', stage: 'lead', contact_id: '', assigned_to: '', notes: '',
    ...initial, value: initial?.value || ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div className="form-group">
        <label>Titlu deal *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Campanie Social Media Q1" required autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Valoare (RON)</label>
          <input type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" min="0" />
        </div>
        <div className="form-group">
          <label>Stage</label>
          <select value={form.stage} onChange={e => set('stage', e.target.value)}>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Contact / Client</label>
          <select value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
            <option value="">— fără —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Responsabil</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
            <option value="">— neasignat —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Notițe</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Detalii..." />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Anulează</button>
        <button type="submit" className="btn-primary">Salvează</button>
      </div>
    </form>
  );
}

function DealCard({ deal, index, onEdit, onDelete }) {
  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          className={`deal-card ${snapshot.isDragging ? 'dragging' : ''}`}>
          <div className="deal-card-title">{deal.title}</div>
          {deal.value > 0 && (
            <div className="deal-value-badge">{new Intl.NumberFormat('ro-RO').format(deal.value)} RON</div>
          )}
          {(deal.contact_name || deal.contact_company) && (
            <div className="deal-contact"><User size={11} />{deal.contact_company || deal.contact_name}</div>
          )}
          {deal.assigned_name && (
            <div className="deal-assigned">
              <span className="mini-avatar">{deal.assigned_name.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>
              {deal.assigned_name}
            </div>
          )}
          <div className="deal-card-actions">
            <button className="btn-icon" onClick={() => onEdit(deal)}><Pencil size={12} /></button>
            <button className="btn-icon danger" onClick={() => onDelete(deal.id)}><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function PipelinePage() {
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/deals'),
      api.get('/contacts'),
      api.get('/users'),
    ]).then(([d, c, u]) => {
      setDeals(d.data); setContacts(c.data); setUsers(u.data);
      setLoading(false);
    });
  }, []);

  const byStage = (stageId) => deals.filter(d => d.stage === stageId).sort((a,b) => a.position - b.position);
  const stageTotal = (stageId) => deals.filter(d => d.stage === stageId).reduce((s, d) => s + parseFloat(d.value || 0), 0);

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    const dealId = parseInt(draggableId);
    const newStage = destination.droppableId;
    const newPos = destination.index;
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage, position: newPos } : d));
    await api.patch(`/deals/${dealId}/move`, { stage: newStage, position: newPos });
  };

  const handleSave = async (form) => {
    const payload = { ...form, value: parseFloat(form.value) || 0, contact_id: form.contact_id || null, assigned_to: form.assigned_to || null };
    if (modal?.deal) {
      const res = await api.put(`/deals/${modal.deal.id}`, payload);
      setDeals(prev => prev.map(d => d.id === modal.deal.id ? res.data : d));
    } else {
      const res = await api.post('/deals', payload);
      setDeals(prev => [...prev, res.data]);
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ștergi deal-ul?')) return;
    await api.delete(`/deals/${id}`);
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  if (loading) return <div className="page-loading"><Spinner /></div>;

  const totalOpen = deals.filter(d => !['won','lost'].includes(d.stage)).reduce((s,d) => s + parseFloat(d.value||0), 0);

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title"><TrendingUp size={22} /> Pipeline</h1>
          {totalOpen > 0 && <p className="page-subtitle">Total activ: {new Intl.NumberFormat('ro-RO').format(totalOpen)} RON</p>}
        </div>
        <button className="btn-primary" onClick={() => setModal({ deal: null })}>
          <Plus size={16} /> Deal nou
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="pipeline-board">
          {STAGES.map(stage => {
            const stageDeals = byStage(stage.id);
            const total = stageTotal(stage.id);
            return (
              <div key={stage.id} className="pipeline-column">
                <div className="pipeline-col-header" style={{ borderTopColor: stage.color }}>
                  <span className="pipeline-col-title">{stage.label}</span>
                  <span className="pipeline-col-count" style={{ background: stage.color + '22', color: stage.color }}>
                    {stageDeals.length}
                  </span>
                </div>
                {total > 0 && <div className="pipeline-col-total">{new Intl.NumberFormat('ro-RO').format(total)} RON</div>}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`pipeline-col-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}>
                      {stageDeals.map((deal, idx) => (
                        <DealCard key={deal.id} deal={deal} index={idx}
                          onEdit={deal => setModal({ deal })} onDelete={handleDelete} />
                      ))}
                      {provided.placeholder}
                      <button className="add-deal-btn" onClick={() => setModal({ deal: { stage: stage.id } })}>
                        <Plus size={13} /> Adaugă
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {modal && (
        <Modal title={modal.deal?.id ? 'Editează deal' : 'Deal nou'} onClose={() => setModal(null)}>
          <DealForm initial={modal.deal} contacts={contacts} users={users} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
