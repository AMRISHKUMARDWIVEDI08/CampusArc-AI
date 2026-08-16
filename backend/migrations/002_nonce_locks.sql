-- CampusArc AI - Nonce Lock Table
CREATE TABLE IF NOT EXISTS nonce_locks (id INTEGER PRIMARY KEY AUTOINCREMENT, address TEXT NOT NULL UNIQUE, nonce INTEGER NOT NULL, locked_at TEXT NOT NULL DEFAULT (datetime('now')), lock_token TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_nonce_address ON nonce_locks(address); CREATE INDEX IF NOT EXISTS idx_nonce_locked_at ON nonce_locks(locked_at);
INSERT INTO schema_version (version) VALUES (2);
