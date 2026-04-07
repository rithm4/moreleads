import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Bell, BellOff, Moon, Sun, LogOut, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { status: notifStatus, subscribe, unsubscribe } = usePushNotifications();

  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) return;
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', { name: name.trim(), email: email.trim() });
      updateUser(data.user, data.token);
      toast.success('Profil actualizat');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Eroare la salvare');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) { toast.error('Parolele noi nu coincid'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Parolă schimbată');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Eroare la schimbare');
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profileChanged = name !== user?.name || email !== user?.email;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-hero">
        <div className="profile-avatar-xl">{initials}</div>
        <div className="profile-hero-info">
          <div className="profile-hero-name">{user?.name}</div>
          <div className="profile-hero-email">{user?.email}</div>
          <span className="profile-role-badge">{user?.role === 'admin' ? 'Administrator' : 'Membru'}</span>
        </div>
      </div>

      {/* Info */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-icon" style={{ background: '#eef2ff' }}><User size={16} style={{ color: '#6366f1' }} /></div>
          <div>
            <div className="profile-card-title">Informații cont</div>
            <div className="profile-card-sub">Actualizează numele și emailul</div>
          </div>
        </div>
        <div className="profile-fields">
          <div className="profile-field">
            <label className="profile-label">Nume</label>
            <input className="profile-input" value={name} onChange={e => setName(e.target.value)} placeholder="Numele tău" />
          </div>
          <div className="profile-field">
            <label className="profile-label">Email</label>
            <input className="profile-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplu.com" />
          </div>
        </div>
        {profileChanged && (
          <button className="profile-save-btn" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? 'Se salvează...' : <><Check size={14} /> Salvează modificările</>}
          </button>
        )}
      </div>

      {/* Password */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-icon" style={{ background: '#fef3c7' }}><Lock size={16} style={{ color: '#d97706' }} /></div>
          <div>
            <div className="profile-card-title">Schimbă parola</div>
            <div className="profile-card-sub">Minim 6 caractere</div>
          </div>
        </div>
        <div className="profile-fields">
          <div className="profile-field">
            <label className="profile-label">Parola curentă</label>
            <input className="profile-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="profile-field">
            <label className="profile-label">Parola nouă</label>
            <input className="profile-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="profile-field">
            <label className="profile-label">Confirmă parola nouă</label>
            <input className="profile-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <button className="profile-save-btn" onClick={savePassword} disabled={savingPw || !currentPw || !newPw || !confirmPw}>
          {savingPw ? 'Se schimbă...' : <><Check size={14} /> Schimbă parola</>}
        </button>
      </div>

      {/* Notifications + Appearance in one row on desktop */}
      <div className="profile-row-2">
        {/* Notifications */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon" style={{ background: '#fce7f3' }}>
              {notifStatus === 'granted' ? <Bell size={16} style={{ color: '#ec4899' }} /> : <BellOff size={16} style={{ color: '#ec4899' }} />}
            </div>
            <div>
              <div className="profile-card-title">Notificări push</div>
              <div className="profile-card-sub">
                {notifStatus === 'granted' ? 'Active' : notifStatus === 'denied' ? 'Blocate în browser' : 'Dezactivate'}
              </div>
            </div>
          </div>
          {notifStatus !== 'unsupported' && notifStatus !== 'denied' && (
            <button
              className={`profile-toggle-row ${notifStatus === 'granted' ? 'active' : ''}`}
              onClick={notifStatus === 'granted' ? unsubscribe : subscribe}
            >
              <span>{notifStatus === 'granted' ? 'Notificări activate' : 'Activează notificările'}</span>
              <div className={`profile-toggle ${notifStatus === 'granted' ? 'on' : ''}`}>
                <div className="profile-toggle-knob" />
              </div>
            </button>
          )}
          {notifStatus === 'denied' && (
            <p className="profile-hint">Activează notificările din setările browserului.</p>
          )}
        </div>

        {/* Appearance */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon" style={{ background: '#f0fdf4' }}>
              {darkMode ? <Moon size={16} style={{ color: '#6366f1' }} /> : <Sun size={16} style={{ color: '#f59e0b' }} />}
            </div>
            <div>
              <div className="profile-card-title">Apariție</div>
              <div className="profile-card-sub">{darkMode ? 'Temă întunecată' : 'Temă luminoasă'}</div>
            </div>
          </div>
          <button className={`profile-toggle-row ${darkMode ? 'active' : ''}`} onClick={toggleDark}>
            <span>{darkMode ? 'Mod întunecat' : 'Mod luminos'}</span>
            <div className={`profile-toggle ${darkMode ? 'on' : ''}`}>
              <div className="profile-toggle-knob" />
            </div>
          </button>
        </div>
      </div>

      {/* Logout */}
      <button className="profile-logout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        Deconectare
      </button>
    </div>
  );
}
