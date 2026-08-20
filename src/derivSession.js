export function saveSession(token, type = 'oauth', expiresIn = null) {
  localStorage.setItem('deriv_access_token', token);
  localStorage.setItem('deriv_auth_type', type);
  if (expiresIn) {
    localStorage.setItem('deriv_token_expires_at', String(Date.now() + Number(expiresIn) * 1000));
  } else {
    localStorage.removeItem('deriv_token_expires_at');
  }
}

export function getSession() {
  return {
    token: localStorage.getItem('deriv_access_token'),
    type: localStorage.getItem('deriv_auth_type'),
    expiresAt: Number(localStorage.getItem('deriv_token_expires_at') || 0) || null,
  };
}

export function clearSession() {
  localStorage.removeItem('deriv_access_token');
  localStorage.removeItem('deriv_auth_type');
  localStorage.removeItem('deriv_token_expires_at');
}

export async function loginWithPAT(token) {
  const cleanToken = token.trim();
  if (!cleanToken) throw new Error('Enter a Deriv PAT');
  saveSession(cleanToken, 'pat');
  return cleanToken;
}
