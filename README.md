# System-Sense 🛡️

> AI-powered Windows diagnostic dashboard — Built for Google PromptWars

Paste Windows system logs (DISM, SFC, BSOD) and get instant error analysis with exact PowerShell fix commands, powered by **Google Gemini**.

![System-Sense](https://img.shields.io/badge/Powered_by-Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Cloud Run](https://img.shields.io/badge/Cloud_Run-Ready-00C853?style=for-the-badge&logo=google-cloud&logoColor=white)

## Features

- **📋 Log Input** — Clean monospace editor with drag-and-drop `.txt`/`.log` support
- **⚡ Gemini Analyze** — One-click AI analysis using a precision system-instruction
- **🔍 Error Identification** — Pinpoints specific Windows error codes (CBS, BSOD bug checks, etc.)
- **⚙️ Action Plan** — Exact, copy-paste-ready PowerShell commands to fix the issue
- **🎨 Google Dark Mode** — Premium aesthetic with blue & emerald accents

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` and enter your [Gemini API key](https://aistudio.google.com/).

## Deploy to Google Cloud Run

```bash
# Build and deploy in one command
gcloud run deploy system-sense --source . --region us-central1
```

Or build the Docker image manually:

```bash
docker build -t system-sense .
docker run -p 8080:8080 system-sense
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| AI | Google Gemini 2.0 Flash |
| Styling | Vanilla CSS (Google Dark Mode) |
| Fonts | Inter + JetBrains Mono |
| Deployment | Docker + nginx → Cloud Run |

## How It Works

1. **Paste** a Windows system log (DISM, SFC, BSOD output)
2. **Click** "⚡ Gemini Analyze"
3. **Get** a structured diagnosis with:
   - Specific error code identification
   - Severity classification (Critical / Warning / Info)
   - Step-by-step PowerShell remediation commands
   - Detailed root cause explanation

## Prompt Engineering

The core of System-Sense is a precision-crafted **system instruction** that guides Gemini to:
- Extract specific Windows error codes from raw logs
- Classify severity based on error type
- Generate exact, elevated PowerShell commands
- Return structured JSON for clean UI rendering

## License

MIT
