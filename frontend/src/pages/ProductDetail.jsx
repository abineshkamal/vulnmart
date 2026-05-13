import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';

export default function ProductDetail() {
  const { id }    = useParams();
  const { token, user } = useAuth();
  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [review, setReview]     = useState('');
  const [rating, setRating]     = useState(5);
  const [order, setOrder]         = useState({ quantity: 1, coupon_code: '', note: '' });
  const [paymentToken, setPaymentToken] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => setProduct(d.product));
    fetch(`/api/products/${id}/reviews`).then(r => r.json()).then(d => setReviews(d.reviews || []));
  }, [id]);

  async function submitReview(e) {
    e.preventDefault();
    const res = await fetch(`/api/products/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: review, rating }),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error);
    setMsg('Review added');
    setReview('');
    fetch(`/api/products/${id}/reviews`).then(r => r.json()).then(d => setReviews(d.reviews || []));
  }

  async function placeOrder(e) {
    e.preventDefault();
    const res = await fetch('/api/products/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: id, ...order }),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error || JSON.stringify(data));
    setMsg(`Order #${data.orderId} placed! Total: $${data.total}`);
  }

  async function expressCheckout() {
    setErr(''); setMsg('');
    const res = await fetch('/api/products/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: id, payment_token: paymentToken }),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error || JSON.stringify(data));
    setMsg(`Express order #${data.orderId} placed! Total: $${data.total}`);
  }

  if (!product) return <div className="card">Loading…</div>;

  return (
    <div>
      <div className="card">
        <h2>{product.name}</h2>
        <p style={{ color: '#64748b', margin: '8px 0' }}>{product.description}</p>
        <div style={{ fontSize: 24, color: '#2563eb', fontWeight: 700, marginBottom: 16 }}>${product.price}</div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        {user && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={paymentToken}
              onChange={e => setPaymentToken(e.target.value)}
              placeholder="Payment token"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={expressCheckout}>Express Checkout</button>
          </div>
        )}

        {user && (
          <form onSubmit={placeOrder} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Qty</label>
              <input type="number" style={{ width: 70 }} value={order.quantity} onChange={e => setOrder(o => ({...o, quantity: e.target.value}))} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Coupon</label>
              <input value={order.coupon_code} placeholder="Coupon code" onChange={e => setOrder(o => ({...o, coupon_code: e.target.value}))} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 2 }}>
              <label>Order note</label>
              <input value={order.note} onChange={e => setOrder(o => ({...o, note: e.target.value}))} />
            </div>
            <button className="btn btn-primary">Buy</button>
          </form>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Reviews</h3>
        {reviews.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
            <strong>{r.username}</strong> — ⭐{r.rating}
            <div dangerouslySetInnerHTML={{ __html: r.content }} />
          </div>
        ))}
        {user && (
          <form onSubmit={submitReview} style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Write a review</label>
              <textarea rows={3} value={review} onChange={e => setReview(e.target.value)} />
            </div>
            <button className="btn btn-primary">Submit Review</button>
          </form>
        )}
      </div>
    </div>
  );
}
