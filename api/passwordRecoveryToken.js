/**
 * Classify recovery callback tokens after Supabase Auth has validated them
 * with getUser(accessToken). Implicit recovery callbacks are marked `otp` by
 * Supabase even though the email challenge type is `recovery`.
 */
const RECOVERY_AUTH_METHODS = new Set(['otp', 'recovery']);

module.exports = function isPasswordRecoveryToken(accessToken) {
  const tokenParts = String(accessToken || '').split('.');
  if (tokenParts.length !== 3 || !tokenParts[1]) return false;

  try {
    const claims = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
    const methods = Array.isArray(claims.amr) ? claims.amr : [];
    return methods.some((entry) => RECOVERY_AUTH_METHODS.has(
      typeof entry === 'string' ? entry : entry?.method,
    ));
  } catch {
    return false;
  }
};
