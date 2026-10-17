import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Radio, RefreshCw, Layers } from 'lucide-react';
import clsx from 'clsx';

export interface GlobalVerdictProps {
  verdict: 'CRITICAL' | 'WARNING' | 'SAFE';
  criticalFile?: string;
  warningCount?: number;
  totalFiles: number;
  additions: number;
  deletions: number;
  isConnected: boolean;
  isConnecting: boolean;
  onReconnect?: () => void;
}

export const GlobalVerdict: React.FC<GlobalVerdictProps> = ({
  verdict,
  criticalFile,
  warningCount = 0,
  totalFiles,
  additions,
  deletions,
  isConnected,
  isConnecting,
  onReconnect,
}) => {
  return (
    <div
      className={clsx(
        'w-full px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b transition-colors duration-300 shadow-lg z-20 sticky top-0 backdrop-blur-md',
        verdict === 'CRITICAL' && 'bg-rose-950/90 border-rose-700/80 text-rose-100 shadow-rose-950/40',
        verdict === 'WARNING' && 'bg-amber-950/90 border-amber-700/80 text-amber-100 shadow-amber-950/40',
        verdict === 'SAFE' && 'bg-emerald-950/90 border-emerald-700/80 text-emerald-100 shadow-emerald-950/40'
      )}
    >
      {/* Primary Verdict Announcement */}
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className="shrink-0">
          {verdict === 'CRITICAL' && (
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-rose-500 opacity-75" />
              <AlertCircle className="relative w-6 h-6 text-rose-400 animate-pulse" />
            </div>
          )}
          {verdict === 'WARNING' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
          {verdict === 'SAFE' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span
              className={clsx(
                'font-black tracking-wider uppercase text-xs px-2 py-0.5 rounded shadow',
                verdict === 'CRITICAL' && 'bg-rose-600 text-white',
                verdict === 'WARNING' && 'bg-amber-600 text-white',
                verdict === 'SAFE' && 'bg-emerald-600 text-white'
              )}
            >
              {verdict === 'CRITICAL' ? 'SYSTEM BROKEN' : verdict === 'WARNING' ? 'CAUTION' : 'CLEAN & SAFE'}
            </span>
            <span className="text-zinc-400 text-xs hidden sm:inline">|</span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
              {verdict === 'CRITICAL' &&
                `🔴 SYSTEM BROKEN: Critical failure detected in [${criticalFile || 'core module'}]`}
              {verdict === 'WARNING' &&
                `🟡 CAUTION: ${warningCount || 1} contract modification(s) require verification`}
              {verdict === 'SAFE' &&
                '🟢 CLEAN & SAFE: All architectural changes verified non-breaking'}
            </h2>
          </div>
        </div>
      </div>

      {/* Connection & Blast Radius Status Badges */}
      <div className="flex items-center space-x-3 text-xs shrink-0">
        {/* Watcher IPC Connection Pill */}
        {isConnected ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Radio className="w-3.5 h-3.5 ml-0.5" />
            <span>Live Watcher Active</span>
          </div>
        ) : isConnecting ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-500/50 text-amber-300 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Connecting Watcher...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Standalone Mode</span>
            </div>
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                title="Retry Watcher Connection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Global Summary Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-950/70 border border-zinc-800 font-mono text-[11px] text-zinc-300">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>{totalFiles} files</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-semibold">+{additions}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-rose-400 font-semibold">-{deletions}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalVerdict;

