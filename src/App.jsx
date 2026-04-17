import React, { useState } from 'react';
import Header from './components/Header';
import LogInput from './components/LogInput';
import AnalyzeButton from './components/AnalyzeButton';
import ActionPlan from './components/ActionPlan';
import Footer from './components/Footer';
import { analyzeLog } from './gemini';

export default function App() {
  const [logText, setLogText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canAnalyze = logText.trim().length > 0;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeLog(logText.trim());
      setResult(analysis);
    } catch (err) {
      console.error('Analysis failed:', err);
      let message = 'Analysis failed. ';
      if (err.message) {
        message += err.message;
      } else {
        message += 'An unexpected error occurred.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="main">
        <LogInput logText={logText} onLogTextChange={setLogText} />

        <AnalyzeButton
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          loading={loading}
        />

        {error && (
          <div className="error-banner" id="error-banner">
            <span className="error-banner__icon">⚠️</span>
            <span className="error-banner__text">{error}</span>
          </div>
        )}

        {result ? (
          <ActionPlan result={result} />
        ) : (
          !loading && !error && (
            <div className="empty-state">
              <div className="empty-state__icon">🛡️</div>
              <h3 className="empty-state__title">Ready to Diagnose</h3>
              <p className="empty-state__desc">
                Paste a Windows system log above and click <strong>Gemini Analyze</strong> to get
                an instant error diagnosis with PowerShell fix commands.
              </p>
            </div>
          )
        )}
      </main>

      <Footer />
    </>
  );
}
