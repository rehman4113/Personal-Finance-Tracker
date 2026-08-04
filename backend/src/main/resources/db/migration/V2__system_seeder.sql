-- ============================================================
-- System seeder (migration-time): all reference data required by
-- the transaction engine. Transaction types, statuses, the
-- WALLET_TRANSFER purpose, the LOAN purpose and its
-- RECEIVABLE/PAYABLE loan-direction subcategories are seeded as
-- SYSTEM rows (user_id = NULL) and are globally shared.
-- Wallet types and other purposes/subcategories are user-created
-- via the creatable dropdowns (no seed rows).
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

-- ============================================================
-- System purposes + loan directions required by the engine
-- ------------------------------------------------------------
-- The frontend resolves purpose/subcategory ids by CODE from
-- /master (see PURPOSE_CODES_BY_TYPE, loanDirections()):
--   - "WALLET_TRANSFER" purpose is mandatory for TRANSFER txs
--   - "LOAN" purpose + RECEIVABLE/PAYABLE subcategories are the
--     loan "direction" dropdown options.
-- These are engine-level reference rows, seeded as SYSTEM rows
-- (user_id = NULL) so they are visible to EVERY user.
-- ============================================================

-- Purposes: LOAN and WALLET_TRANSFER (global, system-owned)
INSERT INTO "pf_fi_transaction_purpose"
    ("transaction_type_id", "user_id", "code", "name", "description", "active")
SELECT tt."id", NULL, p."code", p."name", p."description", true
FROM (VALUES
    ('LOAN',           'Loan',           'Loan given or received'),
    ('WALLET_TRANSFER','Wallet Transfer','Money moved between own wallets')
) AS p("code", "name", "description")
JOIN "pf_fi_transaction_type" tt
  ON tt."code" = CASE WHEN p."code" = 'WALLET_TRANSFER' THEN 'TRANSFER' ELSE p."code" END;

-- Loan directions: RECEIVABLE / PAYABLE subcategories of the LOAN purpose (global)
INSERT INTO "pf_fi_transaction_subcategory"
    ("transaction_purpose_id", "user_id", "code", "name", "description", "active")
SELECT p."id", NULL, s."code", s."name", s."description", true
FROM (VALUES
    ('RECEIVABLE', 'Receivable', 'Loan given to someone — they owe you'),
    ('PAYABLE',    'Payable',    'Loan taken from someone — you owe them')
) AS s("code", "name", "description")
JOIN "pf_fi_transaction_purpose" p ON p."code" = 'LOAN';
