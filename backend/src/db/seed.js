const { initDb } = require('./database');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

async function seed() {
  const DB_PATH = path.join(__dirname, '../../vuln_app.db');
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = await initDb();

  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM coupons;
    DELETE FROM reviews;
    DELETE FROM orders;
    DELETE FROM products;
    DELETE FROM users;
  `);

  const iu = db.prepare(`INSERT OR IGNORE INTO users (username,email,password,role,bio,balance) VALUES (?,?,?,?,?,?)`);
  iu.run('admin',   'admin@vulnmart.local',   md5('admin123'),   'admin',   'Site administrator', 9999.00);
  iu.run('alice',   'alice@example.com',      md5('password1'),  'user',    'I love shopping!',   200.00);
  iu.run('bob',     'bob@example.com',        md5('bob123'),     'user',    'Regular buyer',      150.00);
  iu.run('charlie', 'charlie@example.com',    md5('charlie'),    'user',    'New user',            50.00);
  iu.run('manager', 'manager@vulnmart.local', md5('manager123'), 'manager', 'Store manager',      500.00);

  const ip = db.prepare(`INSERT INTO products (name,description,price,stock,image_url,category) VALUES (?,?,?,?,?,?)`);
  ip.run('Wireless Headphones', 'Premium noise-cancelling headphones', 99.99,  20, '/uploads/public/headphones.jpg', 'electronics');
  ip.run('Running Shoes',       'Lightweight trail running shoes',     79.99,  15, '/uploads/public/shoes.jpg',      'footwear');
  ip.run('Smart Watch',         'Fitness tracking smartwatch',         149.99, 10, '/uploads/public/watch.jpg',      'electronics');
  ip.run('Coffee Maker',        'Programmable drip coffee maker',       49.99, 25, '/uploads/public/coffee.jpg',     'appliances');
  ip.run('Yoga Mat',            'Non-slip eco-friendly yoga mat',       29.99, 30, '/uploads/public/yoga.jpg',       'fitness');

  const io = db.prepare(`INSERT INTO orders (user_id,product_id,quantity,total,status,note) VALUES (?,?,?,?,?,?)`);
  io.run(2, 1, 1,  99.99, 'completed', 'Please gift wrap');
  io.run(2, 3, 1, 149.99, 'pending',   'Urgent delivery needed');
  io.run(3, 2, 2, 159.98, 'completed', '');
  io.run(4, 5, 1,  29.99, 'pending',   '');
  io.run(1, 4, 1,  49.99, 'completed', 'Admin test order — CC: 4111111111111111 exp 12/26');

  const ir = db.prepare(`INSERT INTO reviews (product_id,user_id,content,rating) VALUES (?,?,?,?)`);
  ir.run(1, 2, 'Amazing sound quality!', 5);
  ir.run(1, 3, 'Good but a bit pricey.', 4);
  ir.run(2, 4, 'Very comfortable shoes.', 5);

  const ic = db.prepare(`INSERT INTO coupons (code,discount,used,max_uses) VALUES (?,?,?,?)`);
  ic.run('SAVE10',    10.00, 0, 100);
  ic.run('HALF50',    50.00, 0, 1);
  ic.run('FREESHIP',   5.00, 0,  50);

  console.log('[seed] Database seeded successfully.');
}

seed().catch(err => { console.error('[seed] Failed:', err); process.exit(1); });
