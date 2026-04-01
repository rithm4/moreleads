import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.error || 'Ceva a mers greșit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">⚡</span>
          <h1>Moreleads Hub</h1>
          <p>Platforma internă de echipă</p>
        </div>

        <div className="login-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >Autentificare</button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >Cont nou</button>
        </div>

        <form onSubmit={handle} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>Nume complet</label>
              <input
                type="text"
                placeholder="Ion Popescu"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="ion@companie.ro"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Parolă</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Se încarcă...' : mode === 'login' ? 'Intră în cont' : 'Creează cont'}
          </button>
        </form>
      </div>
    </div>
  );
}
