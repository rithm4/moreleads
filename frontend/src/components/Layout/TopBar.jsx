import { Menu, LogOut, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useBadges } from '../../context/BadgeContext';

export function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { status, subscribe, unsubscribe } = usePushNotifications();
  const { badges } = useBadges();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick}>
        <Menu size={20} />
      </button>
      <div className="topbar-right">
        <GlobalSearch />
        {status !== 'unsupported' && (
          status === 'granted'
            ? <button className="topbar-logout" onClick={unsubscribe} title="Dezactivează notificările" style={{ position: 'relative' }}>
                <Bell size={16} style={{ color: 'var(--primary)' }} />
                {badges.notif > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg-card, #1a1a24)' }} />
                )}
              </button>
            : <button className="topbar-logout" onClick={subscribe} title="Activează notificările">
                <BellOff size={16} />
              </button>
        )}
        <div className="topbar-avatar">{initials}</div>
        <span className="topbar-name">{user?.name}</span>
        <button className="topbar-logout" onClick={handleLogout} title="Deconectare">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
