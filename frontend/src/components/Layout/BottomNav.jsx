import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, CheckSquare, FolderKanban } from 'lucide-react';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/contacts',  icon: Users,           label: 'Clienți' },
  { to: '/pipeline',  icon: TrendingUp,       label: 'Pipeline' },
  { to: '/tasks',     icon: CheckSquare,      label: 'Taskuri' },
  { to: '/projects',  icon: FolderKanban,     label: 'Proiecte' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
