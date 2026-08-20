const AUTH_URL = 'https://auth.deriv.com/oauth2/auth';

function randomState() {
  return crypto.randomUUID();
}

export function startDerivOAuth() {
  const appId = import.meta.env.DERIV_APP_ID;
  const redirect = import.meta.env.DERIV_REDIRECT_URL;
  const scope = import.meta.env.DERIV_OAUTH_SCOPE || 'trade application_read payment';

  const state = randomState();
  sessionStorage.setItem('deriv_oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appId,
    redirect_uri: redirect,
    scope,
    state,
  });

  window.location.href = `${AUTH_URL}?${params.toString()}`;
}

export function readOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const saved = sessionStorage.getItem('deriv_oauth_state');

  if (!code || !state || state !== saved) return null;

  return { code, state };
}
