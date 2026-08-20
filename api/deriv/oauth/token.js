export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, state, code_verifier } = req.body || {};
  if (!code || !state || !code_verifier) {
    return res.status(400).json({ error: 'Missing OAuth callback data' });
  }

  const appId = process.env.DERIV_APP_ID;
  const redirectUri = process.env.DERIV_REDIRECT_URL;

  if (!appId || !redirectUri) {
    return res.status(500).json({ error: 'Deriv OAuth server configuration is incomplete' });
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: appId,
    code_verifier,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OAuth exchange failed' });
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch {
    return res.status(502).json({ error: 'Unable to reach Deriv OAuth service' });
  }
}
