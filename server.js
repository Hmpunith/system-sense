import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// ── API Routes ──
app.post('/api/analyze', async (req, res) => {
  try {
    const { logText } = req.body;
    if (!logText) {
      return res.status(400).json({ error: 'logText is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(
      `Analyze the following Windows system log and provide your diagnosis:\n\n${logText}`
    );

    const response = result.response;
    const text = response.text();

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      // If the model returned text wrapped in markdown code fences, strip them
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('Error analyzing log:', error);
    res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
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
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
