function recoveryParams() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.hash.replace(/^#/, ''));
}

export function isPasswordRecoveryRedirect() {
  if (typeof window === 'undefined') return false;
  const params = recoveryParams();
  const isRecoveryToken = params?.get('type') === 'recovery';
  const hasExpiredRecoveryError = new URLSearchParams(window.location.search).get('password-reset') === '1'
    && Boolean(params?.get('error') || params?.get('error_code'));
  return isRecoveryToken || hasExpiredRecoveryError;
}

export function consumePasswordRecoveryToken() {
  const params = recoveryParams();
  const isPasswordResetPage = new URLSearchParams(window.location.search).get('password-reset') === '1';
  if (params?.get('type') !== 'recovery' && !isPasswordResetPage) return null;

  const accessToken = params?.get('access_token') || null;
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('password-reset');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  return accessToken;
}
