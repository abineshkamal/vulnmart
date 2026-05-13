import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState('');
  const [raw, setRaw]           = useState('');

  async function fetchProducts(q) {
    const url = `/api/products${q ? `?search=${encodeURIComponent(q)}` : ''}`;
    const res  = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await res.json();
    if (data.error) setError(JSON.stringify(data));
    setProducts(data.products || []);
    setRaw(JSON.stringify(data, null, 2));
  }

  useEffect(() => { fetchProducts(''); }, []);

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Shop</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => fetchProducts(search)}>Search</button>
        </div>
        {error && <div className="alert alert-error" style={{ fontSize: 12 }}>{error}</div>}
        <div className="grid-products">
          {products.map(p => (
            <div key={p.id} className="product-card">
              <div style={{ height: 120, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🛍️</div>
              <div className="info">
                <div className="name">{p.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', margin: '4px 0 8px' }}>{p.description}</div>
                <div className="price">${p.price}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Stock: {p.stock}</span>
                  <Link to={`/products/${p.id}`} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }}>View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {raw && (
        <div className="card">
          <h4 style={{ marginBottom: 8 }}>Raw API Response</h4>
          <pre>{raw}</pre>
        </div>
      )}
    </div>
  );
}
