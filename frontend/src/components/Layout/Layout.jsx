import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <TopBar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className={isChat ? 'page-content page-content-chat' : 'page-content'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
