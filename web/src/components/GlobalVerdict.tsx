import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  Activity,
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
  const isCritical = verdict === 'CRITICAL';
  const isWarning = verdict === 'WARNING';
  const isSafe = verdict === 'SAFE';

  return (
    <header
      className={clsx(
        'w-full bg-[#1A1A1A] border-b border-[#3B3B3B] z-30 sticky top-0 transition-colors',
        isCritical && 'border-b-2 border-b-[#D82C2C]',
        isWarning && 'border-b-2 border-b-amber-500',
        isSafe && 'border-b-2 border-b-[#0033A0]'
      )}
    >
      <div className="w-full px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* 1. Brand & System Status Stamp */}
        <div className="flex items-center space-x-4 min-w-0">
          {/* Institutional Title */}
          <div className="flex items-center space-x-2 shrink-0 border-r border-[#3B3B3B] pr-4">
            <span className="font-sans font-bold text-base sm:text-lg tracking-[-0.05em] text-[#FFFFFF]">
              DIDIT<span className="text-[#D82C2C]">BREAK</span>
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 bg-[#05070A] border border-[#3B3B3B] text-[#C8CECD]">
              v2.4 // TELEMETRY
            </span>
          </div>

          {/* Status Indicator Stamp */}
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={clsx(
                'flex items-center space-x-2 px-2.5 py-1 rounded-none border text-xs font-mono font-bold tracking-[0.08em] uppercase shrink-0',
                isCritical && 'bg-[#D82C2C]/10 border-[#D82C2C] text-[#D82C2C]',
                isWarning && 'bg-amber-500/10 border-amber-500 text-amber-400',
                isSafe && 'bg-[#0033A0]/20 border-[#0033A0] text-[#FFFFFF]'
              )}
            >
              {isCritical && <AlertCircle className="w-3.5 h-3.5 animate-pulse text-[#D82C2C]" />}
              {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              {isSafe && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}

              <span>
                {isCritical
                  ? 'SYSTEM STATUS // 🔴 CRITICAL FAILURE'
                  : isWarning
                  ? 'SYSTEM STATUS // 🟡 SIGNATURE WARNING'
                  : 'SYSTEM STATUS // 🟢 VERIFIED SAFE'}
              </span>
            </div>

            {/* Context headline */}
            <div className="hidden md:flex items-center space-x-2 font-mono text-xs text-[#C8CECD] truncate">
              <span className="text-[#697271]">//</span>
              <span className="truncate">
                {isCritical && `BREACH IN [${criticalFile || 'CORE_MODULE'}] — CONTRACT SEVERED`}
                {isWarning && `${warningCount || 1} STRUCTURAL SHIFT(S) REQUIRE AUDIT`}
                {isSafe && 'ALL TOPOLOGICAL NODES VERIFIED NON-BREAKING'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Institutional Telemetry & Repository Selector */}
        <div className="flex items-center space-x-3 font-mono text-xs shrink-0">
          {/* Working Tree Telemetry Tag */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-[#05070A] border border-[#3B3B3B] text-[11px] text-[#C8CECD]">
            <Activity className="w-3.5 h-3.5 text-[#0033A0]" />
            <span className="text-[#697271]">TREE //</span>
            <span>{totalFiles} FILES</span>
            <span className="text-[#3B3B3B]">|</span>
            <span className="text-emerald-400 font-bold">+{additions}</span>
            <span className="text-[#697271]">/</span>
            <span className="text-[#D82C2C] font-bold">-{deletions}</span>
          </div>

          {/* Directory Selector Tag */}
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

          {/* Watcher IPC Connection Stamp */}
          {isConnected ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#05070A] border border-[#0033A0] text-emerald-400 text-[11px] font-bold tracking-[0.08em] uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-400 inline-block animate-ping" />
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">IPC // 8080 ACTIVE</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#05070A] border border-amber-500/80 text-amber-400 text-[11px] font-bold tracking-[0.08em] uppercase">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>CONNECTING...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#05070A] border border-[#3B3B3B] text-[#697271] text-[11px] font-bold tracking-[0.08em] uppercase">
                <span className="w-1.5 h-1.5 bg-[#D82C2C] inline-block" />
                <span>STANDALONE</span>
              </div>
              {onReconnect && (
                <button
                  type="button"
                  onClick={onReconnect}
                  className="p-1 bg-[#05070A] border border-[#3B3B3B] text-[#C8CECD] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors"
                  title="RETRY IPC LINK"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default GlobalVerdict;
