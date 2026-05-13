const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });
    req.user = decoded;
    console.log(`[AUTH] User authenticated: ${JSON.stringify(decoded)}`);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', detail: err.message, stack: err.stack });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

function optionalAuth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });
  } catch (_) {}
  next();
}

module.exports = { authenticate, requireAdmin, optionalAuth };
