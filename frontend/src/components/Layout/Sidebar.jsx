import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, CheckSquare, FileText, FolderKanban, X, UserCircle, Network } from 'lucide-react';
import { useBadges } from '../../context/BadgeContext';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts',  icon: Users,           label: 'Clienți' },
  { to: '/pipeline',  icon: TrendingUp,       label: 'Pipeline' },
  { to: '/projects',  icon: FolderKanban,     label: 'Proiecte' },
  { to: '/tasks',     icon: CheckSquare,      label: 'Taskuri',  badge: 'tasks' },
  { to: '/notes',     icon: FileText,         label: 'Notițe',   badge: 'notes' },
  { to: '/canvas',    icon: Network,          label: 'Canvas' },
  { to: '/team',      icon: Users,            label: 'Echipă' },
  { to: '/profile',   icon: UserCircle,       label: 'Profil' },
];

export function Sidebar({ open, onClose }) {
  const { badges } = useBadges();

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Moreleads" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: '#fff' }} />
            Moreleads Hub
          </div>
          <button className="sidebar-close" onClick={onClose}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={17} />
              <span>{label}</span>
              {badge && badges[badge] > 0 && (
                <span className="nav-badge">{badges[badge]}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
