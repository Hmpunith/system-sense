import React from 'react';

export default function Header() {
  return (
    <header className="header" style={{ justifyContent: 'space-between' }}>
      <div className="header__brand" style={{ gap: '1rem' }}>
        <div className="header__logo">S</div>
        <div>
          <h1 className="header__title">System-Sense</h1>
          <div className="header__subtitle">Windows Diagnostic Intelligence</div>
        </div>
      </div>
      <div className="header__status" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontSize: '0.7rem', fontWeight: 600 }}>
        <span style={{ width: '8px', height: '8px', background: 'var(--accent-emerald)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px var(--accent-emerald)' }}></span>
        GEMINI SERVICE LIVE
      </div>
    </header>
  );
}
