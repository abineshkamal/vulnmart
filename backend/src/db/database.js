const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, '../../vuln_app.db');

let _db = null;
let _wrap = null;

class Statement {
  constructor(sqlDb, sql) {
    this.sqlDb = sqlDb;
    this.sql   = sql;
  }

  _rows(params) {
    const stmt = this.sqlDb.prepare(this.sql);
    if (params && params.length) stmt.bind(params);
    const cols = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) {
      const vals = stmt.get();
      const obj  = {};
      cols.forEach((c, i) => { obj[c] = vals[i]; });
      rows.push(obj);
    }
    stmt.free();
    return rows;
  }

  get(...args) {
    const params = args.flat().filter(v => v !== undefined);
    return this._rows(params)[0];
  }

  all(...args) {
    const params = args.flat().filter(v => v !== undefined);
    return this._rows(params);
  }

  run(...args) {
    const params = args.flat().filter(v => v !== undefined);
    this.sqlDb.run(this.sql, params.length ? params : undefined);
    _persist();
    const meta = this.sqlDb.exec('SELECT last_insert_rowid() AS id, changes() AS ch');
    const row  = meta[0]?.values[0] || [0, 0];
    return { lastInsertRowid: row[0], changes: row[1] };
  }
}

class DB {
  constructor(sqlDb) { this.sqlDb = sqlDb; }

  prepare(sql)  { return new Statement(this.sqlDb, sql); }
  pragma(_str)  { /* compatibility no-op */ }

  exec(sql) {
    this.sqlDb.exec(sql);
    _persist();
  }
}

function _persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  _wrap = new DB(_db);
  _initSchema();
  return _wrap;
}

function getDb() {
  if (!_wrap) throw new Error('DB not ready — await initDb() before use.');
  return _wrap;
}

function _initSchema() {
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT UNIQUE NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT DEFAULT 'user',
      bio        TEXT DEFAULT '',
      reset_token TEXT,
      balance    REAL DEFAULT 100.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      price       REAL NOT NULL,
      stock       INTEGER DEFAULT 10,
      image_url   TEXT,
      category    TEXT DEFAULT 'general',
      created_by  INTEGER
    );
    CREATE TABLE IF NOT EXISTS orders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity   INTEGER DEFAULT 1,
      total      REAL NOT NULL,
      status     TEXT DEFAULT 'pending',
      note       TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id    INTEGER NOT NULL,
      content    TEXT NOT NULL,
      rating     INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      code     TEXT UNIQUE NOT NULL,
      discount REAL NOT NULL,
      used     INTEGER DEFAULT 0,
      max_uses INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      action     TEXT,
      user       TEXT,
      detail     TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { initDb, getDb };
