import { NavLink } from 'react-router-dom';
import { CheckSquare, FileText, Paperclip, X, FolderKanban } from 'lucide-react';

const links = [
  { to: '/projects', icon: FolderKanban, label: 'Proiecte' },
  { to: '/tasks', icon: CheckSquare, label: 'Taskuri' },
  { to: '/notes', icon: FileText, label: 'Notițe' },
  { to: '/files', icon: Paperclip, label: 'Fișiere' },
];

export function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">⚡ Moreleads Hub</span>
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
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
