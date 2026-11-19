import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.role);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, pw) => setForm(f => ({ ...f, email, password: pw }));

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>🎓 CampusFix</h1>
          <p>Smarter Reporting · Faster Resolution · Better Campus Life</p>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handle} required placeholder="Ayush Malik" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" value={form.email} onChange={handle} required placeholder="student@kiet.edu" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control" value={form.password} onChange={handle} required placeholder="••••••••" />
          </div>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-control" value={form.role} onChange={handle}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : tab === 'login' ? '🔑 Sign In' : '✅ Register'}
          </button>
        </form>

        {tab === 'login' && (
          <div style={{ marginTop: 20, padding: 14, background: 'var(--gray-50)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>Demo Accounts</div>
            {[
              { label: '🧑‍🎓 Student', email: 'student@kiet.edu', pw: 'student123' },
              { label: '👷 Staff', email: 'staff@kiet.edu', pw: 'staff123' },
              { label: '🛡 Admin', email: 'admin@kiet.edu', pw: 'admin123' },
            ].map(d => (
              <button key={d.email} onClick={() => fillDemo(d.email, d.pw)}
                className="btn btn-secondary btn-sm" style={{ marginRight: 6, marginBottom: 6 }}>
                {d.label}
              </button>
            ))}
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>Click to auto-fill credentials</div>
          </div>
        )}
      </div>
    </div>
  );
}
