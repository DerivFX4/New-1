export class DerivTrading {
  constructor(connection) {
    this.connection = connection;
    this.pending = new Map();
    this.unsubscribe = null;
  }

  request(payload, timeout = 15000) {
    const reqId = this.connection.reqId + 1;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(reqId);
        reject(new Error('Deriv request timed out'));
      }, timeout);
      this.pending.set(reqId, { resolve, reject, timer });
      this.connection.request({ ...payload, req_id: reqId });
    });
  }

  handleMessage(data) {
    const item = data?.req_id && this.pending.get(data.req_id);
    if (!item) return;
    clearTimeout(item.timer);
    this.pending.delete(data.req_id);
    if (data.error) item.reject(new Error(data.error.message || 'Deriv API error'));
    else item.resolve(data);
  }

  async proposal({ symbol, contractType = 'CALL', amount, currency, duration = 5, durationUnit = 't', basis = 'stake' }) {
    if (!this.connection.authenticated) throw new Error('Authenticated Deriv trading connection is not ready');
    const response = await this.request({
      proposal: 1,
      amount: Number(amount),
      basis,
      contract_type: contractType,
      currency,
      duration: Number(duration),
      duration_unit: durationUnit,
      symbol,
    });
    return response.proposal;
  }

  async buy(proposalId, price) {
    if (!proposalId) throw new Error('Missing proposal ID');
    const response = await this.request({ buy: proposalId, price: Number(price) });
    return response.buy;
  }

  async openContract(contractId) {
    return this.request({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 });
  }

  async sell(contractId, price = 0) {
    return this.request({ sell: contractId, price: Number(price) });
  }

  async forgetContract(contractId) {
    return this.request({ forget: contractId });
  }
}
