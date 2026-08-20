export class BotEngine {
  constructor({ trading, currency, onEvent }) {
    this.trading = trading;
    this.currency = currency;
    this.onEvent = onEvent || (() => {});
    this.running = false;
    this.stake = 1;
    this.duration = 5;
    this.symbol = 'R_10';
    this.contractType = 'CALL';
    this.currentContract = null;
  }

  emit(type, message, data = {}) { this.onEvent({ type, message, ...data }); }

  async execute(xmlText) {
    if (!this.trading) throw new Error('Trading connection is not ready');
    if (!xmlText) throw new Error('Build a bot before running it');
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const blocks = [...doc.querySelectorAll('block')];
    const volatility = blocks.find(b => b.getAttribute('type') === 'market_volatility');
    const contract = blocks.find(b => b.getAttribute('type') === 'trade_contract');
    const purchase = blocks.find(b => b.getAttribute('type') === 'trade_purchase');
    const sell = blocks.find(b => b.getAttribute('type') === 'trade_sell');
    if (volatility) this.symbol = volatility.querySelector('field[name="SYMBOL"]')?.textContent || this.symbol;
    if (contract) this.duration = Number(contract.querySelector('field[name="DURATION"]')?.textContent || this.duration);
    if (purchase) this.stake = Number(purchase.querySelector('field[name="AMOUNT"]')?.textContent || this.stake);
    this.running = true;
    this.emit('start', `Bot started on ${this.symbol}`, { symbol: this.symbol, stake: this.stake, duration: this.duration });
    const proposal = await this.trading.proposal({ symbol: this.symbol, contractType: this.contractType, amount: this.stake, currency: this.currency, duration: this.duration, durationUnit: 't' });
    if (!this.running) return null;
    this.emit('proposal', `Proposal received · ${proposal.ask_price} ${this.currency}`, { proposal });
    const bought = await this.trading.buy(proposal.id, proposal.ask_price);
    this.currentContract = bought;
    this.emit('buy', `Contract purchased · ${bought.contract_id || bought.transaction_id}`, { contract: bought });
    if (bought.contract_id) await this.trading.openContract(bought.contract_id);
    if (sell && bought.contract_id && this.running) {
      const sold = await this.trading.sell(bought.contract_id, 0);
      this.emit('sell', `Contract sold`, { result: sold });
    }
    return bought;
  }

  stop() { this.running = false; this.emit('stop', 'Bot stopped'); }
}
