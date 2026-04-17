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
      aria-label={copied ? 'Command copied to clipboard' : `Copy ${label || 'command'}`}
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
    <section className="action-plan" id="action-plan-section" aria-labelledby="action-plan-title">
      <h2 id="action-plan-title" className="sr-only">Diagnostic Action Plan</h2>
      
      {/* ── Error Summary ── */}
      <article className="action-plan__error-card" aria-labelledby="error-summary-title">
        <div className="action-plan__error-header">
          <span className="action-plan__section-label" id="error-summary-title">
            🔍 Error Identified
          </span>
          {severity && (
            <span 
              className={`action-plan__severity action-plan__severity--${severity}`}
              role="status"
              aria-live="polite"
            >
              {severity === 'critical' && '🔴 '}
              {severity === 'warning' && '🟡 '}
              {severity === 'info' && '🔵 '}
              {severity.toUpperCase()}
            </span>
          )}
        </div>

        <h3 className="action-plan__error-code">
          <span className="action-plan__error-code-dot" aria-hidden="true" />
          {errorCode || 'Unknown'}
          {errorName && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
               — {errorName}
            </span>
          )}
        </h3>

        {diagnosis && (
          <p className="action-plan__diagnosis" aria-label="Diagnosis">{diagnosis}</p>
        )}
      </article>

      {/* ── PowerShell Commands ── */}
      {commands && commands.length > 0 && (
        <article className="action-plan__commands-card" aria-labelledby="commands-title">
          <div className="action-plan__commands-header">
            <h3 className="action-plan__section-label" id="commands-title">
              ⚙️ Action Plan — PowerShell Commands
            </h3>
            <button
              className="action-plan__copy-all-btn"
              onClick={() => navigator.clipboard.writeText(allCommands)}
              type="button"
              id="copy-all-commands-btn"
              aria-label="Copy all PowerShell commands to clipboard"
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
              <pre className="action-plan__command-code" tabIndex="0">{cmd.command}</pre>
            </div>
          ))}
        </article>
      )}

      {/* ── Detailed Explanation ── */}
      {explanation && (
        <article className="action-plan__explanation-card" aria-labelledby="explanation-title">
          <h3 className="action-plan__section-label" id="explanation-title" style={{ marginBottom: '0.75rem' }}>
            📋 Detailed Explanation
          </h3>
          <p
            className="action-plan__explanation-text"
            dangerouslySetInnerHTML={{
              __html: explanation
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br />')
            }}
          />
        </article>
      )}
    </section>
  );
}
