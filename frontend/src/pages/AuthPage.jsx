import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Layers } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse at 60% 0%, rgba(108,99,255,0.12) 0%, transparent 60%), var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'var(--accent-glow)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 14, marginBottom: 16 }}>
            <Layers size={24} color="var(--accent-light)" />
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>TaskFlow</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Team task management, simplified</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 28, gap: 4 }}>
            {['Login', 'Sign Up'].map((tab, i) => (
              <button key={tab} onClick={() => setIsLogin(i === 0)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
                  background: isLogin === (i === 0) ? 'var(--surface3)' : 'transparent',
                  color: isLogin === (i === 0) ? 'var(--text)' : 'var(--text3)',
                  border: isLogin === (i === 0) ? '1px solid var(--border)' : 'none' }}>
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handle}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? <span className="spinner" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text3)', fontSize: 13 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600 }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
}
