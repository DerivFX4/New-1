const WS_ENDPOINT = 'wss://ws.derivws.com/websockets/v3';

export class DerivConnection {
  constructor({ appId, onStatus, onTick }) {
    this.appId = appId;
    this.onStatus = onStatus;
    this.onTick = onTick;
    this.ws = null;
  }

  connect() {
    if (!this.appId) {
      this.onStatus?.('DERIV_APP_ID not configured');
      return;
    }
    this.disconnect();
    this.onStatus?.('Connecting to Deriv live market…');
    this.ws = new WebSocket(`${WS_ENDPOINT}?app_id=${encodeURIComponent(this.appId)}`);
    this.ws.onopen = () => this.onStatus?.('Connected to live market');
    this.ws.onclose = () => this.onStatus?.('Market connection closed');
    this.ws.onerror = () => this.onStatus?.('Market connection error');
    this.ws.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.error) this.onStatus?.(data.error.message);
      if (data.tick) this.onTick?.(data.tick);
    };
  }

  subscribeTicks(symbol = 'R_100') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
    this.ws = null;
  }
}

export const derivConfig = {
  appId: import.meta.env.DERIV_APP_ID || '',
  redirectUrl: import.meta.env.DERIV_REDIRECT_URL || '',
  oauthScope: import.meta.env.DERIV_OAUTH_SCOPE || '',
};
