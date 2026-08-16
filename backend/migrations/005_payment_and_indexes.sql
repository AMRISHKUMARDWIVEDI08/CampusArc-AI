-- CampusArc AI migration 005: payment integration fields and idempotency indexes.
ALTER TABLE schools ADD COLUMN circle_wallet_id TEXT;
CREATE INDEX IF NOT EXISTS idx_schools_circle_wallet ON schools(circle_wallet_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_memo_ref ON transactions(memo_ref) WHERE memo_ref IS NOT NULL;
INSERT INTO schema_version(version) VALUES (5);
