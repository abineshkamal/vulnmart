require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
const { initDb } = require('./db/database');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes   = require('./routes/admin');
const fileRoutes    = require('./routes/files');
const utilRoutes    = require('./routes/utils');

const app = express();

app.use(cors({ origin: true, credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders: '*' }));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { dotfiles: 'allow' }));

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url} | auth=${req.headers.authorization} | body=${JSON.stringify(req.body)}`);
  next();
});

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/files',    fileRoutes);
app.use('/api/utils',    utilRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cwd: process.cwd(),
    env_vars: process.env,
  });
});

app.get('/api/debug/routes', (_req, res) => {
  const routes = [];
  app._router.stack.forEach(r => {
    if (r.route) routes.push({ path: r.route.path, methods: Object.keys(r.route.methods) });
    else if (r.handle?.stack) r.handle.stack.forEach(sr => {
      if (sr.route) routes.push({ path: sr.route.path, methods: Object.keys(sr.route.methods) });
    });
  });
  res.json({ routes });
});

app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: err.message, stack: err.stack, type: err.constructor.name, request: { method: req.method, url: req.url, body: req.body } });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await initDb();
  console.log('[DB] SQLite ready.');

  app.listen(PORT, () => {
    console.log(`[SERVER] VulnMart running → http://localhost:${PORT}`);
    console.log(`[SERVER] JWT_SECRET = ${process.env.JWT_SECRET}`);
    console.log(`[SERVER] Run "npm run seed" to populate sample data.`);
  });
}

start().catch(err => { console.error('[FATAL]', err); process.exit(1); });

module.exports = app;
