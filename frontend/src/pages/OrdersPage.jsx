import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [orderId, setOrderId] = useState('');
  const [single, setSingle]   = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/products/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(d.orders || []));
  }, [token]);

  async function fetchOrder() {
    setError(''); setSingle(null);
    const res  = await fetch(`/api/products/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data));
    setSingle(data.order);
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Orders</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Enter order ID" style={{ width: 180 }} />
          <button className="btn btn-primary" onClick={fetchOrder}>Fetch Order</button>
        </div>
        {error  && <div className="alert alert-error">{error}</div>}
        {single && (
          <div className="alert alert-info">
            <strong>Order #{single.id}</strong> — {single.username} ({single.email}) — {single.product_name} — ${single.total}
            {single.note && <div>Note: {single.note}</div>}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>My Orders</h3>
        {orders.length === 0 ? <p>No orders found.</p> : (
          <table>
            <thead>
              <tr><th>ID</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Note</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.product_name || o.product_id}</td>
                  <td>{o.quantity}</td>
                  <td>${o.total}</td>
                  <td><span className={`badge ${o.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>{o.status}</span></td>
                  <td style={{ fontSize: 12 }}>{o.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
