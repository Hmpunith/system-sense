import React from 'react';

export default function Header() {
  return (
    <header className="header" style={{ justifyContent: 'center' }}>
      <div className="header__brand" style={{ gap: '1rem' }}>
        <div className="header__logo">S</div>
        <div>
          <div className="header__title">System-Sense</div>
          <div className="header__subtitle">Windows Diagnostic Intelligence</div>
        </div>
      </div>
    </header>
  );
}
