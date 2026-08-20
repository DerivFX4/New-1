export class BotEngine {
  constructor({ trading, currency, onEvent }) {
    this.trading = trading;
    this.currency = currency;
    this.onEvent = onEvent || (() => {});
    this.running = false;
    this.stake = 1;
    this.baseStake = 1;
    this.multiplier = 2;
    this.duration = 5;
    this.symbol = 'R_10';
    this.contractType = 'DIGITDIFF';
    this.barrier = 0;
    this.losses = 0;
    this.maxLosses = 3;
  }

  emit(type,message,data={}) { this.onEvent({type,message,...data}); }

  read(xml) {
    const doc = new DOMParser().parseFromString(xml,'text/xml');
    const blocks=[...doc.querySelectorAll('block')];
    const get=(type,name,def)=>blocks.find(b=>b.getAttribute('type')===type)?.querySelector(`field[name="${name}"]`)?.textContent ?? def;
    this.symbol=get('digit_strategy','SYMBOL',this.symbol);
    this.contractType=get('digit_contract','CONTRACT',this.contractType);
    this.barrier=Number(get('digit_barrier','BARRIER',this.barrier));
    this.baseStake=Number(get('digit_stake','STAKE',this.baseStake));
    this.stake=this.baseStake;
    this.duration=Number(get('digit_duration','DURATION',this.duration));
    this.multiplier=Number(get('digit_recovery','MULTIPLIER',this.multiplier));
    this.maxLosses=Number(get('recovery_stop','LOSSES',this.maxLosses));
  }

  async execute(xmlText) {
    if(!this.trading) throw new Error('Trading connection is not ready');
    this.read(xmlText);
    this.running=true;
    this.emit('start',`Strategy ${this.contractType} on ${this.symbol}`,{symbol:this.symbol,stake:this.stake});

    while(this.running){
      const proposal=await this.trading.proposal({
        symbol:this.symbol,
        contractType:this.contractType,
        amount:this.stake,
        currency:this.currency,
        duration:this.duration,
        durationUnit:'t',
        barrier:['DIGITDIFF','DIGITMATCH','DIGITOVER','DIGITUNDER'].includes(this.contractType)?String(this.barrier):undefined
      });

      const bought=await this.trading.buy(proposal.id,proposal.ask_price);
      this.emit('buy',`Bought ${this.contractType}`,{contract:bought});

      if(bought.contract_id){
        await this.trading.openContract(bought.contract_id);
      }

      const result=await this.waitResult();
      if(result>0){
        this.losses=0;
        this.stake=this.baseStake;
        this.emit('win','Winning contract',{profit:result});
      }else{
        this.losses++;
        this.stake=this.stake*this.multiplier;
        this.emit('loss','Recovery applied',{nextStake:this.stake,losses:this.losses});
        if(this.losses>=this.maxLosses){
          this.stop();
        }
      }
    }
  }

  waitResult(){
    return new Promise(resolve=>{
      const handler=e=>{
        if(e.type==='contract_result'){
          resolve(Number(e.profit||0));
        }
      };
      this.resultHandler=handler;
    });
  }

  stop(){
    this.running=false;
    this.emit('stop','Bot stopped');
  }
}
