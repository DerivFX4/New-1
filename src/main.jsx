import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [active, setActive] = useState('Dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [account, setAccount] = useState('Demo');
  const [currency, setCurrency] = useState('USD');
  const [botState, setBotState] = useState('idle');

  const balance = account === 'Demo' ? '10,004.80' : '0.00';

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button">☰</button>
        <div className="brand">VintelFX</div>
        <div className="spacer" />

        {loggedIn ? (
          <>
            <button className="top-action" onClick={() => setCurrency(currency === 'USD' ? 'KSH' : 'USD')}>
              {currency} ▼
            </button>
            <button className="top-action" onClick={() => setAccount(account === 'Demo' ? 'Real' : 'Demo')}>
              {account === 'Demo' ? 'Ⓓ' : '◉'} {balance} {currency} ▼
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
        {['Dashboard', 'Bot Builder', 'Chart', 'Tutorials'].map((tab) => (
          <button key={tab} className={active === tab ? 'tab active' : 'tab'} onClick={() => setActive(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <main className="workspace">
        <section className="welcome-card">
          <h1>{active}</h1>
          <p>Import a bot, build a strategy, or connect to live Deriv markets.</p>
          <div className="action-grid">
            <button>Local</button>
            <button>Google Drive</button>
            <button>Bot Builder</button>
            <button>Quick Strategy</button>
          </div>
        </section>
      </main>

      {drawerOpen && (
        <section className="run-drawer">
          <div className="drawer-tabs">
            <button className="active">Summary</button>
            <button>Transactions</button>
            <button>Journal</button>
          </div>
          <div className="empty-state">Live transactions will appear here.</div>
        </section>
      )}

      <button className="drawer-handle" onClick={() => setDrawerOpen(!drawerOpen)}>
        {drawerOpen ? '⌄' : '⌃'}
      </button>

      <footer className="runbar">
        <button className="run-button" onClick={() => setBotState(botState === 'running' ? 'paused' : 'running')}>
          {botState === 'running' ? '⏸ Pause' : botState === 'paused' ? '⏯ Resume' : '▶ Run'}
        </button>
        <div className="run-status">
          {botState === 'idle' ? 'Bot is not running' : botState === 'paused' ? 'Bot is paused' : 'Bot is running'}
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
