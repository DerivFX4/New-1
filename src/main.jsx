import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DerivConnection, derivConfig } from './derivApi';
import { startDerivOAuth } from './derivAuth';
import { getAccounts } from './derivAccounts';
import './styles.css';

function App() {
  const [active, setActive] = useState('Dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [marketStatus, setMarketStatus] = useState('Market disconnected');
  const [tick, setTick] = useState(null);
  const [botState, setBotState] = useState('idle');
  const connection = useRef(null);

  useEffect(() => {
    connection.current = new DerivConnection({
      appId: derivConfig.appId,
      onStatus: setMarketStatus,
      onTick: setTick,
    });
    if (derivConfig.appId) connection.current.connect();

    const token = localStorage.getItem('deriv_access_token');
    if (token) {
      setSession(token);
      getAccounts(token).then(data => setAccounts(data.accounts || [])).catch(() => setAccounts([]));
    }

    return () => connection.current?.disconnect();
  }, []);

  const activeAccount = accounts[0];

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button">☰</button>
        <div className="brand">VintelFX</div>
        <div className="spacer" />
        {!session ? (
          <button className="signup" onClick={startDerivOAuth}>Login with Deriv</button>
        ) : (
          <div className="account-pill">{activeAccount?.currency || 'USD'} {activeAccount?.balance ?? '--'} ▼</div>
        )}
      </header>

      <nav className="tabs">{['Dashboard','Bot Builder','Chart','Tutorials'].map(tab => <button key={tab} className={active===tab?'tab active':'tab'} onClick={()=>setActive(tab)}>{tab}</button>)}</nav>

      <main className="workspace">
        <section className="welcome-card">
          <div>{marketStatus}</div>
          <h1>{active}</h1>
          {tick && <div>R_100: {tick.quote}</div>}
          <p>Connected account data replaces temporary balances.</p>
        </section>
      </main>

      {drawerOpen && <section className="run-drawer">Summary • Transactions • Journal</section>}
      <button className="drawer-handle" onClick={()=>setDrawerOpen(!drawerOpen)}>⌃</button>
      <footer className="runbar">
        <button className="run-button" onClick={()=>setBotState(botState==='running'?'paused':'running')}>
          {botState==='running'?'⏸ Pause':botState==='paused'?'⏯ Resume':'▶ Run'}
        </button>
        <div className="run-status">{botState}</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
