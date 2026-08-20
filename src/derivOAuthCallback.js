import { readOAuthCallback } from './derivAuth';
import { saveSession } from './derivSession';

export async function handleOAuthCallback() {
  const callback = readOAuthCallback();
  if (!callback) return false;

  const response = await fetch('/api/deriv/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: callback.code,
      state: callback.state,
      code_verifier: callback.verifier,
    }),
  });

  if (!response.ok) {
    let message = 'Deriv OAuth token exchange failed';
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  if (!data.access_token) throw new Error('Deriv OAuth returned no access token');

  saveSession(data.access_token, 'oauth', data.expires_in);
  sessionStorage.removeItem('deriv_oauth_state');
  sessionStorage.removeItem('deriv_oauth_verifier');
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}
