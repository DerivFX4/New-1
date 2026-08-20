import { readOAuthCallback } from './derivAuth';
import { saveSession } from './derivSession';

export async function handleOAuthCallback() {
  const callback = readOAuthCallback();
  if (!callback) return false;

  // The authorization-code exchange must be performed by a trusted backend
  // endpoint; do not expose a Deriv client secret in the browser bundle.
  const response = await fetch('/api/deriv/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: callback.code, state: callback.state }),
  });

  if (!response.ok) throw new Error('Deriv OAuth token exchange failed');
  const data = await response.json();
  if (!data.access_token) throw new Error('Deriv OAuth returned no access token');

  saveSession(data.access_token);
  sessionStorage.removeItem('deriv_oauth_state');
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}
