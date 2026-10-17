# 💥 DidItBreak: Architectural Blast-Radius & Code Safety Engine

> **Bridge the cognitive gap between instant AI code generation and human developer comprehension.**  
> Transforms raw `git diff` streams into an interactive architectural topology graph powered by Gemini Flash semantic analysis.

---

## ⚡ The Problem: Why DidItBreak?

AI coding assistants (Claude 3.7, Cursor, Gemini, Copilot) can modify 10+ files across an entire codebase in seconds. But while code generation is instantaneous, developer comprehension is broken.
- Staring at 300+ lines of raw, flat `git diff` provides **zero visibility** into whether an edit breaks downstream consumers.
- A single deleted database column or altered function signature cascades into silent runtime exceptions (`TypeError: Cannot read properties of undefined`).
- **DidItBreak** passively monitors your local workspace, parses diff streams in real time, and renders an interactive blast-radius dependency graph with instant verdicts: **🔴 SYSTEM BROKEN** vs. **🟢 CLEAN & SAFE**.

---

## 🏗️ Architecture & Pipeline Overview

```
diditbreak/
├── watcher/
│   ├── package.json
│   └── watcher.js           # Chokidar + Git Diff IPC Server (ws://localhost:8080)
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeDiffNode.tsx     # Custom React Flow Node (metrics, mini-diff, risk badge)
│   │   │   ├── DetailDrawer.tsx     # Slide-over Blast-Radius & Intent Inspection Panel
│   │   │   ├── GlobalVerdict.tsx    # Prominent sticky system verdict header
│   │   │   └── PresetsBar.tsx       # Live Watcher / Offline Demo Scenario Switcher
│   │   ├── services/
│   │   │   ├── diffParser.ts        # Zero-dependency unified git diff chunking engine
│   │   │   ├── gemini.ts            # Gemini Flash structured risk & AST analysis (with 2000ms fallback)
│   │   │   ├── graphBuilder.ts      # Heuristic topological graph & causal edge builder
│   │   │   └── socket.ts            # Client WebSocket connection with 2.5s auto-reconnect
│   │   ├── data/
│   │   │   └── mockScenarios.ts     # Pre-evaluated pitch scenarios (Prisma Hero, Auth, Safe)
│   │   ├── App.tsx                  # Main canvas layout, selection dimming & blast radius
│   │   └── main.tsx
│   └── package.json
└── package.json
```

---

## 🚀 Quickstart & Launch Guide

### Prerequisites
- Node.js >= 18 (Tested on Node.js v24)
- npm >= 9

### Step 1: Install Dependencies
```bash
# Watcher Daemon
cd watcher
npm install

# Web Frontend Dashboard
cd ../web
npm install --legacy-peer-deps
```

### Step 2: Run the Watcher Daemon (Terminal 1)
```bash
cd watcher
node watcher.js
# Runs WebSocket IPC server on ws://localhost:8080
# Watches repository changes with 300ms debounce
```

### Step 3: Run the Dashboard (Terminal 2)
```bash
cd web
npm run dev
# Dashboard launches at http://localhost:5173
```

---

## 🎯 Demo Guardrails & Scenarios

DidItBreak includes built-in offline presets in the top toolbar to guarantee a bulletproof live pitch even without active Wi-Fi or API keys:

1. **🔴 Scenario A: Broken Prisma Migration (The Pitch Hero)**
   - `prisma/schema.prisma`: Dropped `organizationId` column.
   - `src/controllers/userController.ts`: `CRITICAL` — Reads `req.user.organizationId` at runtime $\to$ Unhandled TypeError.
   - `src/routes/auth.ts`: `WARNING` — Session middleware payload signature modified.
2. **🟡 Scenario B: Auth Session Refactor**
   - `src/middleware/jwt.ts`: Switched authentication tokens from cookies to Authorization Bearer header.
   - `src/routes/api.ts`: Updated downstream endpoint consumers with rate-limiting guardrails.
3. **🟢 Scenario C: Safe Utility Add**
   - `src/utils/formatters.ts`: Added isolated multi-currency formatting helper function with zero side effects.
4. **📡 Live Watcher Stream**
   - Connects live to `ws://localhost:8080`. Modify and save any file in the repo to see the canvas update dynamically.

---

## 🎤 The 150-Second Pitch Delivery Script

- **0:00 – 0:30 | The Problem & The Gap**  
  *"Mentors, AI coding assistants edit 10 files across an entire repository in seconds. But while generation is instant, developer comprehension is broken. Staring at 300 lines of flat git diffs gives you zero visibility into whether an edit broke downstream services. There is a dangerous cognitive gap between machine generation speed and human oversight. We built **DidItBreak** to bridge that gap."*

- **0:30 – 1:30 | The Live Walkthrough**  
  *(Screen shows the live web canvas running on localhost)*  
  *"DidItBreak runs as a passive local watcher. As soon as an AI agent or developer saves changes to disk, our engine transforms raw diffs into an architectural blast-radius graph. Look at the top banner: **🔴 SYSTEM BROKEN**."*  
  *(Clicks the `userController.ts` node)*  
  *"Here, the AI deleted a column in our Prisma schema. Our Gemini Flash engine analyzes the diff and flags the exact break: `userController` is still referencing the deleted `organizationId`, which will cause a 500 crash in production. Unrelated files dim automatically, tracing the exact impact path."*

- **1:30 – 2:15 | Architecture & Overnight Roadmap**  
  *"Under the hood, DidItBreak uses an IPC WebSocket daemon, lightweight diff-chunking heuristics, and Gemini Flash for sub-second semantic contract analysis. During the overnight phase, we are adding automated Git pre-commit rejection hooks and an interactive revert sandbox to reject individual breaking nodes right from the canvas."*

- **2:15 – 2:30 | Wrap-Up & Mentor Hand-Off**  
  *"DidItBreak ensures developers never have to ask 'Did it break?' again. Thank you, and we welcome your feedback!"*

---

## 🧪 Tech Stack
- **Daemon:** Node.js, `chokidar`, `ws`, `child_process`
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Graph Visualization:** `@xyflow/react`
- **Intelligence:** Google Gemini 1.5 Flash API with 2000ms deterministic local safety fallback
- **Icons:** `lucide-react`