import chokidar from 'chokidar';
import { exec } from 'child_process';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial target repository root (defaults to parent directory when running inside watcher/, or cwd)
let currentDir = path.resolve(__dirname, '..');
const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });
console.log(`[Watcher] Daemon running on ws://localhost:${PORT}`);
console.log(`[Watcher] Initial repository set to: ${currentDir}`);

const connectedClients = new Set();
let debounceTimer = null;
let activeWatcher = null;

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

/**
 * Sends DIRECTORY_STATUS payload to one or all connected clients.
 */
function sendDirectoryStatus(targetClient = null, success = true, error = null) {
  const payload = JSON.stringify({
    type: 'DIRECTORY_STATUS',
    success,
    activePath: currentDir,
    repoName: path.basename(currentDir),
    ...(error ? { error } : {}),
  });

  if (targetClient) {
    if (targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(payload);
    }
    return;
  }

  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Execute git diff HEAD and send results to connected clients.
 * If targetClient is provided, sends diff only to that specific client (used on initial connect).
 */
export function broadcastDiff(targetClient = null) {
  exec('git diff HEAD', { cwd: currentDir, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
    if (error) {
      console.error(`[Watcher] Git diff error in "${currentDir}": ${error.message}`);
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
        console.log(`[Watcher] Sent initial diff (${(stdout || '').length} bytes) to newly connected client.`);
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
    console.log(`[Watcher] Broadcast diff update (${(stdout || '').length} bytes) to ${activeCount} client(s).`);
  });
}

/**
 * Starts or rebinds Chokidar watcher on a new directory path.
 */
function startWatching(targetPath) {
  if (activeWatcher) {
    try {
      activeWatcher.close();
      console.log(`[Watcher] Closed previous watcher instance.`);
    } catch (err) {
      console.error(`[Watcher] Error closing previous watcher: ${err.message}`);
    }
  }

  currentDir = targetPath;
  console.log(`[Watcher] Now actively watching repository at: ${currentDir}`);

  activeWatcher = chokidar.watch(currentDir, {
    ignored: ignoredPatterns,
    persistent: true,
    ignoreInitial: true,
  });

  activeWatcher.on('all', (event, filePath) => {
    console.log(`[Watcher] File changed [${event}]: ${path.relative(currentDir, filePath)}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcastDiff();
    }, 300);
  });
}

// Start initial watcher on default directory
startWatching(currentDir);

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[Watcher] Client connected from ${clientIp}`);
  connectedClients.add(ws);

  // Send current directory status and current diff immediately upon connection
  sendDirectoryStatus(ws, true);
  broadcastDiff(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data && data.type === 'SET_DIRECTORY') {
        const requestedPath = data.path;
        console.log(`[Watcher] Received SET_DIRECTORY request for: "${requestedPath}"`);

        if (!requestedPath || typeof requestedPath !== 'string') {
          ws.send(JSON.stringify({
            type: 'DIRECTORY_STATUS',
            success: false,
            error: 'Invalid directory path provided.',
          }));
          return;
        }

        const resolvedPath = path.resolve(requestedPath.trim());

        // Validate directory existence
        if (!fs.existsSync(resolvedPath)) {
          ws.send(JSON.stringify({
            type: 'DIRECTORY_STATUS',
            success: false,
            error: `Directory does not exist: "${resolvedPath}"`,
          }));
          return;
        }

        let stat;
        try {
          stat = fs.statSync(resolvedPath);
        } catch (statErr) {
          ws.send(JSON.stringify({
            type: 'DIRECTORY_STATUS',
            success: false,
            error: `Cannot access directory permissions: ${statErr.message}`,
          }));
          return;
        }

        if (!stat.isDirectory()) {
          ws.send(JSON.stringify({
            type: 'DIRECTORY_STATUS',
            success: false,
            error: `Specified path is a file, not a directory: "${resolvedPath}"`,
          }));
          return;
        }

        // Validate Git repository (.git directory or file)
        const gitPath = path.join(resolvedPath, '.git');
        if (!fs.existsSync(gitPath)) {
          ws.send(JSON.stringify({
            type: 'DIRECTORY_STATUS',
            success: false,
            error: `Directory is not a Git repository (missing .git): "${resolvedPath}"`,
          }));
          return;
        }

        // Success: Rebind watcher to new repository
        startWatching(resolvedPath);

        // Broadcast success status to all connected clients
        sendDirectoryStatus(null, true);

        // Broadcast new diff immediately
        broadcastDiff();
      }
    } catch (err) {
      console.error(`[Watcher] Error handling client message: ${err.message}`);
      ws.send(JSON.stringify({
        type: 'DIRECTORY_STATUS',
        success: false,
        error: `Server protocol error: ${err.message}`,
      }));
    }
  });

  ws.on('close', () => {
    console.log('[Watcher] Client disconnected.');
    connectedClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[Watcher] Client socket error: ${err.message}`);
    connectedClients.delete(ws);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Watcher] Shutting down daemon...');
  if (activeWatcher) activeWatcher.close();
  wss.close();
  process.exit(0);
});
