export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, state } = req.body || {};
  if (!code || !state) return res.status(400).json({ error: 'Missing OAuth callback data' });

  const appId = process.env.DERIV_APP_ID;
  const redirectUri = process.env.DERIV_REDIRECT_URL;
  const clientSecret = process.env.DERIV_CLIENT_SECRET;

  if (!appId || !redirectUri || !clientSecret) {
    return res.status(500).json({ error: 'Deriv OAuth server configuration is incomplete' });
  }

  // This endpoint intentionally keeps the client secret server-side.
  // PKCE verifier support will be added when the registered Deriv OAuth app
  // requires a verifier in its authorization-code exchange.
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: appId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error || 'OAuth exchange failed' });

    return res.status(200).json({ access_token: data.access_token });
  } catch {
    return res.status(502).json({ error: 'Unable to reach Deriv OAuth service' });
  }
}
