export function consumeEmailVerificationToken() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (params.get('type') !== 'signup') return null;

  const accessToken = params.get('access_token') || null;
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  return { accessToken };
}
