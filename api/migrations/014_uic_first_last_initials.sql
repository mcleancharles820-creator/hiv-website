-- Regenerate UICs with first and last initials while retaining a unique user ID suffix.
BEGIN;

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
      ]), 'ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑÝ', 'AAAAAAEEEEIIIIOOOOOUUUUCNY'),
      '[^A-Z]', '', 'g'
    ), 1), ''),
    'X'
  )
  || '-' || lpad(birth_order::text, 2, '0')
  || '-' || to_char(COALESCE(date_of_birth, created_at::date), 'YYYYMMDD')
  || '-' || user_id::text;

CREATE UNIQUE INDEX IF NOT EXISTS users_uic_key ON users(uic);

COMMIT;
