# Implementation Plan: DidItBreak (2-Hour Rapid Prototype Sprint)

This document specifies the step-by-step engineering roadmap for building **DidItBreak** within a strict 120-minute development window. The architecture prioritizes functional delivery, bulletproof live demos, and scoring alignment with the official mentoring evaluation criteria (Theme, Functionality, Execution, and Impact).

---

## Sprint Architecture & Dependency Overview

```
diditbreak/
├── watcher/               # Standalone Local CLI Daemon
│   ├── package.json
│   └── watcher.js         # Chokidar + Git Diff + WebSocket Server (ws://localhost:8080)
├── web/                   # Single-Page Dashboard (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx          # @xyflow/react Graph Canvas
│   │   │   ├── CodeDiffNode.tsx    # Custom Node (Diff stats, risk badge, code snippet)
│   │   │   ├── DetailDrawer.tsx    # Slide-over inspection panel (Blast radius context)
│   │   │   ├── GlobalVerdict.tsx   # Top banner: "🔴 SYSTEM BROKEN" vs "🟢 SAFE"
│   │   │   └── PresetsBar.tsx      # Demo fallback switcher (Live / Canned scenarios)
│   │   ├── services/
│   │   │   ├── diffParser.ts       # Parses raw git diff text into structured file chunks
│   │   │   ├── gemini.ts           # Gemini Flash structured reasoning API caller
│   │   │   └── socket.ts           # Client WebSocket listener for watcher events
│   │   ├── data/
│   │   │   └── mockScenarios.ts    # Pre-evaluated offline demo payloads (Hard demo safety)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json

```

---

## 120-Minute Chronological Sprint Roadmap

| Phase | Time Window | Primary Milestone | Pitch Value / Risk Mitigated |
| --- | --- | --- | --- |
| **Phase 1** | Min 00 – 20 | **Scaffolding & IPC Pipeline** | Core pipeline: Local `git diff` streaming to Web dashboard.

 |
| **Phase 2** | Min 20 – 45 | **Diff Parser & Graph Engine** | Visual topology: Files render as connected interactive nodes.

 |
| **Phase 3** | Min 45 – 75 | **Gemini Intent & Risk Engine** | Intelligence: Nodes display "Did It Break?" verdicts and rationale.

 |
| **Phase 4** | Min 75 – 95 | **Blast-Radius & Detail Drawer** | Interactivity: Node selection dims canvas, traces impact path.

 |
| **Phase 5** | Min 95 – 110 | **Hardened Demo Fallbacks** | Resilience: Offline mock toggle prevents network failures.

 |
| **Phase 6** | Min 110 – 120 | **Rehearsal & Environment Freeze** | Pitch prep: Rehearsing the 150-second presentation.

 |

---

## Phase 1: Scaffolding & Live IPC Pipeline (Minutes 00 – 20)

*Priority: P0 (Non-Negotiable Core)*

### 1.1 Project Initialization

Run the following commands in the project root:

```bash
mkdir -p diditbreak/watcher diditbreak/web
cd diditbreak

# Initialize Watcher Daemon
cd watcher
npm init -y
npm install ws chokidar
cd ..

# Initialize Frontend Dashboard
npm create vite@latest web -- --template react-ts
cd web
npm install @xyflow/react lucide-react clsx tailwindcss @tailwindcss/vite

```

### 1.2 Watcher Daemon Implementation (`watcher/watcher.js`)

Build a 40-line Node script that listens for local file modifications, executes `git diff HEAD`, and broadcasts the raw patch over WebSockets.

* **Requirements:**
* Must ignore `.git`, `node_modules`, `dist`, and cache folders.
* Must debounce filesystem writes by 300ms to handle multi-file AI edits cleanly.
* Must run an immediate diff on new client connections.



```javascript
import chokidar from 'chokidar';
import { exec } from 'child_process';
import { WebSocketServer } from 'ws';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });
console.log(`[Watcher] Daemon running on ws://localhost:${PORT}`);

let activeSocket = null;

wss.on('connection', (ws) => {
  console.log('[Watcher] Web client attached.');
  activeSocket = ws;
  broadcastDiff();
});

function broadcastDiff() {
  exec('git diff HEAD', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
    if (error) {
      console.error('[Watcher] Git diff error:', error.message);
      return;
    }
    if (activeSocket && activeSocket.readyState === 1) {
      activeSocket.send(JSON.stringify({
        type: 'DIFF_UPDATE',
        rawDiff: stdout,
        timestamp: Date.now()
      }));
    }
  });
}

