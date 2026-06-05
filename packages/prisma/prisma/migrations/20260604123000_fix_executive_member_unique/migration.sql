ALTER TABLE "executive_member"
  ADD COLUMN IF NOT EXISTS "id" BIGSERIAL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'executive_member_pkey'
  ) THEN
    ALTER TABLE "executive_member"
      ADD CONSTRAINT "executive_member_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

ALTER TABLE "executive_member"
  DROP CONSTRAINT IF EXISTS "executive_member_dm_sdate_edate_key";

CREATE UNIQUE INDEX IF NOT EXISTS "executive_member_dm_name_sdate_edate_key"
  ON "executive_member" ("dm", "name", "sdate", "edate");
