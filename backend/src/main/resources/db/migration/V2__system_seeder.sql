-- ============================================================
-- System seeder (migration-time): the ONLY reference data seeded
-- by the schema. Transaction types and statuses are required by
-- the transaction engine at runtime and are globally shared.
-- Wallet types, purposes and subcategories are user-created via
-- the creatable dropdowns (no seed rows).
-- ============================================================

-- Transaction Types
INSERT INTO "pf_fi_transaction_type" ("code", "name", "description", "active") VALUES
('INCOME',   'Income',    'Money received from any source',      true),
('EXPENSE',  'Expense',   'Money spent on any category',         true),
('TRANSFER', 'Transfer',  'Money moved between wallets',         true),
('LOAN',     'Loan',      'Loan given or received',              true);

-- Transaction Statuses
INSERT INTO "pf_fi_transaction_status" ("code", "name", "active") VALUES
('PENDING',   'Pending',    true),
('COMPLETED', 'Completed',  true),
('FAILED',    'Failed',     true),
('REVERSED',  'Reversed',   true);
