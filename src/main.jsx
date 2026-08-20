import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DerivConnection, derivConfig } from './derivApi';
import { startDerivOAuth } from './derivAuth';
import { handleOAuthCallback } from './derivOAuthCallback';
import { getAccounts } from './derivAccounts';
import { getSession, saveSession, clearSession, loginWithPAT } from './derivSession';
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
  const connection = useRef(null);

  useEffect(() => {
    handleOAuthCallback()
      .then(connected => {
        if (connected) setSession(getSession());
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setAccounts([]);
    setSelectedId('');
    setBalance(null);

    if (!session.token) return undefined;

    getAccounts(session.token)
      .then(list => {
        if (cancelled) return;
        setAccounts(list);
        const first = list[0];
        setSelectedId(first?.account_id || first?.id || '');
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, [session.token]);

  const selectedAccount = accounts.find(account => (account.account_id || account.id) === selectedId) || null;

  useEffect(() => {
    connection.current?.disconnect();
    setBalance(null);

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
    });
    connection.current = connectionInstance;
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
    } catch (err) {
      setError(err.message);
    }
  };

  const loginOAuth = async () => {
    try {
      setError('');
      await startDerivOAuth();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    connection.current?.disconnect();
    clearSession();
    setSession({ token: null, type: null, expiresAt: null });
    setAccounts([]);
    setSelectedId('');
    setBalance(null);
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

    {showPat && !session.token && <div className="pat-panel">
      <input type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="Deriv PAT" autoComplete="off" />
      <button onClick={loginPAT}>Connect</button>
    </div>}

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

    <nav className="tabs">{['Dashboard','Bot Builder','Chart','Tutorials'].map(tab => <button key={tab} className={active === tab ? 'tab active' : 'tab'} onClick={() => setActive(tab)}>{tab}</button>)}</nav>

    <main className="workspace">
      <section className="welcome-card">
        <div>{status}</div>
        <h1>{active}</h1>
        {session.token && selectedAccount && <div className="live-account">
          <strong>{isDemo ? 'Demo account' : 'Real account'}</strong>
          <span>{accountCurrency} {Number(accountBalance) || accountBalance}</span>
        </div>}
        {tick && <div>R_100: {tick.quote}</div>}
        <p>{session.token ? 'Authenticated Deriv account session connected.' : 'Connect your Deriv account to load live balances and trading access.'}</p>
      </section>
    </main>

    <footer className="runbar"><button className="run-button" onClick={() => setBotState(botState === 'running' ? 'paused' : botState === 'paused' ? 'running' : 'running')}>{botState === 'running' ? '⏸ Pause' : botState === 'paused' ? '▶ Resume' : '▶ Run'}</button><div className="run-status">{botState}</div></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
