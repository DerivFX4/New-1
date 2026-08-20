import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DerivConnection, derivConfig } from './derivApi';
import './styles.css';

function App() {
  const [active, setActive] = useState('Dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [account, setAccount] = useState('Demo');
  const [currency, setCurrency] = useState('USD');
  const [botState, setBotState] = useState('idle');
  const [marketStatus, setMarketStatus] = useState('Market disconnected');
  const [tick, setTick] = useState(null);
  const connection = useRef(null);

  useEffect(() => {
    connection.current = new DerivConnection({
      appId: derivConfig.appId,
      onStatus: setMarketStatus,
      onTick: value => setTick(value),
    });
    if (derivConfig.appId) {
      connection.current.connect();
      const timer = setInterval(() => connection.current?.subscribeTicks('R_100'), 1000);
      return () => {
        clearInterval(timer);
        connection.current?.disconnect();
      };
    }
  }, []);

  const rawBalance = account === 'Demo' ? 10004.8 : 0;
  const displayedBalance = currency === 'USD' ? rawBalance : rawBalance * 129;
  const money = new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayedBalance);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button">☰</button>
        <div className="brand">VintelFX</div>
        <div className="spacer" />
        {loggedIn ? (
          <>
            <button className="top-action" onClick={() => setCurrency(currency === 'USD' ? 'KSH' : 'USD')}>{currency} ▼</button>
            <button className="account-pill" onClick={() => setAccount(account === 'Demo' ? 'Real' : 'Demo')}>
              <span className={account === 'Demo' ? 'demo-symbol' : 'real-symbol'}>{account === 'Demo' ? 'D' : '$'}</span>
              <span>{money} {currency} ▼</span>
            </button>
          </>
        ) : (
          <>
            <button className="top-action" onClick={() => setLoggedIn(true)}>Log in</button>
            <button className="top-action">PAT Login</button>
            <button className="signup">Sign Up</button>
          </>
        )}
      </header>

      <nav className="tabs">
        {['Dashboard', 'Bot Builder', 'Chart', 'Tutorials'].map(tab => (
          <button key={tab} className={active === tab ? 'tab active' : 'tab'} onClick={() => setActive(tab)}>{tab}</button>
        ))}
      </nav>

      <main className="workspace">
        <section className="welcome-card">
          <div className="market-line"><span className="market-dot" /> {marketStatus}</div>
          <h1>{active}</h1>
          <p>Import a bot, build a strategy, or connect to live Deriv markets.</p>
          {tick && <div className="live-tick">R_100 <strong>{Number(tick.quote).toFixed(tick.pip_size || 2)}</strong></div>}
          {!derivConfig.appId && <div className="setup-note">Set <code>PUBLIC_DERIV_APP_ID</code> in Vercel to enable the live market connection.</div>}
          <div className="action-grid">
            <button>Local</button><button>Google Drive</button><button>Bot Builder</button><button>Quick Strategy</button>
          </div>
        </section>
      </main>

      {drawerOpen && <section className="run-drawer">
        <div className="drawer-tabs"><button className="active">Summary</button><button>Transactions</button><button>Journal</button></div>
        <div className="empty-state">Live transactions will appear here when an authorized bot is running.</div>
      </section>}

      <button className="drawer-handle" onClick={() => setDrawerOpen(!drawerOpen)}>{drawerOpen ? '⌄' : '⌃'}</button>
      <footer className="runbar">
        <button className="run-button" disabled={!loggedIn} onClick={() => setBotState(botState === 'running' ? 'paused' : 'running')}>
          {botState === 'running' ? '⏸ Pause' : botState === 'paused' ? '⏯ Resume' : '▶ Run'}
        </button>
        <div className="run-status">{!loggedIn ? 'Log in to run a bot' : botState === 'idle' ? 'Bot is not running' : botState === 'paused' ? 'Bot is paused' : 'Bot is running'}</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
