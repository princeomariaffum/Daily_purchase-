import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #0f5a1f 0%, #083311 100%)', position: 'relative', overflow: 'hidden' }}>

      {/* Background decorative circles */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(240,195,48,0.08)', top: -100, right: -100 }}/>
      <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'rgba(240,195,48,0.05)', bottom: 80, left: -60 }}/>

      {/* Left Branding Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative' }} className="hidden lg:flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <img src="/kuapa-logo.png" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>Kuapa Kokoo</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 44, fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>
          Daily Purchase<br/>
          <span style={{ color: '#f0c330' }}>Records System</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.7, maxWidth: 360 }}>
          The all-in-one platform for managing cocoa purchases across all zones and districts — built for the field and the office.
        </p>
        <div style={{ marginTop: 48, display: 'flex', gap: 32 }}>
          {[['Offline-First', 'No internet? No problem.'], ['Secure Sync', 'End-to-end JWT auth.'], ['Real-time', 'Dashboards update live.']].map(([t,s]) => (
            <div key={t}>
              <p style={{ color: '#f0c330', fontWeight: 700, fontSize: 13 }}>{t}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Login Form */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '40px 36px', width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }} className="animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/kuapa-logo.png" alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>Welcome back</h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>Sign in to your admin account</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 14px', borderRadius: 10, marginBottom: 20, fontSize: 14, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Username</label>
              <input
                type="text"
                placeholder="e.g. admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor='#0f5a1f'}
                onBlur={e => e.target.style.borderColor='#e5e7eb'}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor='#0f5a1f'}
                onBlur={e => e.target.style.borderColor='#e5e7eb'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0f5a1f, #083311)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 16px rgba(15,90,31,0.35)', fontFamily: 'Inter, sans-serif' }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#d1d5db' }}>
            Kuapa Kokoo Daily Purchase Records System v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
