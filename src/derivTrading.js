export class DerivTrading {
  constructor(connection) {
    this.connection = connection;
    this.pending = new Map();
    this.nextId = 0;
    this.unsubscribe = null;
    this.handleMessage = this.handleMessage.bind(this);
  }

  request(payload, timeout = 15000) {
    if (!this.connection.authenticated) return Promise.reject(new Error('Authenticated Deriv trading connection is not ready'));
    const reqId = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(reqId); reject(new Error('Deriv request timed out')); }, timeout);
      this.pending.set(reqId, { resolve, reject, timer });
      try { this.connection.send({ ...payload, req_id: reqId }); }
      catch (error) { clearTimeout(timer); this.pending.delete(reqId); reject(error); }
    });
  }

  handleMessage(data) {
    const item = data?.req_id && this.pending.get(data.req_id);
    if (!item) return false;
    clearTimeout(item.timer); this.pending.delete(data.req_id);
    if (data.error) item.reject(new Error(data.error.message || 'Deriv API error'));
    else item.resolve(data);
    return true;
  }

  async proposal({ symbol, contractType = 'CALL', amount, currency, duration = 5, durationUnit = 't', basis = 'stake' }) {
    if (!symbol || !currency || Number(amount) <= 0) throw new Error('Enter a valid symbol, amount and currency');
    const response = await this.request({ proposal: 1, amount: Number(amount), basis, contract_type: contractType, currency, duration: Number(duration), duration_unit: durationUnit, symbol });
    return response.proposal;
  }

  async buy(proposalId, price) {
    if (!proposalId) throw new Error('Missing proposal ID');
    const response = await this.request({ buy: proposalId, price: Number(price) });
    return response.buy;
  }

  async openContract(contractId) {
    if (!contractId) throw new Error('Missing contract ID');
    return this.request({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 });
  }

  async sell(contractId, price = 0) {
    if (!contractId) throw new Error('Missing contract ID');
    const response = await this.request({ sell: contractId, price: Number(price) });
    return response.sell;
  }

  async forgetContract(contractId) { return this.request({ forget: contractId }); }
}
