# 💥 DidItBreak

**Autonomous Blast-Radius & Intent Visualizer for AI-Generated Codebases.**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini 1.5 Flash](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![@xyflow/react](https://img.shields.io/badge/%40xyflow%2Freact-v12-FF0072?style=flat-square)](https://reactflow.dev/)

---

## 🌉 The Problem & "Bridge the Gap" Alignment

The rise of autonomous coding agents and LLMs (Claude 3.7, Cursor, Gemini, Copilot, Aider) has sparked a fundamental architectural crisis:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     SIDE A: THE MACHINE         │                 │      SIDE B: THE ENGINEER       │
│                                 │                 │                                 │
│  Autonomous Coding Agents       │    THE GAP:     │  Staff Engineers & Maintainers  │
│  - Generates 10+ files/sec      │  ─────────────► │  - Reviews flat unified diffs   │
│  - Edits across 300+ lines      │   "VIBE CODING" │  - Blind to downstream shifts   │
│  - Instantaneous execution      │    BLINDNESS    │  - Guaranteed reliability duty  │
└─────────────────────────────────┘                 └─────────────────────────────────┘
                                           │
                                           ▼
                    ┌─────────────────────────────────────────┐
                    │          THE BRIDGE: DidItBreak         │
                    │                                         │
                    │  ✦ Passive File & Diff IPC Streamer     │
                    │  ✦ Topological Blast-Radius Graph       │
                    │  ✦ Gemini Flash Semantic Contract AST   │
                    │  ✦ Instant Verdict: Did It Break?       │
                    └─────────────────────────────────────────┘
```

* **Side A (The Machine):** Autonomous agents generate sweeping multi-file patches across dozens of services in milliseconds.
* **Side B (The Engineer):** Human developers and tech leads remain accountable for system uptime, data consistency, and architectural integrity.
* **The Gap:** The cognitive blindness of *"vibe coding"*. Unified `git diff` outputs are flat, linear, and syntactically disconnected. They cannot tell you if dropping a column in `schema.prisma` causes an unhandled 500 runtime `TypeError` in `userController.ts` three directories away.
* **The Bridge:** **DidItBreak** bridges this cognitive divide. It listens silently to workspace file writes, chunks raw git diffs into dependency graphs using zero-dependency heuristic parsers, reasons over semantic contracts using Google Gemini 1.5 Flash, and delivers an instant top-level verdict: **`🔴 SYSTEM BROKEN`** vs. **`🟢 CLEAN & SAFE`**.

---

## 🏛️ Architecture Overview

DidItBreak employs an **editor-agnostic, decoupled daemon architecture** that functions with any IDE, code editor, or autonomous terminal agent:

```
  ┌──────────────────────────────────────────────────────────────┐
  │                   LOCAL WORKSPACE / REPO                     │
  │                                                              │
  │  Cursor / VS Code / Zed / Neovim / Aider / Claude Code CLI   │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ (File Write Events)
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 watcher/watcher.js (Node.js)                 │
  │                                                              │
  │  ✦ Chokidar File Watcher (300ms multi-edit debounce)         │
  │  ✦ Buffer-Managed Git Subprocess (git diff HEAD, 10MB buf)   │
  │  ✦ WebSocket Server (ws://localhost:8080)                    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ (Real-Time JSON DIFF_UPDATE)
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                web/ (React 19 + TypeScript + Vite)           │
  │                                                              │
  │  ✦ socket.ts        : WebSocket Client (2.5s auto-reconnect) │
  │  ✦ diffParser.ts    : Zero-dependency hunk & import chunker  │
  │  ✦ graphBuilder.ts  : Dynamic DAG topology & causal chains   │
  │  ✦ gemini.ts        : Google Gemini 1.5 Flash Risk Engine    │
  │  ✦ @xyflow/react    : Interactive GPU-accelerated canvas     │
  └──────────────────────────────────────────────────────────────┘
```

### Why a Decoupled Watcher Beats an IDE Extension
1. **Editor Agnostic:** Works identically whether you use Cursor, VS Code, Zed, Sublime Text, Vim, or headless AI CLI tools (`claude`, `aider`, `devin`).
2. **Zero Sandboxing Limitations:** IDE extensions run inside tightly constrained extension hosts. The standalone daemon directly taps the native operating system's filesystem events and Git binaries with complete reliability.
3. **Multi-Monitor Pitch Ready:** Keep your code editor full-screen on Display 1 while DidItBreak runs as a dedicated HUD on Display 2.

---

## 📦 Prerequisites

Before running DidItBreak, ensure you have:
- **Node.js:** v18.0.0 or higher (Tested on Node.js v24)
- **npm:** v9.0.0 or higher
- **Git:** Installed and initialized in your working repository (`git init` or existing repo)
- **Google Gemini API Key:** *(Optional for demo presets, required for live semantic AI analysis)*. Get one for free at [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Quick-Start Guide (Setup in Under 60 Seconds)

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/ManitShukla/DidItBreak.git
cd DidItBreak

# Install Watcher Daemon dependencies
cd watcher
npm install
cd ..

# Install Web Dashboard dependencies
cd web
npm install --legacy-peer-deps
cd ..
```

### Step 2: Configure Environment Variables *(Optional)*

If you wish to use live Google Gemini 1.5 Flash for ad-hoc changes (rather than the built-in deterministic fallback engine):

```bash
# In the web/ directory:
cp web/.env.example web/.env
```

Edit `web/.env`:
```env
VITE_GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
```

> **Note:** If no API key is provided, DidItBreak automatically activates its **Deterministic AST Safety Heuristic Engine**, allowing the entire application to function offline seamlessly.

### Step 3: Run the Services

Open two terminal tabs:

**Terminal 1 (Start the Watcher Daemon):**
```bash
cd watcher
node watcher.js
```
*Console output:*
```
[Watcher] Daemon running on ws://localhost:8080
[Watcher] Watching repository at: /path/to/DidItBreak
```

**Terminal 2 (Start the Web Dashboard):**
```bash
cd web
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🖥️ How to Use the App

### 1. Live Watcher Mode
- Keep the dashboard open on `http://localhost:5173`.
- Edit, add, or delete code in any file in your project and save (`Ctrl+S` / `Cmd+S`).
- Within **300ms**, the watcher daemon captures the raw git diff, streams it across the WebSocket IPC pipeline, parses the modified files, and reconstructs the live topology graph with animated dependency edges.

### 2. Node Risk Triage
Every modified file renders as a high-contrast interactive node colored by its architectural risk severity:

| Severity | Color & Glow | Meaning & Trigger Condition |
|---|---|---|
| 🔴 **CRITICAL** | `border-rose-500 shadow-rose-500/20` | Breaking schema shifts, missing runtime properties, unhandled exceptions, or dropped column references. |
| 🟡 **WARNING** | `border-amber-500 shadow-amber-500/20` | Signature changes, altered routes, cookie-to-header migrations, or high-volume logic refactors requiring manual test coverage. |
| 🟢 **SAFE** | `border-emerald-500 shadow-emerald-500/20` | Pure utility functions, isolated helpers, documentation updates, or non-breaking cosmetic styling. |

### 3. Interactive Blast-Radius Tracing
- **Isolate the Impact:** Click on any node in the graph.
- **Canvas Dimming:** All unrelated files immediately dim to `opacity: 0.25`, spotlighting only the selected file and its connected blast radius.
- **Animated Pathways:** Edges connected to the selected node pulse with a high-voltage red glowing stroke (`#f43f5e`).
- **Inspection Drawer:** A slide-over panel glides in from the right side of the screen displaying:
  - **Full Repository Path:** Exact file locator.
  - **Plain-English Architectural Intent:** What the AI or developer was attempting to accomplish.
  - **Concrete Breakage Diagnostic:** Why the code will break at runtime.
  - **Downstream Blast Radius:** A list of all downstream modules and consumers affected.
  - **Raw Git Diff Patch:** Line-by-line view with addition and deletion highlights.
- **Reset:** Click anywhere on the graph canvas background to reset focus.

### 4. Active Repository & Folder Selector
- **Live Folder Switching:** You don't need to restart `watcher.js` when switching between projects.
- Click the **Repository Pill** in the top navigation bar (`FolderGit2` icon showing active repository name).
- Enter or paste any absolute file system path (POSIX or Windows backslash) or click a quick shortcut.
- The dashboard communicates over WebSocket protocol:
  - Transmits `{ type: "SET_DIRECTORY", path: targetPath }` to `watcher.js`.
  - The daemon validates directory existence and `.git` repository presence.
  - Automatically rebinds Chokidar to the new directory, runs `git diff HEAD`, and returns `{ type: "DIRECTORY_STATUS", success: true }`.
  - If invalid or missing `.git`, the modal highlights the failure and retains the previous active repository.
  - The last selected path is automatically persisted in `localStorage` across page reloads.

### 5. Context-Aware Code Explainer Chatbot & Line Pinpointing
- **Pinpoint Any Code Line:** Hover over or click any modified line in the line-by-line diff inspector (in `DetailDrawer`) or on any node card.
- **Context Chip:** The selected snippet is automatically pinned to the chat drawer: `[Pinned: fileName | codeSnippet] ✕`.
- **Targeted AI Diagnostics:** Questions submitted while a snippet is pinned automatically focus Gemini 1.5 Flash on that exact line and its immediate caller dependencies.
- **One-Click Prompt Chips:** Instant preset questions for rapid evaluation:
  - *"Why was this line changed?"*
  - *"What could break if this runs?"*
  - *"Suggest a safer alternative."*
- **Floating Launcher:** Click `💬 Ask DidItBreak AI` in the bottom-right corner at any time to open the assistant.

---

## 🏆 Judge / Evaluator Demo Guide (Fail-Safe Presets)

For hackathon judges and mentors reviewing the prototype during the 2–3 minute evaluation window, DidItBreak includes **Hardened Offline Demo Presets** accessible via the top toolbar. These presets require **zero active typing, zero editor setups, and zero external network access**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Demo Controls: [ 🔴 Live Watcher Stream ] [ Scenario A: Broken Prisma ] ...           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Preset 1: Scenario A — Broken Prisma Migration (The Pitch Hero)
- **Click:** `[ Scenario A: Broken Prisma ]`
- **What Happens:**
  - Top Banner turns **🔴 SYSTEM BROKEN**: *"Critical failure detected in [prisma/schema.prisma]"*.
  - Graph maps `schema.prisma` $\to$ `controllers/userController.ts` $\to$ `routes/auth.ts`.
  - Click `controllers/userController.ts`: Notice the **CRITICAL** risk tag. Gemini flags that `userController.ts` attempts to access `req.user.organizationId`, which was deleted from the Prisma schema, triggering an unhandled 500 TypeError in production.

### Preset 2: Scenario B — Auth Session Refactor
- **Click:** `[ Scenario B: Auth Refactor ]`
- **What Happens:**
  - Top Banner turns **🟡 CAUTION**: *"Contract modifications require verification"*.
  - Graph maps `middleware/jwt.ts` $\to$ `routes/api.ts`.
  - Notice the **WARNING** risk tag: Gemini explains that switching token extraction from cookie jar parsing to `Authorization: Bearer` headers breaks legacy web clients that do not transmit bearer tokens.

### Preset 3: Scenario C — Safe Utility Add
- **Click:** `[ Scenario C: Safe Utility ]`
- **What Happens:**
  - Top Banner turns **🟢 CLEAN & SAFE**: *"All architectural changes verified non-breaking"*.
  - Graph displays an isolated `utils/formatters.ts` node with additions highlighted in green.
  - Gemini confirms all additions are pure helper functions with zero side-effects.

---

## 🗺️ Overnight Hackathon Roadmap (Phase 2 Deliverables)

DidItBreak is engineered to evolve from a real-time visualization tool into an **active enforcement barrier**:

1. **Automated Git Pre-Commit Rejection Hook (`diditbreak install-hook`):**
   - Installs a native `.git/hooks/pre-commit` script that halts `git commit` if the DidItBreak evaluation engine detects any `CRITICAL` risk nodes without explicit user override (`--allow-break`).
2. **In-Canvas Selective Node Revert:**
   - A one-click `[Revert Node]` action button inside the `DetailDrawer` that executes targeted `git checkout -- <file>` commands to undo single broken files without discarding the rest of the AI agent's edits.
3. **Automated Test Synthesis for Flagged Breaks:**
   - An integrated button that prompts Gemini to generate targeted Vitest/Jest regression test cases that specifically assert and reproduce the detected contract break.
4. **CI/CD Pull Request GitHub Action:**
   - Automatically posts an interactive SVG blast-radius topology map directly into GitHub Pull Request review comments.

---

## 🛠️ Complete Tech Stack

| Layer | Technologies |
|---|---|
| **Daemon & Subprocesses** | Node.js (ES Modules), `chokidar` (v4), `ws` (v8), `child_process.exec` |
| **Frontend Framework** | React 19, TypeScript 5.7, Vite 6.1 |
| **Styling & Design System** | Tailwind CSS (v4), `clsx`, `tailwind-merge` |
| **Graph & Canvas Engine** | `@xyflow/react` (React Flow v12) |
| **Semantic Intelligence** | Google Gemini 1.5 Flash API + Local Deterministic AST Safety Engine |
| **Iconography** | `lucide-react` |

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.