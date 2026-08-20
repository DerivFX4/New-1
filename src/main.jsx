import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DerivConnection, derivConfig } from './derivApi';
import { DerivTrading } from './derivTrading';
import { startDerivOAuth } from './derivAuth';
import { handleOAuthCallback } from './derivOAuthCallback';
import { getAccounts } from './derivAccounts';
import { getSession, clearSession, loginWithPAT } from './derivSession';
import './styles.css';

const VOLATILITY_MARKETS = [
  { label: 'Volatility 10', symbol: 'R_10' },
  { label: 'Volatility 10 1s', symbol: '1HZ10V' },
  { label: 'Volatility 15 1s', symbol: '1HZ15V' },
  { label: 'Volatility 25', symbol: 'R_25' },
  { label: 'Volatility 25 1s', symbol: '1HZ25V' },
  { label: 'Volatility 30 1s', symbol: '1HZ30V' },
  { label: 'Volatility 50', symbol: 'R_50' },
  { label: 'Volatility 50 1s', symbol: '1HZ50V' },
  { label: 'Volatility 75', symbol: 'R_75' },
  { label: 'Volatility 75 1s', symbol: '1HZ75V' },
  { label: 'Volatility 100', symbol: 'R_100' },
  { label: 'Volatility 100 1s', symbol: '1HZ100V' },
];