let timeout;
chokidar.watch('.', {
  ignored: [/node_modules/, /\.git/, /dist/, /\.next/],
  persistent: true,
  ignoreInitial: true,
}).on('all', () => {
  clearTimeout(timeout);
  timeout = setTimeout(broadcastDiff, 300);
});

```

### 1.3 Client WebSocket Listener (`web/src/services/socket.ts`)

Connects to `ws://localhost:8080` and stores status (`CONNECTED` | `DISCONNECTED`) in React state with an auto-reconnect retry loop.

---

## Phase 2: Diff Parsing & Graph Engine (Minutes 20 – 45)

*Priority: P0 (Non-Negotiable Core)*

### 2.1 Unified Diff Parser (`web/src/services/diffParser.ts`)

Converts raw `git diff` text into structured file-level blocks without using heavyweight external libraries.

* **Extracted Schema Contract:**

```typescript
export interface ParsedFileDiff {
  id: string;
  filePath: string;
  fileName: string;
  additions: number;
  deletions: number;
  oldSnippet: string;
  newSnippet: string;
  rawPatch: string;
  imports: string[]; // Used for edge linking
}

```

* **Parsing Logic Rules:**
* Identify files via `diff --git a/(.*) b/(.*)`.
* Count additions (`+`) excluding `+++`.
* Count deletions (`-`) excluding `---`.
* Capture up to 4 lines of deleted context and 4 lines of added context for the mini-node display.
* Regex search added lines for `import ... from './(.*)'` to infer local dependency edges.



### 2.2 Topological Graph Construction

Map `ParsedFileDiff[]` to `@xyflow/react` node and edge structures:

* **Node Generation:** Generate nodes using a horizontal/grid layout algorithm (`x: index * 360`, `y: (index % 2) * 180`).
* **Edge Generation:** Connect nodes where `File A` imports `File B` or shares the same immediate parent directory.
* **Fallback Linkage:** If no direct import is parsed, create a sequential causal chain from the first changed file (root cause) to all downstream modified files.

---

## Phase 3: Gemini Intent & "Did It Break?" Diagnostics (Minutes 45 – 75)

*Priority: P0 (Core Evaluated Feature)*

### 3.1 AI Reasoning Service (`web/src/services/gemini.ts`)

Pass each parsed diff to Google Gemini Flash. Enforce a strict JSON response.

* **System Prompt:**

```text
You are the DidItBreak AST and architectural safety engine.
Analyze this git diff for a single file within a project.

File: ${filePath}
Patch:
${rawPatch}

Evaluate whether this change introduces runtime failures, breaking contract shifts, or unhandled exceptions.
Return strictly valid JSON matching this schema:
{
  "riskLevel": "CRITICAL" | "WARNING" | "SAFE",
  "breakReason": "One concise sentence on what will break or could fail at runtime.",
  "intentSummary": "One concise sentence on why the developer or AI made this modification.",
  "isRootCause": true | false
}

```

### 3.2 Custom Node Component (`web/src/components/CodeDiffNode.tsx`)

Create a high-impact, custom node for `@xyflow/react`:

* **Visual States:**
* **CRITICAL:** High-contrast border (`border-rose-500`), subtle red glow (`shadow-rose-500/20`), pulsing badge.
* **WARNING:** Yellow border (`border-amber-500`), amber badge.
* **SAFE:** Emerald border (`border-emerald-500`), emerald badge.


* **Card Interior:**
1. Top bar: File name and `+X / -Y` metrics.
2. Mini-diff box: Red line-through text for deletions, green text for additions.
3. Risk Banner: Renders `breakReason` in bold high-contrast text.



### 3.3 Global Verdict Banner (`web/src/components/GlobalVerdict.tsx`)

A top-level banner mounted permanently at the top of the interface:

* If $\ge 1$ node is `CRITICAL`:
* Render: `🔴 SYSTEM BROKEN: Critical failure detected in [FileName]`.


* Else if $\ge 1$ node is `WARNING`:
* Render: `🟡 CAUTION: 2 contract modifications require verification`.


* Else:
* Render: `🟢 CLEAN & SAFE: All architectural changes verified non-breaking`.



---

## Phase 4: Interactive Blast-Radius & Detail Drawer (Minutes 75 – 95)

*Priority: P1 (High Impact for Mentors)*

### 4.1 Node Selection & Dimming Mechanics

Implement interactive canvas states on `@xyflow/react`:

* When a user clicks a node:
* Set `selectedNodeId` in state.
* Dim all non-connected nodes to `opacity: 0.25`.
* Set connected edges to `animated: true` with a bright glowing stroke.
* Clear selection when clicking the canvas background.



