const API_BASE = 'https://api.derivws.com';
const PUBLIC_WS = 'wss://api.derivws.com/trading/v1/options/ws/public';

export async function getAuthenticatedWsUrl({ appId, accessToken, accountId }) {
  if (!appId || !accessToken || !accountId) throw new Error('Deriv account authentication is incomplete');
  const response = await fetch(`${API_BASE}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Deriv-App-ID': appId, Accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.data?.url) throw new Error(data?.errors?.[0]?.message || data?.error || 'Unable to authenticate Deriv trading connection');
  return data.data.url;
}

export class DerivConnection {
  constructor({ appId, accessToken, accountId, onStatus, onTick, onBalance, onMessage }) {
    Object.assign(this, { appId, accessToken, accountId, onStatus, onTick, onBalance, onMessage });
    this.ws = null; this.reqId = 0; this.authenticated = false;
  }

  async connect() {
    this.disconnect();
    let wsUrl = PUBLIC_WS;
    if (this.accessToken && this.accountId) {
      this.onStatus?.('Authenticating Deriv account…');
      wsUrl = await getAuthenticatedWsUrl({ appId: this.appId, accessToken: this.accessToken, accountId: this.accountId });
    }
    this.onStatus?.(this.accessToken ? 'Connecting to authenticated trading account…' : 'Connecting to public market…');
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      this.authenticated = Boolean(this.accessToken && this.accountId);
      this.onStatus?.(this.authenticated ? 'Trading connection live' : 'Live market connected');
      if (this.authenticated) this.request({ balance: 1, subscribe: 1 });
      this.subscribeTicks('R_100');
    };
    this.ws.onclose = () => { this.authenticated = false; this.onStatus?.('Deriv connection closed'); };
    this.ws.onerror = () => this.onStatus?.('Deriv connection error');
    this.ws.onmessage = event => {
      let data; try { data = JSON.parse(event.data); } catch { return; }
      this.onMessage?.(data);
      if (data.error) this.onStatus?.(data.error.message || 'Deriv API error');
      if (data.tick) this.onTick?.(data.tick);
      if (data.balance) this.onBalance?.(data.balance);
    };
  }

  request(payload) {
    if (this.ws?.readyState !== WebSocket.OPEN) throw new Error('Deriv WebSocket is not connected');
    const reqId = ++this.reqId;
    this.ws.send(JSON.stringify({ ...payload, req_id: reqId }));
    return reqId;
  }

  subscribeTicks(symbol = 'R_100') { return this.request({ ticks: symbol, subscribe: 1 }); }
  send(payload) {
    if (!this.authenticated) throw new Error('Authenticated Deriv trading connection is not ready');
    return this.request(payload);
  }
  disconnect() { if (this.ws) { this.ws.onclose = null; this.ws.close(); } this.ws = null; this.authenticated = false; }
}

export const derivConfig = {
  appId: import.meta.env.DERIV_APP_ID || '',
  redirectUrl: import.meta.env.DERIV_REDIRECT_URL || '',
  oauthScope: import.meta.env.DERIV_OAUTH_SCOPE || '',
};
