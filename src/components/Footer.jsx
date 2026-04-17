import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span>© 2026 System-Sense</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>Built for Google PromptWars</span>
      </div>
      <div className="footer__powered">
        Powered by <span className="footer__gemini-badge">Google Gemini</span>
      </div>
    </footer>
  );
}
