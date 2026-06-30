const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/brain.db');

let db;

function initDB() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      title TEXT,
      source_type TEXT,
      domain TEXT,
      topics TEXT,
      summary TEXT,
      raw_content TEXT,
      word_count INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      captured_at TEXT DEFAULT (datetime('now')),
      last_accessed TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS queries (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT,
      sources TEXT,
      asked_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 1,
      last_seen TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database initialized at', DB_PATH);
  return Promise.resolve(db);
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

module.exports = { initDB, getDB };
