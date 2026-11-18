-- Remove UICs from staff accounts, including databases that already ran the
-- earlier version of migration 014.
BEGIN;

ALTER TABLE users ALTER COLUMN uic DROP NOT NULL;

UPDATE users
SET uic =
  COALESCE(NULLIF(left(regexp_replace(
    translate(upper(split_part(trim(full_name), ' ', 1)), 'ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑÝ', 'AAAAAAEEEEIIIIOOOOOUUUUCNY'),
    '[^A-Z]', '', 'g'
  ), 1), ''), 'X')
  || COALESCE(
    NULLIF(left(regexp_replace(
      translate(upper(
        (regexp_split_to_array(trim(full_name), '\s+'))[
          array_length(regexp_split_to_array(trim(full_name), '\s+'), 1)
        ]
      ), 'ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑÝ', 'AAAAAAEEEEIIIIOOOOOUUUUCNY'),
      '[^A-Z]', '', 'g'
    ), 1), ''),
    'X'
  )
  || '-' || lpad(birth_order::text, 2, '0')
  || '-' || to_char(COALESCE(date_of_birth, created_at::date), 'YYYYMMDD')
  || '-' || user_id::text
WHERE role = 'patient';

CREATE UNIQUE INDEX IF NOT EXISTS users_uic_key ON users(uic);

DO $$
DECLARE
  staff RECORD;
BEGIN
  FOR staff IN SELECT user_id, uic, role FROM users WHERE role IN ('health-worker', 'admin') AND uic IS NOT NULL LOOP
    UPDATE activity_logs
    SET actor_name = CASE staff.role WHEN 'admin' THEN 'Administrator' ELSE 'Health worker' END
    WHERE actor_user_id = staff.user_id;
    UPDATE activity_logs
    SET details = replace(details, staff.uic, CASE staff.role WHEN 'admin' THEN 'Administrator' ELSE 'health worker' END)
    WHERE details LIKE '%' || staff.uic || '%';
  END LOOP;
END $$;

UPDATE users
SET uic = NULL
WHERE role IN ('health-worker', 'admin');

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_uic_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_uic_role_check CHECK (
    (role = 'patient' AND uic IS NOT NULL)
    OR (role IN ('health-worker', 'admin') AND uic IS NULL)
  );

COMMIT;
