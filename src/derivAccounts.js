const API_BASE = 'https://api.derivws.com';

export async function getAccounts(accessToken, appId = import.meta.env.DERIV_APP_ID) {
  if (!accessToken) throw new Error('Deriv authentication token is missing');
  const response = await fetch(`${API_BASE}/trading/v1/options/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Deriv-App-ID': appId,
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.errors?.[0]?.message || data?.error || 'Unable to load Deriv accounts';
    throw new Error(message);
  }

  return Array.isArray(data?.data) ? data.data : (Array.isArray(data?.accounts) ? data.accounts : []);
}
