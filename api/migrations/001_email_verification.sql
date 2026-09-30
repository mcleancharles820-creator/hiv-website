-- Upgrade an existing HIVeLink database without dropping application data.
-- Existing accounts remain able to sign in; accounts created after this migration
-- default to unverified and must consume an email verification link.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ALTER COLUMN email_verified SET DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token_id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user
  ON email_verification_tokens(user_id, expires_at);
