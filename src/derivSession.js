export function saveSession(token, type = 'oauth') {
  localStorage.setItem('deriv_access_token', token);
  localStorage.setItem('deriv_auth_type', type);
}

export function getSession() {
  return {
    token: localStorage.getItem('deriv_access_token'),
    type: localStorage.getItem('deriv_auth_type'),
  };
}

export function clearSession() {
  localStorage.removeItem('deriv_access_token');
  localStorage.removeItem('deriv_auth_type');
}

export async function loginWithPAT(token) {
  saveSession(token, 'pat');
  return token;
}
