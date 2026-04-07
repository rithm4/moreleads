import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BadgeProvider } from './context/BadgeContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import PipelinePage from './pages/PipelinePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TasksPage from './pages/TasksPage';
import NotesPage from './pages/NotesPage';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  useEffect(() => {
    // Apply saved theme
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    const clearBadge = () => { if ('clearAppBadge' in navigator) navigator.clearAppBadge(); };
    clearBadge();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) clearBadge(); });
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontFamily: 'inherit', fontSize: '14px' } }} />
      <AuthProvider>
        <BadgeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
        </BadgeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
