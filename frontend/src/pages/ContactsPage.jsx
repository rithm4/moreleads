import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail, Globe, Building2 } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/UI/Modal';
import { SkeletonCard } from '../components/UI/Skeleton';
import { t } from '../utils/toast';
import { useFab } from '../context/FabContext';

const STATUSES = ['prospect', 'activ', 'inactiv'];
const STATUS_LABEL = { prospect: 'Prospect', activ: 'Activ', inactiv: 'Inactiv' };
const STATUS_COLOR = { prospect: '#f59e0b', activ: '#10b981', inactiv: '#94a3b8' };

function ContactForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', website: '', status: 'prospect', notes: '',
    ...initial
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="contact-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nume contact *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ion Popescu" required autoFocus />
        </div>
        <div className="form-group">
          <label>Firmă</label>
          <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Firma SRL" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ion@firma.ro" />
        </div>
        <div className="form-group">
          <label>Telefon</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0722 000 000" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Website</label>
          <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://firma.ro" />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Notițe</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Detalii suplimentare..." />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Anulează</button>
        <button type="submit" className="btn-primary">Salvează</button>
      </div>
    </form>
  );
}

function ContactCard({ contact, onEdit, onDelete, onView }) {
  const initials = contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="contact-card" onClick={onView} style={{ cursor: 'pointer' }}>
      <div className="contact-card-top">
        <div className="contact-avatar" style={{ background: STATUS_COLOR[contact.status] + '22', color: STATUS_COLOR[contact.status] }}>
          {initials}
        </div>
        <div className="contact-info">
          <div className="contact-name">{contact.name}</div>
          {contact.company && <div className="contact-company"><Building2 size={12} />{contact.company}</div>}
        </div>
        <span className="status-pill" style={{ background: STATUS_COLOR[contact.status] + '22', color: STATUS_COLOR[contact.status] }}>
          {STATUS_LABEL[contact.status]}
        </span>
      </div>
      <div className="contact-details">
        {contact.email && <a href={`mailto:${contact.email}`} className="contact-detail"><Mail size={13} />{contact.email}</a>}
        {contact.phone && <a href={`tel:${contact.phone}`} className="contact-detail"><Phone size={13} />{contact.phone}</a>}
        {contact.website && <a href={contact.website} target="_blank" rel="noreferrer" className="contact-detail"><Globe size={13} />{contact.website.replace(/^https?:\/\//, '')}</a>}
      </div>
      {contact.notes && <p className="contact-notes">{contact.notes}</p>}
      <div className="contact-actions">
        <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(contact); }}><Pencil size={14} /></button>
        <button className="btn-icon danger" onClick={e => { e.stopPropagation(); onDelete(contact.id); }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState(null);
  const { setFabAction } = useFab();

  useEffect(() => {
    api.get('/contacts').then(r => { setContacts(r.data); setLoading(false); });
  }, []);

  useEffect(() => {
    setFabAction(() => setModal({ contact: null }));
    return () => setFabAction(null);
  }, [setFabAction]);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (form) => {
    try {
      if (modal?.contact) {
        const res = await api.put(`/contacts/${modal.contact.id}`, form);
        setContacts(prev => prev.map(c => c.id === modal.contact.id ? res.data : c));
        t.saved('Contact actualizat!');
      } else {
        const res = await api.post('/contacts', form);
        setContacts(prev => [res.data, ...prev]);
        t.saved('Contact adăugat!');
      }
      setModal(null);
    } catch { t.error(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Ștergi contactul?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      setContacts(prev => prev.filter(c => c.id !== id));
      t.deleted('Contact șters!');
    } catch { t.error(); }
  };

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{width:180,height:28,borderRadius:8}} /></div>
      <div className="skeleton-grid">{Array.from({length:6}).map((_,i)=><SkeletonCard key={i} lines={4}/>)}</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title"><Users size={22} /> Clienți & Contacte</h1>
        <button className="btn-primary" onClick={() => setModal({ contact: null })}>
          <Plus size={16} /> Contact nou
        </button>
      </div>

      <div className="list-controls">
        <div className="search-box">
          <Search size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută după nume, firmă, email..." />
        </div>
        <div className="filter-tabs">
          <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>
            Toți ({contacts.length})
          </button>
          {STATUSES.map(s => (
            <button key={s} className={filterStatus === s ? 'active' : ''} onClick={() => setFilterStatus(s)}>
              {STATUS_LABEL[s]} ({contacts.filter(c => c.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>{search ? 'Niciun rezultat.' : 'Niciun contact. Adaugă primul!'}</p>
        </div>
      ) : (
        <div className="contacts-grid">
          {filtered.map(c => (
            <ContactCard key={c.id} contact={c}
              onView={() => navigate(`/contacts/${c.id}`)}
              onEdit={contact => setModal({ contact })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.contact ? 'Editează contact' : 'Contact nou'} onClose={() => setModal(null)}>
          <ContactForm initial={modal.contact} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