### 4.2 Slide-Over Detail Drawer (`web/src/components/DetailDrawer.tsx`)

An inspection panel anchored to the right side of the screen when a node is selected:

* **Header:** Full repository file path and status badge.
* **Architectural Intent Section:** Explains the high-level goal in natural language.
* **Breakage Diagnosis:** Detailed explanation of the risk, pointing out missing error boundaries, deleted schema keys, or altered function signatures.
* **Downstream Blast Radius:** A list of other files in the codebase that depend on this node.

---

## Phase 5: Demo Guardrails & Mock Scenarios (Minutes 95 – 110)

*Priority: P0 (Pitch Insurance — Critical for Hackathon Survival)*

To guarantee that a slow Wi-Fi connection, API rate limit, or empty git diff cannot ruin the 3-minute pitch, hardcode three realistic presets.

### 5.1 Pre-Computed Scenarios (`web/src/data/mockScenarios.ts`)

Create static data objects with pre-baked Gemini responses:

1. **Scenario 1: Critical Database Breakage (The Pitch Hero)**
* `schema.prisma`: Removed `organizationId` from `User` model.
* `controllers/userController.ts`: `CRITICAL` risk — Attempts to read `req.user.organizationId` at runtime $\to$ Unhandled TypeError.
* `routes/auth.ts`: `WARNING` risk — Session serialization missing field.


2. **Scenario 2: Auth Refactor (Safe/Warning)**
* `middleware/jwt.ts`: Migrated from cookie parsing to Bearer token header.
* `routes/api.ts`: Updated downstream consumption safely.


3. **Scenario 3: Safe Feature Addition**
* `utils/formatters.ts`: Added currency formatter function (`SAFE`).



### 5.2 Header Controls (`web/src/components/PresetsBar.tsx`)

A top bar allowing the presenter to switch modes instantly:

* `[ 🔴 Live Watcher: Active ]`
* `[ Load: Broken Prisma Migration ]`
* `[ Load: Auth Session Refactor ]`
* `[ Load: Safe Feature Add ]`

---

## Phase 6: Environment Freeze & 150-Second Pitch Rehearsal (Minutes 110 – 120)

*Priority: P0 (Execution & Delivery Scoring)*

### 6.1 Pre-Evaluation Checklist



* [ ] Terminal 1: Run `node watcher/watcher.js` in a dummy Git repo with pending changes.


* [ ] Terminal 2: Run `npm run dev` in `web/`.


* [ ] Browser: Open `http://localhost:5173` in full screen.


* [ ] Verify preset buttons switch scenarios instantly without lag.


* [ ] Test live typing: Stage/unstage a file in the dummy repo and verify the canvas updates automatically.

### 6.2 The 150-Second Pitch Delivery Script



* 0:00 – 0:30 | The Problem & The Gap (Speaker 1):
"Mentors, AI coding assistants edit 10 files across an entire repository in seconds. But while generation is instant, developer comprehension is broken. Staring at 300 lines of flat git diffs gives you zero visibility into whether an edit broke downstream services. There is a dangerous cognitive gap between machine generation speed and human oversight. We built **DidItBreak** to bridge that gap."


* 0:30 – 1:30 | The Live Walkthrough (Speaker 2 / Demo Driver):
(Screen shows the live web canvas running on localhost)
"DidItBreak runs as a passive local watcher. As soon as an AI agent or developer saves changes to disk, our engine transforms raw diffs into an architectural blast-radius graph. Look at the top banner: **🔴 SYSTEM BROKEN**."
*(Clicks the `userController.ts` node)*
*"Here, the AI deleted a column in our Prisma schema. Our Gemini Flash engine analyzes the diff and flags the exact break: `userController` is still referencing the deleted `organizationId`, which will cause a 500 crash in production. Unrelated files dim automatically, tracing the exact impact path."*


* 1:30 – 2:15 | Architecture & Overnight Roadmap (Speaker 1):
"Under the hood, DidItBreak uses an IPC WebSocket daemon, lightweight diff-chunking heuristics, and Gemini Flash for sub-second semantic contract analysis. During the overnight phase, we are adding automated Git pre-commit rejection hooks and an interactive revert sandbox to reject individual breaking nodes right from the canvas."


* 2:15 – 2:30 | Wrap-Up & Mentor Hand-Off (Speaker 2):
"DidItBreak ensures developers never have to ask 'Did it break?' again. Thank you, and we welcome your feedback!"