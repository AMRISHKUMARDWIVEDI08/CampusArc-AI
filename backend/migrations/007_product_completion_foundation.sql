-- CampusArc AI - Migration 007
ALTER TABLE schools ADD COLUMN join_code TEXT;
ALTER TABLE users ADD COLUMN wallet_address TEXT;
ALTER TABLE students ADD COLUMN class_name TEXT;
ALTER TABLE students ADD COLUMN section TEXT;
ALTER TABLE students ADD COLUMN guardian_name TEXT;
ALTER TABLE students ADD COLUMN guardian_email TEXT;
ALTER TABLE students ADD COLUMN phone TEXT;
UPDATE schools SET join_code = 'CAMPUS-' || printf('%06d', id) WHERE join_code IS NULL OR trim(join_code) = '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_join_code ON schools(join_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE TABLE IF NOT EXISTS wallet_challenges (id INTEGER PRIMARY KEY AUTOINCREMENT,wallet_address TEXT NOT NULL,nonce TEXT NOT NULL UNIQUE,message TEXT NOT NULL,expires_at TEXT NOT NULL,used_at TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_address ON wallet_challenges(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_expiry ON wallet_challenges(expires_at);
CREATE TABLE IF NOT EXISTS login_events (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,method TEXT NOT NULL,success INTEGER NOT NULL DEFAULT 1,ip_address TEXT,user_agent TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id);