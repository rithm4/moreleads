import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, CheckSquare, Network } from 'lucide-react';
import { useBadges } from '../../context/BadgeContext';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/contacts',  icon: Users,           label: 'Clienți' },
  { to: '/pipeline',  icon: TrendingUp,       label: 'Pipeline' },
  { to: '/tasks',     icon: CheckSquare,      label: 'Taskuri',  badge: 'tasks' },
  { to: '/canvas',    icon: Network,          label: 'Canvas' },
];

export function BottomNav() {
  const { badges } = useBadges();

  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrap">
            <Icon size={22} />
            {badge && badges[badge] > 0 && (
              <span className="nav-badge nav-badge-top">{badges[badge]}</span>
            )}
          </div>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
