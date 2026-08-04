-- ============================================================
-- V3: System purposes + loan directions required by the engine
-- ------------------------------------------------------------
-- The frontend resolves purpose/subcategory ids by CODE from
-- /master (see PURPOSE_CODES_BY_TYPE, loanDirections()):
--   - "WALLET_TRANSFER" purpose is mandatory for TRANSFER txs
--   - "LOAN" purpose + RECEIVABLE/PAYABLE subcategories are the
--     loan "direction" dropdown options.
-- These are engine-level reference rows, so they are seeded as
-- SYSTEM rows (user_id = NULL) and are visible to EVERY user.
-- If a user previously created a same-code row from a dropdown,
-- it is converted into a system row (user_id = NULL) so the
-- data becomes global, as required.
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
  ON tt."code" = CASE WHEN p."code" = 'WALLET_TRANSFER' THEN 'TRANSFER' ELSE p."code" END
ON CONFLICT ("code") DO UPDATE SET
    "user_id"           = NULL,
    "active"            = true,
    "transaction_type_id" = EXCLUDED."transaction_type_id";

-- Loan directions: RECEIVABLE / PAYABLE subcategories of the LOAN purpose (global)
INSERT INTO "pf_fi_transaction_subcategory"
    ("transaction_purpose_id", "user_id", "code", "name", "description", "active")
SELECT p."id", NULL, s."code", s."name", s."description", true
FROM (VALUES
    ('RECEIVABLE', 'Receivable', 'Loan given to someone — they owe you'),
    ('PAYABLE',    'Payable',    'Loan taken from someone — you owe them')
) AS s("code", "name", "description")
JOIN "pf_fi_transaction_purpose" p ON p."code" = 'LOAN'
ON CONFLICT ("code") DO UPDATE SET
    "user_id"                 = NULL,
    "active"                  = true,
    "transaction_purpose_id"  = EXCLUDED."transaction_purpose_id";
