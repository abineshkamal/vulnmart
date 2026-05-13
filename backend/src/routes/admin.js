const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', authenticate, (req, res) => {
  const db = getDb();

  if (req.user.role !== 'admin' && req.headers['x-admin-override'] !== 'true') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const users = db.prepare(`SELECT * FROM users`).all();
  res.json({ users });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);
  res.json({ message: `User ${req.params.id} deleted` });
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const { role } = req.body;
  db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

// GET /api/admin/orders
router.get('/orders', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const { status, user } = req.query;

  let query = `SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1`;
  if (status) query += ` AND o.status = '${status}'`;
  if (user)   query += ` AND u.username LIKE '%${user}%'`;

  try {
    const orders = db.prepare(query).all();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message, query });
  }
});

// POST /api/admin/products
router.post('/products', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const { name, description, price, stock, image_url, category } = req.body;
  const result = db.prepare(`INSERT INTO products (name, description, price, stock, image_url, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(name, description, price, stock || 10, image_url, category || 'general', req.user.id);
  res.json({ message: 'Product created', productId: result.lastInsertRowid });
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM products WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Product deleted' });
});

// GET /api/admin/logs
router.get('/logs', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const logs = db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`).all();
  res.json({ logs });
});

// GET /api/admin/config
router.get('/config', authenticate, requireAdmin, (req, res) => {
  res.json({
    jwt_secret:       process.env.JWT_SECRET,
    admin_password:   process.env.ADMIN_PASSWORD,
    internal_api_key: process.env.INTERNAL_API_KEY,
    stripe_key:       process.env.STRIPE_SECRET_KEY,
    node_env:         process.env.NODE_ENV || 'development',
    db_path:          require('path').join(__dirname, '../../vuln_app.db'),
  });
});

// POST /api/admin/broadcast
router.post('/broadcast', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const { message } = req.body;
  db.prepare(`INSERT INTO audit_logs (action, user, detail) VALUES (?, ?, ?)`)
    .run('broadcast', req.user.username, message);
  res.json({ message: 'Broadcast sent', content: message });
});

// GET /api/admin/plugins
router.get('/plugins', authenticate, requireAdmin, (req, res) => {
  const installed = Object.keys(require('../../package.json').dependencies || {});
  res.json({ plugins: installed });
});

// POST /api/admin/plugins/load
router.post('/plugins/load', authenticate, requireAdmin, (req, res) => {
  const { plugin } = req.body;
  if (!plugin) return res.status(400).json({ error: 'plugin name required' });

  try {
    const mod = require(plugin);
    res.json({ message: 'Plugin loaded', plugin, exports: Object.keys(mod) });
  } catch (err) {
    res.status(500).json({ error: err.message, plugin });
  }
});

module.exports = router;
