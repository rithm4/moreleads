import { useState, useEffect } from 'react';
import { Users, Shield, User } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/UI/Spinner';

const ROLE_LABEL = { admin: 'Admin', member: 'Membru' };
const ROLE_COLOR = { admin: '#6366f1', member: '#10b981' };

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899'];

function getColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useAuth();

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="page-loading"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={22} /> Echipă</h1>
          <p className="page-subtitle">{users.length} membre în echipă</p>
        </div>
      </div>

      <div className="team-grid">
        {users.map(u => {
          const initials = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const color = getColor(u.name);
          const isMe = u.id === me?.id;
          return (
            <div key={u.id} className={`team-card ${isMe ? 'team-card-me' : ''}`}>
              <div className="team-avatar-wrap">
                <div className="team-avatar" style={{ background: color + '22', color }}>
                  {initials}
                </div>
                {isMe && <span className="team-you-badge">Tu</span>}
              </div>
              <div className="team-info">
                <div className="team-name">{u.name}</div>
                <div className="team-email">{u.email}</div>
              </div>
              <span className="team-role" style={{ background: ROLE_COLOR[u.role] + '18', color: ROLE_COLOR[u.role] }}>
                {u.role === 'admin' ? <Shield size={11} /> : <User size={11} />}
                {ROLE_LABEL[u.role]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="team-invite-box">
        <div className="team-invite-text">
          <Users size={18} />
          <div>
            <div className="team-invite-title">Adaugă colegi</div>
            <div className="team-invite-sub">Trimite-le link-ul aplicației și creează-și un cont.</div>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/login'); alert('Link copiat!'); }}>
          Copiază link
        </button>
      </div>
    </div>
  );
}
