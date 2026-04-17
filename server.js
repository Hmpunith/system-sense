import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import NodeCache from 'node-cache';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Cache (5-minute TTL, check every 60 seconds)
const analysisCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ── Middleware ──
app.use(helmet()); // Professional security headers
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate Limiting (10 requests per minute per IP)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Too many diagnostic requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ── Gemini Configuration ──
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SYSTEM_INSTRUCTION = `You are System-Sense, an expert Windows system diagnostics AI. You analyze Windows system logs including DISM (Deployment Image Servicing and Management), SFC (System File Checker), and BSOD (Blue Screen of Death) crash dumps.

When the user provides a log, you MUST respond with ONLY valid JSON in the following exact schema — no markdown, no code fences, no explanation outside the JSON:

{
  "errorCode": "The specific Windows error code found (e.g., 0x800F081F, 0x00000050, CBS_E_SOURCE_MISSING). If multiple errors exist, list the most critical one.",
  "errorName": "Human-readable name of the error (e.g., 'DISM Source Files Not Found', 'PAGE_FAULT_IN_NONPAGED_AREA')",
  "severity": "critical | warning | info",
  "diagnosis": "A clear, concise 2-3 sentence explanation of what went wrong and why. Written for a technical but non-expert audience.",
  "commands": [
    {
      "label": "Brief description of what this command does",
      "command": "The exact PowerShell command to run (elevated/admin). Use multi-line if needed."
    }
  ],
  "explanation": "A detailed paragraph explaining the root cause, what the commands will do step-by-step, and what the user should expect after running them. Mention if a restart is required."
}

Rules:
- Always identify the SPECIFIC error code from the log. Don't guess — find it in the text.
- Provide 2-5 actionable PowerShell commands, ordered by execution priority.
- Commands MUST be exact, copy-paste ready, and work in an elevated PowerShell session.
- If the log is ambiguous or incomplete, still provide your best analysis but note the uncertainty in the diagnosis.
- For BSOD logs: identify the bug check code, faulting module, and driver if visible.
- For SFC logs: check for "Windows Resource Protection found corrupt files" patterns.
- For DISM logs: look for CBS (Component-Based Servicing) errors and source file issues.
- severity should be "critical" for BSOD and system-breaking errors, "warning" for repairable corruption, "info" for minor or already-resolved issues.`;

/**
 * API Route: Analyze Windows Logs
 * Uses Gemini AI with a specific diagnostic persona and structured output.
 * Implements hashing-based caching to reduce API costs and improve performance.
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { logText } = req.body;
    
    // 1. Validation
    if (!logText || typeof logText !== 'string' || logText.trim().length === 0) {
      return res.status(400).json({ error: 'Valid log text is required for analysis.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini service is not configured (Missing API Key).' });
    }

    // 2. Cache Check (MD5 hash of log text)
    const logHash = crypto.createHash('md5').update(logText.trim()).digest('hex');
    const cachedResult = analysisCache.get(logHash);
    
    if (cachedResult) {
      console.log(`[Cache Hit] Serving analysis for: ${logHash}`);
      return res.json(cachedResult);
    }

    console.log(`[Cache Miss] Calling Gemini for log: ${logHash.substring(0, 8)}...`);

    // 3. AI Analysis
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.1, // Lower temperature for more deterministic diagnostic results
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(
      `Analyze the following Windows system log and provide your diagnosis:\n\n${logText.substring(0, 8000)}`
    );

    const response = await result.response;
    const text = response.text();

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      // Robust stripping of markdown code fences if model fails to respect JSON mode
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // 4. Update Cache and Return
    analysisCache.set(logHash, parsedResult);
    res.json(parsedResult);
    
  } catch (error) {
    console.error('Error analyzing log:', error);
    
    // Determine appropriate error response
    if (error.message?.includes('quota')) {
      return res.status(429).json({ error: 'Gemini API quota exceeded. Please try again later.' });
    }
    
    res.status(500).json({ error: 'An unexpected error occurred during AI analysis.' });
  }
});

// ── Static Files (Production) ──
// When deployed to Cloud Run, serve the built Vite app
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
app.use((req, res) => {
  const file = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(file);
});

// ── Start Server ──
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
