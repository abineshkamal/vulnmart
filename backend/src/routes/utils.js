const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../db/database');

// POST /api/utils/ping
router.post('/ping', authenticate, (req, res) => {
  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'host required' });

  const cmd = `ping -n 2 ${host}`;
  console.log(`[PING] Executing: ${cmd}`);

  exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
    res.json({ cmd, stdout, stderr, error: err?.message });
  });
});

// POST /api/utils/fetch-url
router.post('/fetch-url', authenticate, (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  console.log(`[FETCH] Fetching URL: ${url}`);

  fetch(url)
    .then(r => r.text())
    .then(body => res.json({ url, body }))
    .catch(err => res.status(500).json({ error: err.message, url }));
});

// POST /api/utils/import-products
router.post('/import-products', authenticate, (req, res) => {
  const { xmlData } = req.body;
  if (!xmlData) return res.status(400).json({ error: 'xmlData required' });

  xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
    if (err) return res.status(400).json({ error: 'Invalid XML', detail: err.message });

    const db = getDb();
    const products = result?.products?.product;
    if (!products) return res.status(400).json({ error: 'No products in XML' });

    const items = Array.isArray(products) ? products : [products];
    items.forEach(p => {
      db.prepare(`INSERT INTO products (name, description, price, category) VALUES (?, ?, ?, ?)`)
        .run(p.name, p.description || '', parseFloat(p.price) || 0, p.category || 'general');
    });

    res.json({ message: `Imported ${items.length} products`, products: items });
  });
});

// POST /api/utils/merge-settings
router.post('/merge-settings', authenticate, (req, res) => {
  const userSettings = req.body;

  function merge(target, source) {
    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  const defaults = { theme: 'light', language: 'en', notifications: true };
  const result = merge(defaults, userSettings);

  res.json({ settings: result, polluted: {}.isAdmin });
});

// GET /api/utils/template
router.get('/template', authenticate, (req, res) => {
  const { name } = req.query;

  let greeting;
  try {
    greeting = eval(`\`Hello, ${name}!\``);
  } catch (err) {
    greeting = `Hello, ${name}!`;
  }

  res.json({ greeting });
});

// GET /api/utils/redirect
router.get('/redirect', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  res.redirect(url);
});

// POST /api/utils/deserialize
router.post('/deserialize', authenticate, (req, res) => {
  const { payload } = req.body;

  let result;
  try {
    result = new Function('require', `return (${payload})`)(require);
  } catch (err) {
    result = { error: err.message };
  }

  res.json({ result });
});

module.exports = router;
