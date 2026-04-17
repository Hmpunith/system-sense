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
import pino from 'pino';
import compression from 'compression';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ── Enterprise Infrastructure ──
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined
});

const analysisCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ── Zod Schema for AI Responses ──
const DiagnosticSchema = z.object({
  errorCode: z.string().describe("Specific Windows error code"),
  errorName: z.string().optional().describe("Human readable name"),
  severity: z.enum(['critical', 'warning', 'info']).describe("Severity level"),
  diagnosis: z.string().describe("Concise 2-3 sentence explanation"),
  commands: z.array(z.object({
    label: z.string().describe("Tool description"),
    command: z.string().describe("PowerShell command")
  })).min(1),
  explanation: z.string().describe("Detailed root cause and step-by-step fix")
});

app.use(helmet());
app.use(compression()); // Reduce payload size
app.use(cors());
app.use(express.json({ limit: '2mb' }));

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
const SYSTEM_INSTRUCTION = `When the user provides a log, you MUST respond with ONLY valid JSON — no markdown, no code fences.

### FEW-SHOT EXAMPLES:

User: "Error: 0x800f081f. The source files could not be found."
Assistant: {
  "errorCode": "0x800f081f",
  "errorName": "CBS_E_SOURCE_MISSING",
  "severity": "critical",
  "diagnosis": "Windows is missing necessary source files to repair the component store. This often happens when .NET Framework or a system update is corrupted.",
  "commands": [
    { "label": "Repair using Windows Update", "command": "Repair-WindowsImage -Online -RestoreHealth" },
    { "label": "Mounting Install Media", "command": "Dism /Online /Cleanup-Image /RestoreHealth /Source:WIM:D:\\sources\\install.wim:1 /LimitAccess" }
  ],
  "explanation": "We are attempting to restore the system image. If the online repair fails, you must provide a valid Windows installation media (ISO) as a source."
}

User: "BugCheck 0x1A: MEMORY_MANAGEMENT (41792, ffff8a8100609ec0, 4, 0)"
Assistant: {
  "errorCode": "0x1A",
  "errorName": "MEMORY_MANAGEMENT",
  "severity": "critical",
  "diagnosis": "A severe memory management error occurred. Parameter 1 indicates a corrupted page table entry.",
  "commands": [
    { "label": "Run Memory Diagnostic", "command": "Restart-Computer -Force; mdsched.exe" },
    { "label": "Check System Files", "command": "sfc /scannow" }
  ],
  "explanation": "This BSOD is likely caused by hardware RAM failure or a corrupted kernel driver. We suggest a full memory diagnostic test on restart."
}

### OUTPUT SCHEMA RULES:
- Always identify the SPECIFIC error code from the log.
- severity MUST be: "critical", "warning", or "info".
- commands MUST be an array of objects with 'label' and 'command'.`;
`;

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
      logger.info({ logHash }, 'Cache Hit');
      return res.json(cachedResult);
    }

    logger.info({ logHash: logHash.substring(0, 8) }, 'Cache Miss');

    // 3. AI Analysis
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.1,
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
    } catch (parseError) {
      logger.warn({ parseError, text }, 'JSON parse failed, attempting manual cleanup');
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // 4. Schema Validation (The "Top 50" Reliability Layer)
    const validatedResult = DiagnosticSchema.safeParse(parsedResult);
    if (!validatedResult.success) {
      logger.error({ errors: validatedResult.error }, 'AI output failed Zod validation');
      return res.status(500).json({ error: 'AI generated an invalid diagnostic format. Please try again.' });
    }

    // 5. Update Cache and Return
    analysisCache.set(logHash, validatedResult.data);
    logger.info({ logHash, errorCode: validatedResult.data.errorCode }, 'Analysis Successful');
    res.json(validatedResult.data);
    
  } catch (error) {
    logger.error({ error }, 'Endpoint Error');
    
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
