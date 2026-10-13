-- Track password changes so signed HIVeLink sessions issued before a reset
-- cannot remain valid after the account password has been changed.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