function App() {
  const [active, setActive] = useState('Dashboard'); const [session, setSession] = useState(getSession());
  const [accounts, setAccounts] = useState([]); const [selectedId, setSelectedId] = useState('');
  const [balance, setBalance] = useState(null); const [pat, setPat] = useState(''); const [showPat, setShowPat] = useState(false);
  const [status, setStatus] = useState('Market disconnected'); const [error, setError] = useState(''); const [tick, setTick] = useState(null);
  const [botState, setBotState] = useState('idle'); const [tradeBusy, setTradeBusy] = useState(false); const [tradeMessage, setTradeMessage] = useState('');
  const [contract, setContract] = useState(null); const [contractState, setContractState] = useState(null); const [contractProfit, setContractProfit] = useState(null);
  const [volatility, setVolatility] = useState(VOLATILITY_MARKETS[0]);
  const connection = useRef(null); const trading = useRef(null);

  useEffect(() => { handleOAuthCallback().then(ok => ok && setSession(getSession())).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    let cancelled = false; setError(''); setAccounts([]); setSelectedId(''); setBalance(null); setContract(null); setContractState(null); setContractProfit(null);
    if (!session.token) return undefined;
    getAccounts(session.token).then(list => { if (!cancelled) { setAccounts(list); setSelectedId(list[0]?.account_id || list[0]?.id || ''); } }).catch(e => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [session.token]);

  const selectedAccount = accounts.find(a => (a.account_id || a.id) === selectedId) || null;
  useEffect(() => {
    connection.current?.disconnect(); setBalance(null); setContract(null); setContractState(null); setContractProfit(null); trading.current = null;
    if (!session.token || !selectedAccount) { setStatus(session.token ? 'Choose a Deriv account' : 'Market disconnected'); return undefined; }
    const c = new DerivConnection({ appId: derivConfig.appId, accessToken: session.token, accountId: selectedAccount.account_id || selectedAccount.id, onStatus: setStatus, onTick: setTick, onBalance: setBalance, onMessage: data => { trading.current?.handleMessage(data); if (data.proposal_open_contract) { const p = data.proposal_open_contract; setContractState(p.status || (p.is_sold ? 'sold' : 'open')); setContractProfit(p.profit ?? p.bid_price ?? null); if (p.is_sold || p.status === 'won' || p.status === 'lost' || p.status === 'sold') setBotState('idle'); } } });
    connection.current = c; trading.current = new DerivTrading(c); c.connect().catch(e => setStatus(e.message)); return () => c.disconnect();
  }, [session.token, selectedId]);

  useEffect(() => {
    setTick(null); setContract(null); setContractState(null); setContractProfit(null); setTradeMessage('');
    if (connection.current?.authenticated) connection.current.subscribeTicks(volatility.symbol);
  }, [volatility]);

  const loginPAT = async () => { try { setError(''); const token = await loginWithPAT(pat); setSession({ token, type: 'pat', expiresAt: null }); setPat(''); setShowPat(false); } catch(e) { setError(e.message); } };
  const loginOAuth = async () => { try { setError(''); await startDerivOAuth(); } catch(e) { setError(e.message); } };
  const logout = () => { connection.current?.disconnect(); clearSession(); setSession({token:null,type:null,expiresAt:null}); setAccounts([]); setSelectedId(''); setBalance(null); setContract(null); };

  const requestTrade = async () => {
    if (!selectedAccount || !trading.current) return setError('Connect a Deriv account first');
    setTradeBusy(true); setError(''); setTradeMessage(`Requesting ${volatility.label} proposal…`); setContractState(null); setContractProfit(null);
    try {
      const currency = balance?.currency || selectedAccount.currency || 'USD';
      const p = await trading.current.proposal({ symbol:volatility.symbol, contractType:'CALL', amount:1, currency, duration:5, durationUnit:'t' });
      setTradeMessage(`Proposal received · ${p.ask_price} ${currency}`);
      const b = await trading.current.buy(p.id, p.ask_price); setContract(b); setBotState('running');
      setTradeMessage(`Contract purchased · ${volatility.label} · ID ${b.contract_id || b.transaction_id}`); if (b.contract_id) await trading.current.openContract(b.contract_id);
    } catch(e) { setError(e.message); setTradeMessage('Trade not executed'); } finally { setTradeBusy(false); }
  };
  const sellContract = async () => { if (!contract?.contract_id || !trading.current) return; setTradeBusy(true); try { const s = await trading.current.sell(contract.contract_id, 0); setTradeMessage(`Contract sold · ${s?.sold_for ?? s?.sold_for_price ?? ''}`); setContractState('sold'); setBotState('idle'); } catch(e) { setError(e.message); } finally { setTradeBusy(false); } };

  const currency = balance?.currency || selectedAccount?.currency || 'USD'; const amount = balance?.balance ?? selectedAccount?.balance ?? '--';
  const type = String(selectedAccount?.account_type || (selectedAccount?.is_demo ? 'demo' : 'real')).toLowerCase(); const isDemo = type === 'demo';
  return <div className="app-shell">
    <header className="topbar"><button className="icon-button">☰</button><div className="brand">VintelFX</div><div className="spacer" />{!session.token ? <><button className="signup" onClick={loginOAuth}>Login with Deriv</button><button className="top-action" onClick={()=>setShowPat(!showPat)}>PAT</button></> : <><div className="account-pill">{currency} {amount} · {isDemo?'Demo':'Real'} ▼</div><button className="top-action" onClick={logout}>Logout</button></>}</header>
    {showPat && !session.token && <div className="pat-panel"><input type="password" value={pat} onChange={e=>setPat(e.target.value)} placeholder="Deriv PAT" autoComplete="off"/><button onClick={loginPAT}>Connect</button></div>}
    {session.token && <div className="account-bar"><label htmlFor="deriv-account">Account</label><select id="deriv-account" value={selectedId} onChange={e=>setSelectedId(e.target.value)} disabled={!accounts.length}>{!accounts.length&&<option value="">Loading Deriv accounts…</option>}{accounts.map(a=>{const id=a.account_id||a.id; const t=String(a.account_type||(a.is_demo?'demo':'real')).toLowerCase(); return <option key={id} value={id}>{t==='demo'?'Demo':'Real'} · {a.currency||'USD'} · {id}</option>;})}</select><span className="account-status">{status}</span></div>}
    {error&&<div className="error-banner">{error}</div>}{tradeMessage&&<div className="trade-banner">{tradeMessage}</div>}
    <nav className="tabs">{['Dashboard','Bot Builder','Chart','Tutorials'].map(t=><button key={t} className={active===t?'tab active':'tab'} onClick={()=>setActive(t)}>{t}</button>)}</nav>
    <main className="workspace"><section className="welcome-card"><div>{status}</div><h1>{active}</h1>{session.token&&selectedAccount&&<div className="live-account"><strong>{isDemo?'Demo account':'Real account'}</strong><span>{currency} {Number(amount)||amount}</span></div>}{tick&&<div>{volatility.label}: {tick.quote}</div>}{contract&&<div>Contract: {contract.contract_id||contract.transaction_id}</div>}{contractState&&<div>Contract status: <strong>{contractState}</strong>{contractProfit!==null&&<> · {contractProfit}</>}</div>}<p>{session.token?'Authenticated Deriv account session connected.':'Connect your Deriv account to load live balances and trading access.'}</p></section>
      {active==='Bot Builder'&&<section className="welcome-card"><h2>Volatilities</h2><label htmlFor="volatility-market">Market</label><select id="volatility-market" value={volatility.symbol} onChange={e=>setVolatility(VOLATILITY_MARKETS.find(v=>v.symbol===e.target.value)||VOLATILITY_MARKETS[0])}>{VOLATILITY_MARKETS.map(v=><option key={v.symbol} value={v.symbol}>{v.label}</option>)}</select><p>{volatility.label} · {volatility.symbol}</p><h2>Live Deriv Trade</h2><p>{volatility.label} · CALL · 1 {currency} · 5 ticks</p><button className="run-button" disabled={tradeBusy||!session.token||!selectedAccount} onClick={requestTrade}>{tradeBusy?'Working…':'Request Proposal & Buy'}</button>{contract?.contract_id&&contractState==='open'&&<button className="top-action" disabled={tradeBusy} onClick={sellContract}>Sell Contract</button>}<small>This sends an order to the selected Demo or Real account. Test on Demo before using Real.</small></section>}</main>
    <footer className="runbar"><button className="run-button" disabled={!session.token||tradeBusy} onClick={()=>setBotState(botState==='running'?'paused':'running')}>{botState==='running'?'⏸ Pause':'▶ Run'}</button><div className="run-status">{botState}</div></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
