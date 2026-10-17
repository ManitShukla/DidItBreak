import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import DirectorySelector from './DirectorySelector';

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
  // Directory Selector props
  activePath?: string;
  repoName?: string;
  isChangingDirectory?: boolean;
  directoryError?: string | null;
  onSelectDirectory?: (path: string) => void;
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
  activePath,
  repoName,
  isChangingDirectory,
  directoryError,
  onSelectDirectory,
}) => {
  // Airbnb design token alignments
  const isCritical = verdict === 'CRITICAL';
  const isWarning = verdict === 'WARNING';
  const isSafe = verdict === 'SAFE';

  return (
    <header className="w-full bg-[#101114]/95 border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 sm:py-3 transition-colors duration-300 z-30 sticky top-0 backdrop-blur-md shadow-airbnb">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1720px] mx-auto">
        {/* 1. Left Brand Identity (Airbnb-inspired typography & Rausch voltage) */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-airbnb-orb transition-transform duration-200 hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-white">
                  DidIt<span className="text-[#ff385c]">Break</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-widest uppercase bg-[#ff385c]/15 text-[#ff385c] border border-[#ff385c]/30">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 hidden sm:block">
                Blast-Radius & Intent Visualizer
              </span>
            </div>
          </div>
        </div>

        {/* 2. Center Piece: Search-Bar-Pill Architecture (Unified System Verdict) */}
        <div className="order-3 xl:order-2 w-full xl:w-auto flex-1 max-w-3xl flex justify-center">
          <div
            className={clsx(
              'w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-1.5 rounded-full border shadow-airbnb transition-all duration-300 text-xs font-medium',
              isCritical && 'bg-[#181013] border-[#ff385c]/50 text-rose-100 ring-1 ring-[#ff385c]/30',
              isWarning && 'bg-[#18140e] border-amber-500/50 text-amber-100 ring-1 ring-amber-500/30',
              isSafe && 'bg-[#0e1613] border-emerald-500/50 text-emerald-100 ring-1 ring-emerald-500/30'
            )}
          >
            {/* Segment A: Status Capsule */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                {isCritical && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff385c] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff385c]" />
                  </>
                )}
                {isWarning && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </>
                )}
                {isSafe && (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                )}
              </span>

              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]',
                  isCritical && 'bg-[#ff385c] text-white',
                  isWarning && 'bg-amber-500 text-zinc-950 font-extrabold',
                  isSafe && 'bg-emerald-500 text-zinc-950 font-extrabold'
                )}
              >
                {isCritical ? 'SYSTEM BROKEN' : isWarning ? 'CAUTION' : 'CLEAN & SAFE'}
              </span>
            </div>

            {/* Hairline Divider */}
            <div className="hidden sm:block h-3.5 w-px bg-zinc-700/50 shrink-0" />

            {/* Segment B: Impact Summary Headline */}
            <div className="min-w-0 truncate text-left">
              <span className="text-zinc-200 font-medium text-xs sm:text-[13px] tracking-tight">
                {isCritical &&
                  `Critical breakage in [${criticalFile || 'core module'}]`}
                {isWarning &&
                  `${warningCount || 1} contract modification(s) require verification`}
                {isSafe &&
                  'All architectural contracts verified non-breaking'}
              </span>
            </div>

            {/* Hairline Divider */}
            <div className="hidden md:block h-3.5 w-px bg-zinc-700/50 shrink-0" />

            {/* Segment C: Terminal Action / Metrics Pill */}
            <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-zinc-300 shrink-0 pl-1">
              <span className="text-zinc-400 font-sans">{totalFiles} files</span>
              <span className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-semibold">+{additions}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-[#ff385c] font-semibold">-{deletions}</span>
            </div>

            {/* Terminal Orb Icon */}
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white transition-transform',
                isCritical && 'bg-[#ff385c] shadow-sm',
                isWarning && 'bg-amber-500 text-zinc-950',
                isSafe && 'bg-emerald-500 text-zinc-950'
              )}
            >
              {isCritical && <AlertCircle className="w-4 h-4 animate-pulse" />}
              {isWarning && <AlertTriangle className="w-4 h-4" />}
              {isSafe && <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* 3. Right Tools: Repository Selector & Watcher Connection Pill */}
        <div className="order-2 xl:order-3 flex items-center space-x-2.5 text-xs shrink-0">
          {/* Active Repository Switcher Pill */}
          {onSelectDirectory && (
            <DirectorySelector
              activePath={activePath || ''}
              repoName={repoName || ''}
              isConnected={isConnected}
              isChanging={Boolean(isChangingDirectory)}
              directoryError={directoryError || null}
              onSelectDirectory={onSelectDirectory}
            />
          )}

          {/* Watcher Daemon Connection Status Pill */}
          {isConnected ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium shadow-airbnb">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <Radio className="w-3.5 h-3.5 ml-0.5 text-emerald-400" />
              <span className="hidden sm:inline font-sans text-xs">Live Watcher</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="font-sans text-xs">Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-medium shadow-airbnb">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="font-sans text-xs">Offline / Demo</span>
              </div>
              {onReconnect && (
                <button
                  onClick={onReconnect}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                  title="Retry Watcher Connection"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Global Summary Metric (Large Screens) */}
          <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 font-mono text-[11px] text-zinc-300 shadow-airbnb">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>{totalFiles} files</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400 font-semibold">+{additions}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-[#ff385c] font-semibold">-{deletions}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalVerdict;
