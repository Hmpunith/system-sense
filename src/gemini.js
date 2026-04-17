/**
 * Analyze a Windows system log via the secure backend proxy.
 * @param {string} logText - The raw log text to analyze
 * @returns {Promise<object>} Parsed analysis result from the Express backend
 */
export async function analyzeLog(logText) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ logText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.statusText}`);
  }

  return response.json();
}
