import React, { useState } from 'react';
import { useAuth } from '../App';

export default function ToolsPage() {
  const { token } = useAuth();
  const [result, setResult] = useState({});

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function call(key, url, opts) {
    try {
      const res  = await fetch(url, { ...opts, headers: { ...headers, ...(opts?.headers || {}) } });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      setResult(r => ({ ...r, [key]: parsed }));
    } catch (e) {
      setResult(r => ({ ...r, [key]: { error: e.message } }));
    }
  }

  const [fields, setFields] = useState({
    ping:     '127.0.0.1',
    ssrf:     'http://localhost:4000/api/health',
    xml:      `<?xml version="1.0"?>\n<products><product><name>Sample Product</name><price>9.99</price></product></products>`,
    proto:    '{"theme":"dark"}',
    ssti:     'World',
    deser:    `"hello world"`,
    jwtToken: '',
    redirect: 'https://example.com',
  });

  function setF(k, v) { setFields(f => ({ ...f, [k]: v })); }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 4 }}>Developer Tools</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Utility endpoints for testing and integration.</p>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>Network Ping</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.ping} onChange={e => setF('ping', e.target.value)} style={{ flex: 1 }} placeholder="Host or IP" />
          <button className="btn btn-primary" onClick={() => call('ping', '/api/utils/ping', { method: 'POST', body: JSON.stringify({ host: fields.ping }) })}>Ping</button>
        </div>
        {result.ping && <pre style={{ marginTop: 8 }}>{JSON.stringify(result.ping, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>URL Fetcher</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.ssrf} onChange={e => setF('ssrf', e.target.value)} style={{ flex: 1 }} placeholder="https://..." />
          <button className="btn btn-primary" onClick={() => call('ssrf', '/api/utils/fetch-url', { method: 'POST', body: JSON.stringify({ url: fields.ssrf }) })}>Fetch</button>
        </div>
        {result.ssrf && <pre style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(result.ssrf, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>XML Product Import</h3>
        <textarea rows={5} value={fields.xml} onChange={e => setF('xml', e.target.value)} style={{ marginBottom: 8 }} />
        <button className="btn btn-primary" onClick={() => call('xxe', '/api/utils/import-products', { method: 'POST', body: JSON.stringify({ xmlData: fields.xml }) })}>Import</button>
        {result.xxe && <pre style={{ marginTop: 8 }}>{JSON.stringify(result.xxe, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>Settings Sync</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.proto} onChange={e => setF('proto', e.target.value)} style={{ flex: 1 }} placeholder='{"theme":"dark"}' />
          <button className="btn btn-primary" onClick={() => {
            try { call('proto', '/api/utils/merge-settings', { method: 'POST', body: JSON.stringify(JSON.parse(fields.proto)) }); } catch {}
          }}>Sync</button>
        </div>
        {result.proto && <pre style={{ marginTop: 8 }}>{JSON.stringify(result.proto, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>Greeting Preview</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.ssti} onChange={e => setF('ssti', e.target.value)} style={{ flex: 1 }} placeholder="Your name" />
          <button className="btn btn-primary" onClick={() => call('ssti', `/api/utils/template?name=${encodeURIComponent(fields.ssti)}`)}>Preview</button>
        </div>
        {result.ssti && <pre style={{ marginTop: 8 }}>{JSON.stringify(result.ssti, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>Expression Evaluator</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.deser} onChange={e => setF('deser', e.target.value)} style={{ flex: 1 }} placeholder='"hello world"' />
          <button className="btn btn-primary" onClick={() => call('deser', '/api/utils/deserialize', { method: 'POST', body: JSON.stringify({ payload: fields.deser }) })}>Evaluate</button>
        </div>
        {result.deser && <pre style={{ marginTop: 8 }}>{JSON.stringify(result.deser, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 12 }}>Token Inspector</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.jwtToken} onChange={e => setF('jwtToken', e.target.value)} style={{ flex: 1 }} placeholder="Paste JWT token" />
          <button className="btn btn-primary" onClick={() => call('jwttest', '/api/auth/profile', { headers: { Authorization: `Bearer ${fields.jwtToken}` } })}>Inspect</button>
        </div>
        {result.jwttest && <pre style={{ marginTop: 8 }}>{JSON.stringify(result.jwttest, null, 2)}</pre>}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Open Redirect</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={fields.redirect} onChange={e => setF('redirect', e.target.value)} style={{ flex: 1 }} />
          <a className="btn btn-primary" href={`/api/utils/redirect?url=${encodeURIComponent(fields.redirect)}`} target="_blank" rel="noreferrer">Go</a>
        </div>
      </div>
    </div>
  );
}
