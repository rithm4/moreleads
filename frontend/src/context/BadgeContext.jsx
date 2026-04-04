import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const BadgeContext = createContext({ badges: {}, markSeen: () => {}, refresh: () => {} });

export function BadgeProvider({ children }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState({ tasks: 0, notes: 0 });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const lastSeenTasks = localStorage.getItem('lastSeenTasks') || '1970-01-01T00:00:00Z';
      const lastSeenNotes = localStorage.getItem('lastSeenNotes') || '1970-01-01T00:00:00Z';

      const [tasksRes, notesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/notes'),
      ]);

      const newTasks = tasksRes.data.filter(t =>
        new Date(t.created_at) > new Date(lastSeenTasks) && t.created_by !== user.id
      ).length;

      const newNotes = notesRes.data.filter(n =>
        new Date(n.created_at) > new Date(lastSeenNotes) && n.owner_id !== user.id
      ).length;

      setBadges({ tasks: newTasks, notes: newNotes });
    } catch {}
  }, [user]);

  // Initial load + poll every 30s
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markSeen = useCallback((section) => {
    localStorage.setItem(`lastSeen${section.charAt(0).toUpperCase() + section.slice(1)}`, new Date().toISOString());
    setBadges(prev => ({ ...prev, [section]: 0 }));
  }, []);

  return (
    <BadgeContext.Provider value={{ badges, markSeen, refresh }}>
      {children}
    </BadgeContext.Provider>
  );
}

export const useBadges = () => useContext(BadgeContext);
