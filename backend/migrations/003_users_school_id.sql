-- CampusArc AI - Migration 003
ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
INSERT INTO schema_version (version) VALUES (3);
