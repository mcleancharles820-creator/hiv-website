-- Accept the new gender labels while retaining existing stored values.
-- The application offers Male/Female/Other for patients and Male/Female for workers.
BEGIN;

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
