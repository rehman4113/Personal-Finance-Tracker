-- ============================================================
-- Initial Schema (DDL only)
-- Schema DDL is versioned here. The ONLY system seed rows live in
-- V2 (transaction types + statuses). Wallet types, purposes and
-- subcategories are user-created via the creatable dropdowns.
-- ============================================================
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100),
  "email" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "phone_number" varchar(20),
  "status" varchar(20) DEFAULT 'ACTIVE',
  "email_verified" boolean DEFAULT false,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

CREATE TABLE "refresh_tokens" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "token" varchar(500) UNIQUE NOT NULL,
  "expiry_date" timestamp NOT NULL,
  "revoked" boolean DEFAULT false,
  "created_at" timestamp
);

CREATE TABLE "user_settings" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint UNIQUE NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "currency" varchar(10),
  "language" varchar(20),
  "timezone" varchar(100),
  "theme" varchar(20),
  "date_format" varchar(30),
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "pf_fi_wallet_types" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint,
  "code" varchar(30) NOT NULL,
  "name" varchar(100),
  "description" varchar(255),
  "active" boolean DEFAULT true,
  UNIQUE ("user_id", "code")
);

CREATE INDEX ON "pf_fi_wallet_types" ("user_id");

CREATE TABLE "pf_fi_wallets" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "wallet_type_id" bigint NOT NULL REFERENCES "pf_fi_wallet_types"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "wallet_name" varchar(100),
  "currency" varchar(10),
  "initial_balance" decimal(19,2) DEFAULT 0,
  "current_balance" decimal(19,2) DEFAULT 0,
  "account_number" varchar(100),
  "description" text,
  "status" varchar(20) DEFAULT 'ACTIVE',
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamp,
  "updated_at" timestamp,
  UNIQUE ("user_id", "wallet_type_id", "account_number")
);

CREATE TABLE "pf_fi_transaction_type" (
  "id" BIGSERIAL PRIMARY KEY,
  "code" varchar(30) UNIQUE,
  "name" varchar(100),
  "description" varchar(255),
  "active" boolean DEFAULT true
);

CREATE TABLE "pf_fi_transaction_purpose" (
  "id" BIGSERIAL PRIMARY KEY,
  "transaction_type_id" bigint NOT NULL REFERENCES "pf_fi_transaction_type"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "user_id" bigint,
  "code" varchar(30) UNIQUE,
  "name" varchar(100),
  "description" varchar(255),
  "active" boolean DEFAULT true
);

CREATE TABLE "pf_fi_transaction_status" (
  "id" BIGSERIAL PRIMARY KEY,
  "code" varchar(30) UNIQUE,
  "name" varchar(50),
  "active" boolean DEFAULT true
);

CREATE TABLE "pf_fi_transaction_subcategory" (
  "id" BIGSERIAL PRIMARY KEY,
  "transaction_purpose_id" bigint NOT NULL REFERENCES "pf_fi_transaction_purpose"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "user_id" bigint,
  "code" varchar(30) UNIQUE,
  "name" varchar(100),
  "description" varchar(255),
  "active" boolean DEFAULT true
);

CREATE TABLE "pf_fi_receipt_attachment" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "file_name" varchar(255),
  "original_name" varchar(255),
  "file_type" varchar(50),
  "file_size" bigint,
  "file_path" varchar(500),
  "uploaded_at" timestamp,
  UNIQUE ("user_id", "file_name")
);

CREATE TABLE "pf_fi_transaction_history" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "total_amount" decimal(19,2) NOT NULL,
  "description" varchar(255),
  "person_name" varchar(150),
  "transaction_type_id" bigint NOT NULL REFERENCES "pf_fi_transaction_type"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_purpose_id" bigint NOT NULL REFERENCES "pf_fi_transaction_purpose"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_status_id" bigint NOT NULL REFERENCES "pf_fi_transaction_status"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_subcategory_id" bigint REFERENCES "pf_fi_transaction_subcategory"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_date" timestamp NOT NULL,
  "reference_number" varchar(100),
  "notes" text,
  "attachment_id" bigint REFERENCES "pf_fi_receipt_attachment"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "created_at" timestamp,
  "updated_at" timestamp,
  UNIQUE ("user_id", "reference_number")
);

