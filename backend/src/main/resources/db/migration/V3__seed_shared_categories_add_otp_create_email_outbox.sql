-- ============================================================
-- Consolidated migration (formerly V3 + V4 + V5):
--   1. Shared INCOME/EXPENSE purposes and subcategories (SYSTEM rows)
--   2. OTP columns on "users" (email verification + password reset)
--   3. "email_outbox" table (transactional OTP delivery queue)
-- ============================================================

-- ============================================================
-- Part 1: Shared user-facing reference data (migration-time)
-- ------------------------------------------------------------
-- Seeds a small set of INCOME/EXPENSE purposes and subcategories
-- as SYSTEM rows (user_id = NULL) so every user starts with the
-- same basic categories out of the box.
--
-- ON CONFLICT (code) DO NOTHING keeps this migration safe even
-- if the same rows were already inserted manually into Supabase
-- (the code column is globally UNIQUE on both tables).
-- ============================================================

-- 4 INCOME purposes
INSERT INTO "pf_fi_transaction_purpose" ("transaction_type_id", "user_id", "code", "name", "description", "active")
SELECT tt."id", NULL, p."code", p."name", p."description", true
FROM (VALUES
    ('SALARY',      'Salary',      'Regular salary or wage income'),
    ('FREELANCE',   'Freelance',   'Income from freelance or gig work'),
    ('BUSINESS',    'Business',    'Income from a business or side venture'),
    ('INVESTMENT',  'Investment',  'Income from investments, dividends, interest')
) AS p("code", "name", "description")
JOIN "pf_fi_transaction_type" tt ON tt."code" = 'INCOME'
ON CONFLICT ("code") DO NOTHING;

-- 4 EXPENSE purposes
INSERT INTO "pf_fi_transaction_purpose" ("transaction_type_id", "user_id", "code", "name", "description", "active")
SELECT tt."id", NULL, p."code", p."name", p."description", true
FROM (VALUES
    ('GROCERIES',   'Groceries',   'Food and household groceries'),
    ('HOUSING',     'Housing',     'Rent, mortgage and home maintenance'),
    ('TRANSPORT',   'Transport',   'Fuel, public transport and travel'),
    ('UTILITIES',   'Utilities',   'Electricity, water, internet and phone bills')
) AS p("code", "name", "description")
JOIN "pf_fi_transaction_type" tt ON tt."code" = 'EXPENSE'
ON CONFLICT ("code") DO NOTHING;

-- 4 subcategories: 2 for SALARY (income), 2 for HOUSING (expense)
INSERT INTO "pf_fi_transaction_subcategory" ("transaction_purpose_id", "user_id", "code", "name", "description", "active")
SELECT pr."id", NULL, s."code", s."name", s."description", true
FROM (VALUES
    ('MONTHLY_SALARY',  'Monthly Salary',  'Regular monthly pay',      'SALARY'),
    ('BONUS',           'Bonus',           'Bonus or incentive pay',   'SALARY'),
    ('RENT',            'Rent',            'Monthly rent payment',     'HOUSING'),
    ('MAINTENANCE',     'Maintenance',     'Home repairs and upkeep',  'HOUSING')
) AS s("code", "name", "description", "purpose_code")
JOIN "pf_fi_transaction_purpose" pr ON pr."code" = s."purpose_code"
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- Part 2: Add OTP columns to "users" (email verification + password reset).
-- A single otp column is reused for both flows: the most recent
-- generation simply overwrites the previous value and its expiry,
-- so only one code is ever valid per user at a time.
-- Expiry timestamps are stored in UTC (see AuthServiceImpl's
-- UTC_ZONE constant) so generation and validation always agree.
-- ============================================================
ALTER TABLE "users"
    ADD COLUMN "otp" VARCHAR(6),
    ADD COLUMN "otp_expiry_time" TIMESTAMP;

-- ============================================================
-- Part 3: Email outbox: transactional OTP delivery queue.
-- Auth flows (register / forgot-password) only INSERT rows here;
-- EmailOutboxScheduler polls PENDING rows in batches of 20 and
-- sends them via Brevo SMTP, updating status as it goes.
-- ============================================================
CREATE TABLE "email_outbox" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
    "email" VARCHAR(255) NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "attempt_count" INT NOT NULL DEFAULT 0,
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMP NOT NULL,
    "sent_at" TIMESTAMP
);

-- Scheduler polling: oldest PENDING rows first.
CREATE INDEX ON "email_outbox" ("status");
CREATE INDEX ON "email_outbox" ("created_at");
