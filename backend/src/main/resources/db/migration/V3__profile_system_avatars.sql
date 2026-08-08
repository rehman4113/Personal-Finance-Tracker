-- ============================================================
-- Consolidation of historical V3..V6 (initial balance purpose,
-- profile icon, curated avatars) into a single V3.
--
-- WHY MERGED: V1 + V2 are the only commits in git. The old V3..V6
-- were never committed, so this file replaces all of them:
--   1. Opening-balance purpose for wallet creation (system-owned).
--   2. Curated avatar catalog (6 cartoon people) + profile picture
--      columns on "users".
-- The legacy free-form "profile_icon" (Bootstrap Icons name) column
-- is intentionally NOT created - avatars/profile pictures replaced it.
-- ============================================================

-- 1) Opening-balance purpose (from old V3)
INSERT INTO "pf_fi_transaction_purpose"
    ("transaction_type_id", "user_id", "code", "name", "description", "active")
SELECT tt."id", NULL, 'INITIAL_BALANCE', 'Initial Balance', 'Opening balance added when a wallet is created', true
FROM "pf_fi_transaction_type" tt
WHERE tt."code" = 'INCOME'
ON CONFLICT ("code") DO NOTHING;

-- 2) Curated avatar catalog - six distinct cartoon people with
--    stable ids 1..6 so stored profileIconId values stay valid.
CREATE TABLE "pf_profile_avatars" (
  "id" BIGSERIAL PRIMARY KEY,
  "code" varchar(32) UNIQUE NOT NULL,
  "name" varchar(60) NOT NULL,
  "asset_path" varchar(255) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

INSERT INTO "pf_profile_avatars" ("code", "name", "asset_path") VALUES
  ('boy',     'Boy',         '/assets/avatars/avatar-1.svg'),
  ('girl',    'Girl',        '/assets/avatars/avatar-2.svg'),
  ('man',     'Young Man',   '/assets/avatars/avatar-3.svg'),
  ('lady',    'Lady',        '/assets/avatars/avatar-4.svg'),
  ('teen',    'Teen Girl',   '/assets/avatars/avatar-5.svg'),
  ('grandpa', 'Grandfather', '/assets/avatars/avatar-6.svg');

-- 3) User profile columns (new avatar model) - no legacy "profile_icon"
ALTER TABLE "users" ADD COLUMN "profile_icon_id" bigint;
ALTER TABLE "users" ADD COLUMN "profile_picture_url" varchar(500);