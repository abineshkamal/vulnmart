import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

export default function AdminPage() {
  const { token } = useAuth();
  const [tab, setTab]       = useState('users');
  const [users, setUsers]   = useState([]);
  const [orders, setOrders] = useState([]);
  const [config, setConfig] = useState(null);
  const [logs, setLogs]     = useState([]);
  const [broadcast, setBroadcast] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [plugins, setPlugins]       = useState([]);
  const [pluginName, setPluginName] = useState('');
  const [pluginResult, setPluginResult] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (tab === 'plugins') fetch('/api/admin/plugins', { headers }).then(r => r.json()).then(d => setPlugins(d.plugins || []));
    if (tab === 'users')  fetch('/api/admin/users',  { headers }).then(r => r.json()).then(d => setUsers(d.users || []));
    if (tab === 'orders') fetch(`/api/admin/orders${statusFilter ? `?status=${statusFilter}` : ''}`, { headers }).then(r => r.json()).then(d => setOrders(d.orders || []));
    if (tab === 'config') fetch('/api/admin/config', { headers }).then(r => r.json()).then(d => setConfig(d));
    if (tab === 'logs')   fetch('/api/admin/logs',   { headers }).then(r => r.json()).then(d => setLogs(d.logs || []));
  }, [tab, statusFilter, token]);

  async function deleteUser(id) {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers });
    setUsers(u => u.filter(x => x.id !== id));
    setMsg(`User ${id} deleted`);
  }

  async function sendBroadcast() {
    const res  = await fetch('/api/admin/broadcast', { method: 'POST', headers, body: JSON.stringify({ message: broadcast }) });
    const data = await res.json();
    setMsg(`Broadcast: ${data.content}`);
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Admin Panel</h2>
        {msg && <div className="alert alert-success" style={{ margin: '12px 0' }}>{msg}</div>}
        <div className="tabs">
          {['users','orders','config','logs','broadcast','plugins'].map(t => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>

        {tab === 'users' && (
          <table>
            <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Password</th><th>Balance</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span></td>
                  <td><code style={{ fontSize: 11 }}>{u.password}</code></td>
                  <td>${u.balance}</td>
                  <td><button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteUser(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'orders' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={statusFilter} onChange={e => setStatusFilter(e.target.value)} placeholder="Filter by status" style={{ width: 260 }} />
              <button className="btn btn-primary" onClick={() => setTab('orders')}>Filter</button>
            </div>
            <table>
              <thead><tr><th>ID</th><th>User</th><th>Email</th><th>Total</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td><td>{o.username}</td><td>{o.email}</td>
                    <td>${o.total}</td>
                    <td><span className={`badge ${o.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>{o.status}</span></td>
                    <td style={{ fontSize: 12 }}>{o.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'config' && config && (
          <div>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}

        {tab === 'logs' && (
          <table>
            <thead><tr><th>ID</th><th>Action</th><th>User</th><th>Detail</th><th>Time</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>{l.id}</td><td>{l.action}</td><td>{l.user}</td>
                  <td style={{ fontSize: 12 }}>{l.detail}</td>
                  <td style={{ fontSize: 12 }}>{l.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'broadcast' && (
          <div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows={4} value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="Enter announcement message" />
            </div>
            <button className="btn btn-primary" onClick={sendBroadcast}>Send Broadcast</button>
            {msg && <div className="alert alert-info" style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: msg }} />}
          </div>
        )}

        {tab === 'plugins' && (
          <div>
            <h4 style={{ marginBottom: 12 }}>Installed Packages</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {plugins.map(p => <code key={p} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{p}</code>)}
            </div>
            <h4 style={{ marginBottom: 8 }}>Load Plugin</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={pluginName}
                onChange={e => setPluginName(e.target.value)}
                placeholder="Package name"
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={async () => {
                const res = await fetch('/api/admin/plugins/load', { method: 'POST', headers, body: JSON.stringify({ plugin: pluginName }) });
                setPluginResult(await res.json());
              }}>Load</button>
            </div>
            {pluginResult && <pre style={{ marginTop: 8 }}>{JSON.stringify(pluginResult, null, 2)}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}
