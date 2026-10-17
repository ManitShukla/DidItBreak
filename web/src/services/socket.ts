import { useEffect, useState, useRef, useCallback } from 'react';

export interface DiffMessage {
  type: 'DIFF_UPDATE';
  rawDiff: string;
  timestamp: number;
}

export type SocketStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export type DiffListener = (rawDiff: string, timestamp: number) => void;
export type StatusListener = (status: SocketStatus, error?: string | null) => void;

class DiffSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectIntervalMs = 2500;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private diffListeners: Set<DiffListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private isExplicitlyClosed = false;

  public status: SocketStatus = 'DISCONNECTED';
  public lastError: string | null = null;
  public lastRawDiff: string = '';
  public lastTimestamp: number = 0;

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
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data: DiffMessage = JSON.parse(event.data);
          if (data && data.type === 'DIFF_UPDATE') {
            this.lastRawDiff = data.rawDiff || '';
            this.lastTimestamp = data.timestamp || Date.now();
            this.notifyDiffListeners(this.lastRawDiff, this.lastTimestamp);
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

  public subscribe(onDiff: DiffListener): () => void {
    this.diffListeners.add(onDiff);
    // If we already have a diff, push immediately
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
}

// Export singleton instance
export const diffSocketService = new DiffSocketService();

export interface UseDiffSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  rawDiff: string;
  timestamp: number;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * React hook to manage WebSocket connection and receive diff payloads
 */
export function useDiffSocket(onDiffReceived?: (rawDiff: string) => void): UseDiffSocketReturn {
  const [status, setStatus] = useState<SocketStatus>(diffSocketService.status);
  const [error, setError] = useState<string | null>(diffSocketService.lastError);
  const [rawDiff, setRawDiff] = useState<string>(diffSocketService.lastRawDiff);
  const [timestamp, setTimestamp] = useState<number>(diffSocketService.lastTimestamp);

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

    return () => {
      unsubscribeStatus();
      unsubscribeDiff();
    };
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
    reconnect,
    disconnect,
  };
}

