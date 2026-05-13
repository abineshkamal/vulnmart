import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: '' });
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error || JSON.stringify(data));
    setMsg(`Registered! User ID: ${data.userId}`);
    setTimeout(() => navigate('/login'), 1500);
  }

  return (
    <div style={{ maxWidth: 440, margin: '60px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: 20 }}>Register</h2>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input value={form.role} placeholder="user" onChange={e => setForm(f => ({...f, role: e.target.value}))} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Register</button>
        </form>
        <p style={{ marginTop: 14, fontSize: 13 }}>Have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
