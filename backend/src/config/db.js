const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'data', 'musicify.db');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    mimetype TEXT,
    size INTEGER,
    duration_seconds REAL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    chords_json TEXT NOT NULL,
    tabs_json TEXT NOT NULL,
    summary TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(id)
  );
`);

module.exports = db;
