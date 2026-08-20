import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [active, setActive] = useState('Dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button" aria-label="Menu">☰</button>
        <div className="brand">VintelFX</div>
        <div className="spacer" />
        <button className="top-action">Log in</button>
        <button className="top-action">PAT Login</button>
        <button className="signup">Sign Up</button>
      </header>

      <nav className="tabs" aria-label="Main navigation">
        {['Dashboard', 'Bot Builder', 'Chart', 'Tutorials'].map((tab) => (
          <button
            key={tab}
            className={active === tab ? 'tab active' : 'tab'}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="workspace">
        <section className="welcome-card">
          <h1>{active}</h1>
          <p>Import a bot from your computer, continue from storage, or start building a strategy.</p>
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
          <div className="empty-state">No transactions yet. Run a bot to see live activity here.</div>
        </section>
      )}

      <button
        className="drawer-handle"
        aria-label={drawerOpen ? 'Collapse activity panel' : 'Expand activity panel'}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        {drawerOpen ? '⌄' : '⌃'}
      </button>

      <footer className="runbar">
        <button className="run-button">▶ <span>Run</span></button>
        <div className="run-status">Bot is not running</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
