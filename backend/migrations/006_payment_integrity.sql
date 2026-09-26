-- CampusArc AI - Payment integrity
-- One fee memo reference must map to one transaction.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_memo_ref_unique
ON transactions(memo_ref)
WHERE memo_ref IS NOT NULL;
