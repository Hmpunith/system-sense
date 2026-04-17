import React from 'react';

export default function AnalyzeButton({ onClick, disabled, loading }) {
  return (
    <div className="analyze-section">
      <button
        id="analyze-btn"
        className="analyze-btn"
        onClick={onClick}
        disabled={disabled || loading}
        type="button"
      >
        {loading ? (
          <>
            <div className="analyze-btn__spinner" />
            Analyzing…
          </>
        ) : (
          <>
            <span className="analyze-btn__icon">⚡</span>
            Gemini Analyze
          </>
        )}
      </button>
    </div>
  );
}
