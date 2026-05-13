import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({});
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetResult, setResetResult] = useState('');

  useEffect(() => {
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setProfile(d.user); setForm(d.user || {}); });
  }, [token]);

  async function updateProfile(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error);
    setMsg('Profile updated');
  }

  async function requestReset() {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail }),
    });
    const data = await res.json();
    setResetResult(JSON.stringify(data, null, 2));
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>My Profile</h2>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}
        {profile && (
          <form onSubmit={updateProfile}>
            {['username','email','bio','role','balance'].map(field => (
              <div className="form-group" key={field}>
                <label>{field}</label>
                <input value={form[field] || ''} onChange={e => setForm(f => ({...f, [field]: e.target.value}))} />
              </div>
            ))}
            <button className="btn btn-primary">Update Profile</button>
          </form>
        )}
      </div>

      {profile && (
        <div className="card">
          <h4 style={{ marginBottom: 8 }}>Account Data</h4>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Password Reset</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Email address" />
          <button className="btn btn-primary" onClick={requestReset}>Request Reset</button>
        </div>
        {resetResult && <pre style={{ marginTop: 12 }}>{resetResult}</pre>}
      </div>
    </div>
  );
}
