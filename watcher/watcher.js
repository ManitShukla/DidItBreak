import chokidar from 'chokidar';
import { exec } from 'child_process';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target repository root to watch and diff (defaults to parent directory when running inside watcher/)
const repoRoot = path.resolve(__dirname, '..');
const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });
console.log(`[Watcher] Daemon running on ws://localhost:${PORT}`);
console.log(`[Watcher] Watching repository at: ${repoRoot}`);

const connectedClients = new Set();

/**
 * Execute git diff HEAD and send results to connected clients.
 * If targetClient is provided, sends diff only to that specific client (used on initial connect).
 */
export function broadcastDiff(targetClient = null) {
  exec('git diff HEAD', { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
    if (error) {
      console.error(`[Watcher] Git diff error: ${error.message}`);
      return;
    }

    const payload = JSON.stringify({
      type: 'DIFF_UPDATE',
      rawDiff: stdout || '',
      timestamp: Date.now(),
    });

    if (targetClient) {
      if (targetClient.readyState === WebSocket.OPEN) {
        targetClient.send(payload);
        console.log(`[Watcher] Sent initial diff (${stdout.length} bytes) to newly connected client.`);
      }
      return;
    }

    let activeCount = 0;
    for (const client of connectedClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        activeCount++;
      }
    }
    console.log(`[Watcher] Broadcast diff update (${stdout.length} bytes) to ${activeCount} client(s).`);
  });
}

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[Watcher] Client connected from ${clientIp}`);
  connectedClients.add(ws);

  // Immediately push the current diff upon a new client connection
  broadcastDiff(ws);

  ws.on('close', () => {
    console.log('[Watcher] Client disconnected.');
    connectedClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[Watcher] Client socket error: ${err.message}`);
    connectedClients.delete(ws);
  });
});

let debounceTimer = null;
const ignoredPatterns = [
  /node_modules/,
  /\.git/,
  /dist/,
  /\.next/,
  /build/,
  /out/,
  /\.cache/,
  /coverage/,
  /\.turbo/,
];

const watcher = chokidar.watch(repoRoot, {
  ignored: ignoredPatterns,
  persistent: true,
  ignoreInitial: true,
});

watcher.on('all', (event, filePath) => {
  console.log(`[Watcher] File changed [${event}]: ${path.relative(repoRoot, filePath)}`);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    broadcastDiff();
  }, 300);
});

process.on('SIGINT', () => {
  console.log('\n[Watcher] Shutting down daemon...');
  watcher.close();
  wss.close();
  process.exit(0);
});

