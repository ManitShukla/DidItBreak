import { useEffect, useState, useRef, useCallback } from 'react';

export interface DiffMessage {
  type: 'DIFF_UPDATE';
  rawDiff: string;
  timestamp: number;
}

export interface DirectoryStatusMessage {
  type: 'DIRECTORY_STATUS';
  success: boolean;
  activePath?: string;
  repoName?: string;
  error?: string;
}

export type IncomingSocketMessage = DiffMessage | DirectoryStatusMessage;

export type SocketStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export type DiffListener = (rawDiff: string, timestamp: number) => void;
export type StatusListener = (status: SocketStatus, error?: string | null) => void;
export type DirectoryStatusListener = (status: {
  activePath: string;
  repoName: string;
  success: boolean;
  error?: string;
}) => void;

const STORAGE_KEY_ACTIVE_REPO = 'diditbreak_active_repo';

class DiffSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectIntervalMs = 2500;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private diffListeners: Set<DiffListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private directoryListeners: Set<DirectoryStatusListener> = new Set();
  private isExplicitlyClosed = false;

  public status: SocketStatus = 'DISCONNECTED';
  public lastError: string | null = null;
  public lastRawDiff: string = '';
  public lastTimestamp: number = 0;

  public activePath: string = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_REPO) || '';
    } catch {
      return '';
    }
  })();
  public repoName: string = '';
  public directoryError: string | null = null;
  public isChangingDirectory: boolean = false;

  constructor(url = 'ws://localhost:8080') {
    this.url = url;
  }

  public connect(): void {
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING', null);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED', null);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // If we have a saved active repo from previous session, request switching to it
        const savedRepo = localStorage.getItem(STORAGE_KEY_ACTIVE_REPO);
        if (savedRepo && savedRepo.trim().length > 0 && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'SET_DIRECTORY',
            path: savedRepo.trim(),
          }));
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data === 'object') {
            if (data.type === 'DIFF_UPDATE') {
              this.lastRawDiff = data.rawDiff || '';
              this.lastTimestamp = data.timestamp || Date.now();
              this.notifyDiffListeners(this.lastRawDiff, this.lastTimestamp);
            } else if (data.type === 'DIRECTORY_STATUS') {
              this.isChangingDirectory = false;
              if (data.success && data.activePath) {
                this.activePath = data.activePath;
                this.repoName = data.repoName || data.activePath.split(/[/\\]/).pop() || 'repository';
                this.directoryError = null;
                try {
                  localStorage.setItem(STORAGE_KEY_ACTIVE_REPO, data.activePath);
                } catch {
                  // Ignore localStorage quota limits
                }
              } else {
                this.directoryError = data.error || 'Failed to switch target repository.';
              }

              this.notifyDirectoryListeners({
                activePath: this.activePath,
                repoName: this.repoName,
                success: Boolean(data.success),
                error: data.error,
              });
            }
          }
        } catch {
          // If raw text diff was sent directly
          if (typeof event.data === 'string') {
            this.lastRawDiff = event.data;
            this.lastTimestamp = Date.now();
            this.notifyDiffListeners(this.lastRawDiff, this.lastTimestamp);
          }
        }
      };

      this.ws.onerror = () => {
        const errorMsg = 'WebSocket connection failed';
        this.setStatus('ERROR', errorMsg);
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED', this.lastError);
        this.ws = null;
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to instantiate WebSocket';
      this.setStatus('ERROR', errorMsg);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED', null);
  }

  /**
   * Request daemon to change its active repository directory.
   */
  public changeDirectory(newPath: string): boolean {
    if (!newPath || typeof newPath !== 'string' || !newPath.trim()) {
      this.directoryError = 'Please provide a non-empty directory path.';
      this.notifyDirectoryListeners({
        activePath: this.activePath,
        repoName: this.repoName,
        success: false,
        error: this.directoryError,
      });
      return false;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.directoryError = 'Cannot change directory: Watcher daemon is offline.';
      this.notifyDirectoryListeners({
        activePath: this.activePath,
        repoName: this.repoName,
        success: false,
        error: this.directoryError,
      });
      return false;
    }

    this.isChangingDirectory = true;
    this.directoryError = null;

    this.ws.send(JSON.stringify({
      type: 'SET_DIRECTORY',
      path: newPath.trim(),
    }));

    return true;
  }

  public subscribe(onDiff: DiffListener): () => void {
    this.diffListeners.add(onDiff);
    if (this.lastRawDiff) {
      onDiff(this.lastRawDiff, this.lastTimestamp);
    }
    return () => {
      this.diffListeners.delete(onDiff);
    };
  }

  public subscribeStatus(onStatus: StatusListener): () => void {
    this.statusListeners.add(onStatus);
    onStatus(this.status, this.lastError);
    return () => {
      this.statusListeners.delete(onStatus);
    };
  }

  public subscribeDirectory(onDirStatus: DirectoryStatusListener): () => void {
    this.directoryListeners.add(onDirStatus);
    if (this.activePath) {
      onDirStatus({
        activePath: this.activePath,
        repoName: this.repoName,
        success: true,
      });
    }
    return () => {
      this.directoryListeners.delete(onDirStatus);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isExplicitlyClosed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, this.reconnectIntervalMs);
  }

  private setStatus(status: SocketStatus, error: string | null = null): void {
    this.status = status;
    this.lastError = error;
    for (const listener of this.statusListeners) {
      listener(status, error);
    }
  }

  private notifyDiffListeners(rawDiff: string, timestamp: number): void {
    for (const listener of this.diffListeners) {
      listener(rawDiff, timestamp);
    }
  }

  private notifyDirectoryListeners(data: { activePath: string; repoName: string; success: boolean; error?: string }): void {
    for (const listener of this.directoryListeners) {
      listener(data);
    }
  }
}

