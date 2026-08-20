import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DerivConnection, derivConfig } from './derivApi';
import { DerivTrading } from './derivTrading';
import { startDerivOAuth } from './derivAuth';
import { handleOAuthCallback } from './derivOAuthCallback';
import { getAccounts } from './derivAccounts';
import { getSession, clearSession, loginWithPAT } from './derivSession';
import './styles.css';

function App() {
  const [active, setActive] = useState('Dashboard');
  const [session, setSession] = useState(getSession());
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [balance, setBalance] = useState(null);
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [status, setStatus] = useState('Market disconnected');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(null);
  const [botState, setBotState] = useState('idle');
  const [tradeBusy, setTradeBusy] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [contract, setContract] = useState(null);
  const connection = useRef(null);
  const trading = useRef(null);

  useEffect(() => {
    handleOAuthCallback().then(connected => {
      if (connected) setSession(getSession());
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setAccounts([]);
    setSelectedId('');
    setBalance(null);
    setContract(null);
    if (!session.token) return undefined;

    getAccounts(session.token).then(list => {
      if (cancelled) return;
      setAccounts(list);
      setSelectedId(list[0]?.account_id || list[0]?.id || '');
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [session.token]);

  const selectedAccount = accounts.find(account => (account.account_id || account.id) === selectedId) || null;

  useEffect(() => {
    connection.current?.disconnect();
    setBalance(null);
    setContract(null);
    trading.current = null;

    if (!session.token || !selectedAccount) {
      setStatus(session.token ? 'Choose a Deriv account' : 'Market disconnected');
      return undefined;
    }

    const connectionInstance = new DerivConnection({
      appId: derivConfig.appId,
      accessToken: session.token,
      accountId: selectedAccount.account_id || selectedAccount.id,
      onStatus: setStatus,
      onTick: setTick,
      onBalance: setBalance,
      onMessage: data => trading.current?.handleMessage(data),
    });
    const tradingInstance = new DerivTrading(connectionInstance);
    connection.current = connectionInstance;
    trading.current = tradingInstance;
    connectionInstance.connect().catch(err => setStatus(err.message));
    return () => connectionInstance.disconnect();
  }, [session.token, selectedId]);

  const loginPAT = async () => {
    try {
      setError('');
      const token = await loginWithPAT(pat);
      setSession({ token, type: 'pat', expiresAt: null });
      setPat('');
      setShowPat(false);
    } catch (err) { setError(err.message); }
  };

  const loginOAuth = async () => {
    try { setError(''); await startDerivOAuth(); }
    catch (err) { setError(err.message); }
  };

  const logout = () => {
    connection.current?.disconnect();
    clearSession();
    setSession({ token: null, type: null, expiresAt: null });
    setAccounts([]);
    setSelectedId('');
    setBalance(null);
    setContract(null);
  };

  const requestTrade = async () => {
    if (!selectedAccount || !trading.current) return setError('Connect a Deriv account first');
    setTradeBusy(true);
    setError('');
    setTradeMessage('Requesting live proposal…');
    try {
      const currency = balance?.currency || selectedAccount.currency || 'USD';
      const proposal = await trading.current.proposal({
        symbol: 'R_100',
        contractType: 'CALL',
        amount: 1,
        currency,
        duration: 5,
        durationUnit: 't',
      });
      setTradeMessage(`Proposal received: ${proposal.id} · Ask ${proposal.ask_price}`);
      const bought = await trading.current.buy(proposal.id, proposal.ask_price);
      setContract(bought);
      setBotState('running');
      setTradeMessage(`Contract purchased: ${bought.contract_id || bought.transaction_id || bought.buy_price}`);
      if (bought.contract_id) await trading.current.openContract(bought.contract_id);
    } catch (err) {
      setError(err.message);
      setTradeMessage('Trade not executed');
    } finally { setTradeBusy(false); }
  };

  const accountCurrency = balance?.currency || selectedAccount?.currency || 'USD';
  const accountBalance = balance?.balance ?? selectedAccount?.balance ?? '--';
  const accountType = selectedAccount?.account_type || (selectedAccount?.is_demo ? 'demo' : 'real');
  const isDemo = String(accountType).toLowerCase() === 'demo';

  return <div className="app-shell">
    <header className="topbar">
      <button className="icon-button">☰</button>
      <div className="brand">VintelFX</div>
      <div className="spacer" />
      {!session.token ? <>
        <button className="signup" onClick={loginOAuth}>Login with Deriv</button>
        <button className="top-action" onClick={() => setShowPat(!showPat)}>PAT</button>
      </> : <>
        <div className="account-pill">{accountCurrency} {accountBalance} · {isDemo ? 'Demo' : 'Real'} ▼</div>
        <button className="top-action" onClick={logout}>Logout</button>
      </>}
    </header>

    {showPat && !session.token && <div className="pat-panel"><input type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="Deriv PAT" autoComplete="off"/><button onClick={loginPAT}>Connect</button></div>}

    {session.token && <div className="account-bar">
      <label htmlFor="deriv-account">Account</label>
      <select id="deriv-account" value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={!accounts.length}>
        {!accounts.length && <option value="">Loading Deriv accounts…</option>}
        {accounts.map(account => {
          const id = account.account_id || account.id;
          const type = String(account.account_type || (account.is_demo ? 'demo' : 'real')).toLowerCase();
          return <option key={id} value={id}>{type === 'demo' ? 'Demo' : 'Real'} · {account.currency || 'USD'} · {id}</option>;
        })}
      </select>
      <span className="account-status">{status}</span>
    </div>}

    {error && <div className="error-banner">{error}</div>}
    {tradeMessage && <div className="trade-banner">{tradeMessage}</div>}

    <nav className="tabs">{['Dashboard','Bot Builder','Chart','Tutorials'].map(tab => <button key={tab} className={active === tab ? 'tab active' : 'tab'} onClick={() => setActive(tab)}>{tab}</button>)}</nav>

    <main className="workspace">
      <section className="welcome-card">
        <div>{status}</div>
        <h1>{active}</h1>
        {session.token && selectedAccount && <div className="live-account"><strong>{isDemo ? 'Demo account' : 'Real account'}</strong><span>{accountCurrency} {Number(accountBalance) || accountBalance}</span></div>}
        {tick && <div>R_100: {tick.quote}</div>}
        {contract && <div>Contract: {contract.contract_id || contract.transaction_id || 'active'}</div>}
        <p>{session.token ? 'Authenticated Deriv account session connected.' : 'Connect your Deriv account to load live balances and trading access.'}</p>
      </section>

      {active === 'Bot Builder' && <section className="welcome-card">
        <h2>Live Deriv Trade</h2>
        <p>R_100 · CALL · 1 {accountCurrency} · 5 ticks</p>
        <button className="run-button" disabled={tradeBusy || !session.token || !selectedAccount} onClick={requestTrade}>{tradeBusy ? 'Working…' : 'Request Proposal & Buy'}</button>
        <small>This sends a real order to the selected Demo or Real account. Use Demo first to test.</small>
      </section>}
    </main>

    <footer className="runbar"><button className="run-button" disabled={!session.token || tradeBusy} onClick={() => setBotState(botState === 'running' ? 'paused' : 'running')}>{botState === 'running' ? '⏸ Pause' : '▶ Run'}</button><div className="run-status">{botState}</div></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