CREATE TABLE "pf_fi_transaction_details" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "wallet_id" bigint REFERENCES "pf_fi_wallets"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "source_wallet_id" bigint REFERENCES "pf_fi_wallets"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "destination_wallet_id" bigint REFERENCES "pf_fi_wallets"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "amount" decimal(19,2) NOT NULL,
  "merchant" varchar(150),
  "transaction_history_id" bigint NOT NULL REFERENCES "pf_fi_transaction_history"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "pf_fi_ledger_entry" (
  "id" BIGSERIAL PRIMARY KEY,
  "transaction_detail_id" bigint NOT NULL REFERENCES "pf_fi_transaction_details"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "wallet_id" bigint NOT NULL REFERENCES "pf_fi_wallets"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "debit" decimal(19,2) DEFAULT 0,
  "credit" decimal(19,2) DEFAULT 0,
  "balance_after" decimal(19,2),
  "remarks" text,
  "created_at" timestamp,
  UNIQUE ("transaction_detail_id", "wallet_id")
);

CREATE TABLE "pf_fi_budget_limits" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_purpose_id" bigint NOT NULL REFERENCES "pf_fi_transaction_purpose"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "monthly_limit" decimal(19,2) NOT NULL,
  "month" varchar(7) NOT NULL,
  "warning_threshold" integer DEFAULT 80,
  "created_at" timestamp,
  "updated_at" timestamp,
  UNIQUE ("user_id", "transaction_purpose_id", "month")
);

CREATE TABLE "pf_fi_loan_users" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "full_name" varchar(150) NOT NULL,
  "contact_number" varchar(50),
  "unique_key" varchar(255) UNIQUE NOT NULL,
  "current_amount" decimal(19,2) DEFAULT 0,
  "loan_status" varchar(20) DEFAULT 'CLOSED',
  "notes" text,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE INDEX ON "pf_fi_loan_users" ("user_id");

CREATE TABLE "pf_fi_loan_history" (
  "id" BIGSERIAL PRIMARY KEY,
  "loan_user_id" bigint NOT NULL REFERENCES "pf_fi_loan_users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_history_id" bigint REFERENCES "pf_fi_transaction_history"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "transaction_detail_id" bigint REFERENCES "pf_fi_transaction_details"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "amount" decimal(19,2) NOT NULL,
  "previous_amount" decimal(19,2) DEFAULT 0,
  "current_amount" decimal(19,2) NOT NULL,
  "previous_status" varchar(20),
  "current_status" varchar(20) NOT NULL,
  "transaction_type" varchar(20) NOT NULL,
  "remarks" text,
  "created_at" timestamp
);

CREATE INDEX ON "pf_fi_loan_history" ("loan_user_id");
CREATE INDEX ON "pf_fi_loan_history" ("transaction_history_id");

CREATE TABLE "pf_fi_shared_expenses" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "total_amount" decimal(19,2) NOT NULL,
  "description" varchar(255),
  "split_type" varchar(20),
  "num_members" integer,
  "expense_date" timestamp NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "pf_fi_shared_expense_members" (
  "id" BIGSERIAL PRIMARY KEY,
  "shared_expense_id" bigint NOT NULL REFERENCES "pf_fi_shared_expenses"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "member_name" varchar(150) NOT NULL,
  "share_amount" decimal(19,2) NOT NULL,
  "settled" boolean DEFAULT false,
  "settled_date" timestamp,
  "created_at" timestamp,
  UNIQUE ("shared_expense_id", "member_name")
);

CREATE TABLE "audit_log" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "module_name" varchar(100),
  "action" varchar(50),
  "entity_name" varchar(100),
  "entity_id" bigint,
  "old_value" jsonb,
  "new_value" jsonb,
  "ip_address" varchar(50),
  "created_at" timestamp
);

CREATE TABLE "login_history" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint NOT NULL REFERENCES "users"("id") DEFERRABLE INITIALLY IMMEDIATE,
  "login_time" timestamp,
  "logout_time" timestamp,
  "ip_address" varchar(50),
  "device" varchar(255),
  "browser" varchar(255),
  "operating_system" varchar(255),
  "login_status" varchar(20)
);

CREATE TABLE "system_configuration" (
  "id" BIGSERIAL PRIMARY KEY,
  "config_key" varchar(100) UNIQUE,
  "config_value" text,
  "description" varchar(255),
  "active" boolean DEFAULT true,
  "updated_at" timestamp
);

-- Indexes for user-ownable master items (user_id NULL = system seed) and system wallets
CREATE INDEX "idx_purpose_user_id"     ON "pf_fi_transaction_purpose" ("user_id");
CREATE INDEX "idx_subcategory_user_id" ON "pf_fi_transaction_subcategory" ("user_id");
CREATE INDEX "idx_wallets_is_system"   ON "pf_fi_wallets" ("user_id", "is_system");
