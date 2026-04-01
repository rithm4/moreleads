import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import TasksPage from './pages/TasksPage';
import NotesPage from './pages/NotesPage';
import FilesPage from './pages/FilesPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="files" element={<FilesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
