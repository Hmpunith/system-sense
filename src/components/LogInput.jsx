import React, { useState, useRef } from 'react';

const PLACEHOLDER = `Paste your Windows system log here…

Example (SFC):
  Windows Resource Protection found corrupt files and successfully repaired them.
  For online repairs, details are included in the CBS log…

Example (DISM):
  Error: 0x800f081f
  The source files could not be found.
  Use the "Source" option to specify the location…

Example (BSOD):
  Bug Check 0x00000050 (PAGE_FAULT_IN_NONPAGED_AREA)
  The system encountered a fatal error…

You can also drag & drop a .txt or .log file here.`;

export default function LogInput({ logText, onLogTextChange }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.log'))) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onLogTextChange(ev.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    onLogTextChange('');
    textareaRef.current?.focus();
  };

  return (
    <section className="log-input" id="log-input-section">
      <div className="log-input__header">
        <h2 className="log-input__title">
          <span className="log-input__title-icon">⬢</span>
          Log Input
        </h2>
        <div className="log-input__meta">
          <span 
            className="log-input__char-count"
            role="status"
            aria-live="polite"
            aria-label={`${logText.length} characters entered`}
          >
            {logText.length.toLocaleString()} chars
          </span>
          {logText.length > 0 && (
            <button
              className="log-input__clear-btn"
              onClick={handleClear}
              type="button"
              id="clear-log-btn"
              aria-label="Clear log text"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        id="log-textarea"
        className={`log-input__textarea ${isDragOver ? 'log-input__textarea--dragover' : ''}`}
        placeholder={PLACEHOLDER}
        value={logText}
        onChange={(e) => onLogTextChange(e.target.value)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        spellCheck="false"
        autoComplete="off"
        aria-label="Windows system log content"
        aria-describedby="log-input-hints"
      />

      <div className="log-input__hints" id="log-input-hints">
        <span className="log-input__hint">DISM</span>
        <span className="log-input__hint">SFC /scannow</span>
        <span className="log-input__hint">BSOD Dump</span>
        <span className="log-input__hint">CBS.log</span>
        <span className="log-input__hint">Event Viewer</span>
      </div>
    </section>
  );
}
