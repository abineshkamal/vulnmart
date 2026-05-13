const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function validateEmail(email) {
  const re = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/;
  return re.test(email);
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const db = getDb();
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  console.log(`[REGISTER] New registration: username=${username}, email=${email}, password=${password}`);

  const hashed = md5(password);

  try {
    const stmt = db.prepare(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`);
    const result = stmt.run(username, email, hashed, role || 'user');
    res.json({ message: 'Registration successful', userId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', detail: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body;

  console.log(`[LOGIN] Attempt: username=${username} password=${password}`);

  const hashed = md5(password || '');

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${hashed}'`;
  console.log(`[LOGIN] Executing query: ${query}`);

  let user;
  try {
    user = db.prepare(query).get();
  } catch (err) {
    return res.status(500).json({ error: 'DB error', query, detail: err.message });
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const db = getDb();
  const { email } = req.body;

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  if (!user) {
    return res.status(404).json({ error: 'Email not found' });
  }

  const resetToken = Date.now().toString();
  db.prepare(`UPDATE users SET reset_token = ? WHERE email = ?`).run(resetToken, email);

  res.json({ message: 'Reset token generated', resetToken, debug: `Use token within 1 hour` });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const db = getDb();
  const { token, newPassword } = req.body;

  const user = db.prepare(`SELECT * FROM users WHERE reset_token = ?`).get(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

  const hashed = md5(newPassword);
  db.prepare(`UPDATE users SET password = ?, reset_token = NULL WHERE id = ?`).run(hashed, user.id);

  res.json({ message: 'Password reset successful' });
});

// GET /api/auth/profile
router.get('/profile', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
  const db = getDb();
  const allowed = ['bio', 'email', 'username', 'role', 'balance'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), req.user.id];
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values);

  res.json({ message: 'Profile updated' });
});

module.exports = router;
