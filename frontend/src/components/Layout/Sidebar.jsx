import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, CheckSquare, FileText, FolderKanban, X } from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts',  icon: Users,           label: 'Clienți' },
  { to: '/pipeline',  icon: TrendingUp,       label: 'Pipeline' },
  { to: '/projects',  icon: FolderKanban,     label: 'Proiecte' },
  { to: '/tasks',     icon: CheckSquare,      label: 'Taskuri' },
  { to: '/notes',     icon: FileText,         label: 'Notițe' },
];

export function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>
            Moreleads Hub
          </div>
          <button className="sidebar-close" onClick={onClose}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
