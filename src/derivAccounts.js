export async function getAccounts(accessToken) {
  const response = await fetch('https://api.deriv.com/trading/v1/options/accounts', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load Deriv accounts');
  }

  return response.json();
}
