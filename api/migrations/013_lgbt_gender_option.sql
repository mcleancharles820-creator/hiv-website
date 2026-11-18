BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;

ALTER TABLE users
  ADD CONSTRAINT users_gender_check CHECK (
    gender IS NULL OR gender IN (
      'Male', 'Female', 'Other', 'Lesbian, Gay, Bisexual, and Transgender',
      'LGBT', 'Woman', 'Man', 'Non-binary', 'Prefer not to say',
      'Self-describe', 'Self-described'
    )
  );

COMMIT;
