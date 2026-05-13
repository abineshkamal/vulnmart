import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

export default function FilesPage() {
  const { token } = useAuth();
  const [files, setFiles]             = useState([]);
  const [dlFile, setDlFile]           = useState('');
  const [viewFile, setViewFile]       = useState('');
  const [viewContent, setViewContent] = useState('');
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadMsg, setUploadMsg]     = useState('');
  const [err, setErr] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  function loadList() {
    fetch('/api/files/list', { headers }).then(r => r.json()).then(d => setFiles(d.files || []));
  }

  useEffect(() => { loadList(); }, [token]);

  async function uploadHandler() {
    if (!uploadFile) return;
    const fd = new FormData();
    fd.append('file', uploadFile);
    const res  = await fetch('/api/files/upload', { method: 'POST', headers, body: fd });
    const data = await res.json();
    setUploadMsg(JSON.stringify(data, null, 2));
    loadList();
  }

  async function viewHandler() {
    setErr(''); setViewContent('');
    const res = await fetch(`/api/files/view?file=${encodeURIComponent(viewFile)}`, { headers });
    if (res.ok) setViewContent(await res.text());
    else setErr(await res.text());
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>File Manager</h2>

        <h4 style={{ marginBottom: 8 }}>Upload File</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input type="file" style={{ flex: 1 }} onChange={e => setUploadFile(e.target.files[0])} />
          <button className="btn btn-primary" onClick={uploadHandler}>Upload</button>
        </div>
        {uploadMsg && <pre style={{ marginBottom: 12 }}>{uploadMsg}</pre>}

        <h4 style={{ marginBottom: 8 }}>View File</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={viewFile} onChange={e => setViewFile(e.target.value)} placeholder="Filename" style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={viewHandler}>View</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {viewContent && <pre style={{ maxHeight: 300, overflow: 'auto' }}>{viewContent}</pre>}

        <h4 style={{ margin: '16px 0 8px' }}>Download File</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={dlFile} onChange={e => setDlFile(e.target.value)} placeholder="Filename" style={{ flex: 1 }} />
          <a className="btn btn-primary" href={`/api/files/download?file=${encodeURIComponent(dlFile)}`} download>Download</a>
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: 8 }}>Uploaded Files</h4>
        <ul>
          {files.map(f => (
            <li key={f} style={{ fontSize: 13, padding: '3px 0' }}>
              <code>{f}</code>
              <a style={{ marginLeft: 12 }} href={`/api/files/download?file=${encodeURIComponent(f)}`} download>↓</a>
            </li>
          ))}
        </ul>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={loadList}>Refresh</button>
      </div>
    </div>
  );
}
