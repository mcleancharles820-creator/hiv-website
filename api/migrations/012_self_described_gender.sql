BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;

ALTER TABLE users
  ADD CONSTRAINT users_gender_check CHECK (
    gender IS NULL OR gender IN (
      'Male', 'Female', 'Other', 'Woman', 'Man', 'Non-binary',
      'Prefer not to say', 'Self-describe', 'Self-described'
    )
  );

UPDATE activity_logs AS logs
SET actor_name = users.uic
FROM users
WHERE logs.actor_user_id = users.user_id
  AND users.uic IS NOT NULL;

COMMIT;
