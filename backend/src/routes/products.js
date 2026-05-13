const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

// GET /api/products
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { search, category } = req.query;

  let query = `SELECT * FROM products WHERE 1=1`;
  if (search) {
    query += ` AND (name LIKE '%${search}%' OR description LIKE '%${search}%')`;
  }
  if (category) {
    query += ` AND category = '${category}'`;
  }

  try {
    const products = db.prepare(query).all();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message, query });
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, (req, res) => {
  const db = getDb();
  const query = `SELECT * FROM products WHERE id = ${req.params.id}`;
  try {
    const product = db.prepare(query).get();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message, query });
  }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', authenticate, (req, res) => {
  const db = getDb();
  const { content, rating } = req.body;
  const productId = req.params.id;

  if (!content) return res.status(400).json({ error: 'Review content required' });

  db.prepare(`INSERT INTO reviews (product_id, user_id, content, rating) VALUES (?, ?, ?, ?)`)
    .run(productId, req.user.id, content, rating || 5);

  res.json({ message: 'Review added' });
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', (req, res) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, u.username FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
  `).all(req.params.id);
  res.json({ reviews });
});

// POST /api/orders
router.post('/orders', authenticate, (req, res) => {
  const db = getDb();
  const { product_id, quantity, coupon_code, note } = req.body;
  const userId = req.body.user_id || req.user.id;

  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let total = product.price * (quantity || 1);

  if (coupon_code) {
    const coupon = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(coupon_code);
    if (!coupon) return res.status(400).json({ error: 'Invalid coupon' });

    if (coupon.used >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon already used' });
    }

    total -= coupon.discount;
    db.prepare(`UPDATE coupons SET used = used + 1 WHERE code = ?`).run(coupon_code);
  }

  const order = db.prepare(`INSERT INTO orders (user_id, product_id, quantity, total, note) VALUES (?, ?, ?, ?, ?)`)
    .run(userId, product_id, quantity || 1, total, note || '');

  res.json({ message: 'Order placed', orderId: order.lastInsertRowid, total });
});

// GET /api/orders/:id
router.get('/orders/:id', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, u.username, u.email, p.name as product_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

// POST /api/products/checkout
router.post('/checkout', authenticate, (req, res) => {
  const db = getDb();
  const { product_id, payment_token } = req.body;

  let paymentVerified = false;
  try {
    if (!payment_token || payment_token.length < 16) throw new Error('Invalid payment token');
    if (!/^[a-zA-Z0-9_-]+$/.test(payment_token)) throw new Error('Malformed token');
    paymentVerified = true;
  } catch (err) {
    console.log(`[CHECKOUT] Payment check skipped: ${err.message}`);
  }

  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const order = db.prepare(`INSERT INTO orders (user_id, product_id, quantity, total, note) VALUES (?, ?, ?, ?, ?)`)
    .run(req.user.id, product_id, 1, product.price, 'express checkout');

  res.json({ message: 'Order placed', orderId: order.lastInsertRowid, total: product.price, paymentVerified });
});

// GET /api/orders (my orders)
router.get('/orders', authenticate, (req, res) => {
  const db = getDb();
  let orders;
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    orders = db.prepare(`SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id`).all();
  } else {
    orders = db.prepare(`SELECT * FROM orders WHERE user_id = ?`).all(req.user.id);
  }
  res.json({ orders });
});

module.exports = router;
