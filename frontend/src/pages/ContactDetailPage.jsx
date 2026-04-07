import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Globe, Building2,
  TrendingUp, Plus, Pencil, Trash2, Users
} from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/UI/Modal';
import { SkeletonCard } from '../components/UI/Skeleton';
import { t } from '../utils/toast';

const STATUSES = ['prospect', 'activ', 'inactiv'];
const STATUS_LABEL = { prospect: 'Prospect', activ: 'Activ', inactiv: 'Inactiv' };
const STATUS_COLOR = { prospect: '#f59e0b', activ: '#10b981', inactiv: '#94a3b8' };

const STAGES = {
  lead: 'Lead', contacted: 'Contactat', proposal: 'Propunere',
  negotiation: 'Negociere', won: 'Câștigat', lost: 'Pierdut',
};
const STAGE_COLOR = {
  lead: '#94a3b8', contacted: '#3b82f6', proposal: '#f59e0b',
  negotiation: '#8b5cf6', won: '#10b981', lost: '#ef4444',
};

function ContactForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', website: '', status: 'prospect', notes: '',
    ...initial,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="contact-form">
      <div className="form-row">
        <div className="form-group"><label>Nume *</label><input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus /></div>
        <div className="form-group"><label>Firmă</label><input value={form.company} onChange={e => set('company', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-group"><label>Telefon</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Website</label><input value={form.website} onChange={e => set('website', e.target.value)} /></div>
        <div className="form-group"><label>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group"><label>Notițe</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} /></div>
      <div className="modal-submit-row">
        <button type="button" className="btn-ghost" onClick={onCancel}>Anulează</button>
        <button type="submit" className="btn-primary btn-full">Salvează</button>
      </div>
    </form>
  );
}

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/contacts/${id}`),
      api.get('/deals'),
    ]).then(([c, d]) => {
      setContact(c.data);
      setDeals(d.data.filter(deal => deal.contact_id === parseInt(id)));
      setLoading(false);
    }).catch(() => navigate('/contacts'));
  }, [id, navigate]);

  const handleSave = async (form) => {
    try {
      const res = await api.put(`/contacts/${id}`, form);
      setContact(res.data);
      setEditModal(false);
      t.saved('Contact actualizat!');
    } catch { t.error(); }
  };

  const handleDelete = async () => {
    if (!confirm('Ștergi contactul? Toate deal-urile asociate vor fi dezlegate.')) return;
    try {
      await api.delete(`/contacts/${id}`);
      t.deleted('Contact șters!');
      navigate('/contacts');
    } catch { t.error(); }
  };

  if (loading) return (
    <div className="page">
      <SkeletonCard lines={5} />
    </div>
  );

  const initials = contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const totalDeals = deals.reduce((s, d) => s + parseFloat(d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'won');

  return (
    <div className="page">
      {/* Back */}
      <div className="contact-detail-back">
        <Link to="/contacts" className="btn-ghost btn-sm"><ArrowLeft size={15} /> Înapoi</Link>
      </div>

      {/* Header card */}
      <div className="contact-detail-card">
        <div className="contact-detail-top">
          <div className="contact-avatar contact-avatar-lg" style={{ background: STATUS_COLOR[contact.status] + '22', color: STATUS_COLOR[contact.status] }}>
            {initials}
          </div>
          <div className="contact-detail-info">
            <h1 className="contact-detail-name">{contact.name}</h1>
            {contact.company && <div className="contact-detail-company"><Building2 size={14} />{contact.company}</div>}
            <span className="status-pill" style={{ background: STATUS_COLOR[contact.status] + '22', color: STATUS_COLOR[contact.status] }}>
              {STATUS_LABEL[contact.status]}
            </span>
          </div>
          <div className="contact-detail-actions">
            <button className="btn-icon" onClick={() => setEditModal(true)} title="Editează"><Pencil size={15} /></button>
            <button className="btn-icon danger" onClick={handleDelete} title="Șterge"><Trash2 size={15} /></button>
          </div>
        </div>

        <div className="contact-detail-links">
          {contact.email && <a href={`mailto:${contact.email}`} className="contact-detail-link"><Mail size={14} />{contact.email}</a>}
          {contact.phone && <a href={`tel:${contact.phone}`} className="contact-detail-link"><Phone size={14} />{contact.phone}</a>}
          {contact.website && <a href={contact.website} target="_blank" rel="noreferrer" className="contact-detail-link"><Globe size={14} />{contact.website.replace(/^https?:\/\//, '')}</a>}
        </div>

        {contact.notes && <p className="contact-detail-notes">{contact.notes}</p>}
      </div>

      {/* Stats row */}
      <div className="contact-stats-row">
        <div className="contact-stat">
          <div className="contact-stat-val">{deals.length}</div>
          <div className="contact-stat-label">Deal-uri totale</div>
        </div>
        <div className="contact-stat">
          <div className="contact-stat-val">{wonDeals.length}</div>
          <div className="contact-stat-label">Câștigate</div>
        </div>
        {totalDeals > 0 && (
          <div className="contact-stat">
            <div className="contact-stat-val">{new Intl.NumberFormat('ro-RO').format(totalDeals)}</div>
            <div className="contact-stat-label">RON total</div>
          </div>
        )}
      </div>

      {/* Deals */}
      <div className="contact-section">
        <div className="contact-section-header">
          <h2><TrendingUp size={16} /> Deal-uri</h2>
          <Link to="/pipeline" className="btn-ghost btn-sm"><Plus size={14} /> Deal nou</Link>
        </div>
        {deals.length === 0 ? (
          <div className="contact-empty">Niciun deal asociat acestui contact.</div>
        ) : (
          <div className="contact-deals-list">
            {deals.map(deal => (
              <div key={deal.id} className="contact-deal-row">
                <div className="contact-deal-left">
                  <span className="contact-deal-stage" style={{ color: STAGE_COLOR[deal.stage], background: STAGE_COLOR[deal.stage] + '18' }}>
                    {STAGES[deal.stage]}
                  </span>
                  <span className="contact-deal-title">{deal.title}</span>
                </div>
                {deal.value > 0 && (
                  <span className="contact-deal-value">{new Intl.NumberFormat('ro-RO').format(deal.value)} RON</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editModal && (
        <Modal title="Editează contact" onClose={() => setEditModal(false)}>
          <ContactForm initial={contact} onSave={handleSave} onCancel={() => setEditModal(false)} />
        </Modal>
      )}
    </div>
  );
}
