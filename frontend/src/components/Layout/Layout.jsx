import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { FabProvider, useFab } from '../../context/FabContext';

function FabButton() {
  const { action } = useFab();
  if (!action) return null;
  return (
    <button className="fab" onClick={action} aria-label="Adaugă">
      <Plus size={24} />
    </button>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <FabProvider>
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-area">
          <TopBar onMenuClick={() => setSidebarOpen(o => !o)} />
          <main className="page-content">
            <Outlet />
          </main>
          <BottomNav />
          <FabButton />
        </div>
      </div>
    </FabProvider>
  );
}
