import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DerivConnection, derivConfig } from './derivApi';
import { startDerivOAuth } from './derivAuth';
import { getAccounts } from './derivAccounts';
import { saveSession, clearSession, loginWithPAT } from './derivSession';
import './styles.css';

function App() {
  const [active, setActive] = useState('Dashboard');
  const [session, setSession] = useState(localStorage.getItem('deriv_access_token'));
  const [accounts, setAccounts] = useState([]);
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [marketStatus, setMarketStatus] = useState('Market disconnected');
  const [tick, setTick] = useState(null);
  const [botState, setBotState] = useState('idle');
  const connection = useRef(null);

  useEffect(() => {
    connection.current = new DerivConnection({ appId: derivConfig.appId, onStatus: setMarketStatus, onTick: setTick });
    if (derivConfig.appId) connection.current.connect();

    if (session) getAccounts(session).then(data => setAccounts(data.accounts || [])).catch(() => setAccounts([]));
    return () => connection.current?.disconnect();
  }, [session]);

  const loginPAT = async () => {
    await loginWithPAT(pat);
    setSession(pat);
    setPat('');
  };

  const logout = () => {
    clearSession();
    setSession(null);
    setAccounts([]);
  };

  const account = accounts[0];

  return <div className="app-shell">
    <header className="topbar">
      <button className="icon-button">☰</button>
      <div className="brand">VintelFX</div>
      <div className="spacer" />
      {!session ? <>
        <button className="signup" onClick={startDerivOAuth}>Login with Deriv</button>
        <button className="top-action" onClick={() => setShowPat(!showPat)}>PAT</button>
      </> : <>
        <div className="account-pill">{account?.currency || 'USD'} {account?.balance ?? '--'} ▼</div>
        <button className="top-action" onClick={logout}>Logout</button>
      </>}
    </header>

    {showPat && !session && <div className="pat-panel"><input value={pat} onChange={e => setPat(e.target.value)} placeholder="Deriv PAT"/><button onClick={loginPAT}>Connect</button></div>}

    <nav className="tabs">{['Dashboard','Bot Builder','Chart','Tutorials'].map(tab=><button key={tab} className={active===tab?'tab active':'tab'} onClick={()=>setActive(tab)}>{tab}</button>)}</nav>

    <main className="workspace"><section className="welcome-card"><div>{marketStatus}</div><h1>{active}</h1>{tick && <div>R_100: {tick.quote}</div>}<p>Live Deriv account session connected.</p></section></main>

    <footer className="runbar"><button className="run-button" onClick={()=>setBotState(botState==='running'?'paused':'running')}>{botState==='running'?'⏸ Pause':botState==='paused'?'⏯ Resume':'▶ Run'}</button><div className="run-status">{botState}</div></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