export const diffSocketService = new DiffSocketService();

export interface UseDiffSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  rawDiff: string;
  timestamp: number;
  activePath: string;
  repoName: string;
  directoryError: string | null;
  isChangingDirectory: boolean;
  changeDirectory: (newPath: string) => boolean;
  reconnect: () => void;
  disconnect: () => void;
}

export function useDiffSocket(onDiffReceived?: (rawDiff: string) => void): UseDiffSocketReturn {
  const [status, setStatus] = useState<SocketStatus>(diffSocketService.status);
  const [error, setError] = useState<string | null>(diffSocketService.lastError);
  const [rawDiff, setRawDiff] = useState<string>(diffSocketService.lastRawDiff);
  const [timestamp, setTimestamp] = useState<number>(diffSocketService.lastTimestamp);

  const [activePath, setActivePath] = useState<string>(diffSocketService.activePath);
  const [repoName, setRepoName] = useState<string>(diffSocketService.repoName);
  const [directoryError, setDirectoryError] = useState<string | null>(diffSocketService.directoryError);
  const [isChangingDirectory, setIsChangingDirectory] = useState<boolean>(diffSocketService.isChangingDirectory);

  const callbackRef = useRef(onDiffReceived);
  callbackRef.current = onDiffReceived;

  useEffect(() => {
    diffSocketService.connect();

    const unsubscribeStatus = diffSocketService.subscribeStatus((newStatus, err) => {
      setStatus(newStatus);
      setError(err ?? null);
    });

    const unsubscribeDiff = diffSocketService.subscribe((diff, time) => {
      setRawDiff(diff);
      setTimestamp(time);
      if (callbackRef.current) {
        callbackRef.current(diff);
      }
    });

    const unsubscribeDir = diffSocketService.subscribeDirectory((dirStatus) => {
      setIsChangingDirectory(false);
      if (dirStatus.success) {
        setActivePath(dirStatus.activePath);
        setRepoName(dirStatus.repoName);
        setDirectoryError(null);
      } else {
        setDirectoryError(dirStatus.error || 'Failed to switch directory');
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeDiff();
      unsubscribeDir();
    };
  }, []);

  const changeDirectory = useCallback((newPath: string) => {
    setIsChangingDirectory(true);
    setDirectoryError(null);
    return diffSocketService.changeDirectory(newPath);
  }, []);

  const reconnect = useCallback(() => {
    diffSocketService.disconnect();
    diffSocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    diffSocketService.disconnect();
  }, []);

  return {
    isConnected: status === 'CONNECTED',
    isConnecting: status === 'CONNECTING',
    error,
    rawDiff,
    timestamp,
    activePath,
    repoName,
    directoryError,
    isChangingDirectory,
    changeDirectory,
    reconnect,
    disconnect,
  };
}
