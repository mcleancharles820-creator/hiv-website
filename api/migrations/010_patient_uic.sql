-- Add unique patient codes and the family birth-order input used to construct them.
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_order INTEGER NOT NULL DEFAULT 1;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS uic VARCHAR(32);

UPDATE users
SET uic = COALESCE(
  NULLIF(upper(left(regexp_replace(split_part(trim(full_name), ' ', 1), '[^A-Za-z]', '', 'g'), 1)), ''),
  'X'
) || '-' || lpad(birth_order::text, 2, '0')
  || '-' || to_char(COALESCE(date_of_birth, created_at::date), 'YYYYMMDD')
  || '-' || lpad(user_id::text, 6, '0')
WHERE uic IS NULL;

ALTER TABLE users
  ALTER COLUMN uic SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_uic_key ON users(uic);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND conname = 'users_birth_order_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_birth_order_check CHECK (birth_order BETWEEN 1 AND 50);
  END IF;
END $$;

DO $$
DECLARE
  gender_constraint RECORD;
BEGIN
  FOR gender_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%gender%'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', gender_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE users
  ADD CONSTRAINT users_gender_check CHECK (
    gender IS NULL OR gender IN (
      'Male', 'Female', 'Other',
      'Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Self-describe'
    )
  );

COMMIT;
