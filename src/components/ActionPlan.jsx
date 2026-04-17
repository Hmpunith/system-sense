import React, { useState } from 'react';

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      className={`action-plan__copy-btn ${copied ? 'action-plan__copy-btn--copied' : ''}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy ${label || 'command'}`}
      type="button"
    >
      {copied ? '✓' : '⧉'}
    </button>
  );
}

export default function ActionPlan({ result }) {
  if (!result) return null;

  const { errorCode, errorName, severity, diagnosis, commands, explanation } = result;

  const allCommands = (commands || []).map((c) => c.command).join('\n\n');

  return (
    <div className="action-plan" id="action-plan-section">
      {/* ── Error Summary ── */}
      <div className="action-plan__error-card">
        <div className="action-plan__error-header">
          <span className="action-plan__section-label">
            🔍 Error Identified
          </span>
          {severity && (
            <span className={`action-plan__severity action-plan__severity--${severity}`}>
              {severity === 'critical' && '🔴'}
              {severity === 'warning' && '🟡'}
              {severity === 'info' && '🔵'}
              {severity.toUpperCase()}
            </span>
          )}
        </div>

        <div className="action-plan__error-code">
          <span className="action-plan__error-code-dot" />
          {errorCode || 'Unknown'}
          {errorName && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
              — {errorName}
            </span>
          )}
        </div>

        {diagnosis && (
          <p className="action-plan__diagnosis">{diagnosis}</p>
        )}
      </div>

      {/* ── PowerShell Commands ── */}
      {commands && commands.length > 0 && (
        <div className="action-plan__commands-card">
          <div className="action-plan__commands-header">
            <span className="action-plan__section-label">
              ⚙️ Action Plan — PowerShell Commands
            </span>
            <button
              className="action-plan__copy-all-btn"
              onClick={() => navigator.clipboard.writeText(allCommands)}
              type="button"
              id="copy-all-commands-btn"
            >
              ⧉ Copy All
            </button>
          </div>

          {commands.map((cmd, i) => (
            <div className="action-plan__command-block" key={i}>
              <div className="action-plan__command-bar">
                <span className="action-plan__command-label">
                  <span>PS&gt;</span> Step {i + 1}: {cmd.label}
                </span>
                <CopyButton text={cmd.command} label={cmd.label} />
              </div>
              <pre className="action-plan__command-code">{cmd.command}</pre>
            </div>
          ))}
        </div>
      )}

      {/* ── Detailed Explanation ── */}
      {explanation && (
        <div className="action-plan__explanation-card">
          <div className="action-plan__section-label" style={{ marginBottom: '0.75rem' }}>
            📋 Detailed Explanation
          </div>
          <p
            className="action-plan__explanation-text"
            dangerouslySetInnerHTML={{
              __html: explanation
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br />')
            }}
          />
        </div>
      )}
    </div>
  );
}
