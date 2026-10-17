import React from 'react';
import { Radio, Database, Lock, CheckCircle, Terminal } from 'lucide-react';
import clsx from 'clsx';

export interface PresetsBarProps {
  selectedScenarioKey: string | null;
  isWatcherConnected: boolean;
  onSelectLive: () => void;
  onSelectScenario: (key: string) => void;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({
  selectedScenarioKey,
  isWatcherConnected,
  onSelectLive,
  onSelectScenario,
}) => {
  return (
    <nav
      aria-label="Scenario Suite and Live Telemetry Bar"
      className="w-full bg-[#05070A] border-b border-[#3B3B3B] px-4 sm:px-6 py-2 flex items-center justify-between text-xs overflow-x-auto z-20 font-mono"
    >
      <div className="flex items-center space-x-2 shrink-0">
        <div className="flex items-center space-x-1.5 text-[#697271] font-bold uppercase tracking-[0.12em] text-[10px] mr-2 shrink-0">
          <Terminal className="w-3.5 h-3.5 text-[#0033A0]" />
          <span>SCENARIOS //</span>
        </div>

        {/* Live Watcher Stream Toggle */}
        <button
          type="button"
          onClick={onSelectLive}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-none border text-xs font-mono font-bold tracking-[0.08em] uppercase transition-colors shrink-0',
            selectedScenarioKey === null
              ? 'bg-[#FFFFFF] text-[#1A1A1A] border-[#FFFFFF]'
              : 'bg-transparent border-[#3B3B3B] text-[#C8CECD] hover:text-[#FFFFFF] hover:border-[#697271]'
          )}
        >
          <Radio className={clsx('w-3.5 h-3.5', selectedScenarioKey === null && 'animate-pulse text-[#D82C2C]')} />
          <span>[LIVE WATCHER]</span>
          {isWatcherConnected && (
            <span className="w-1.5 h-1.5 bg-emerald-400 inline-block ml-1 animate-ping" />
          )}
        </button>

        <div className="h-4 w-px bg-[#3B3B3B] mx-1 shrink-0" />

        {/* Scenario A: Broken Prisma Migration (Hero Scenario) */}
        <button
          type="button"
          onClick={() => onSelectScenario('scenario_a')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-none border text-xs font-mono font-bold tracking-[0.08em] uppercase transition-colors shrink-0',
            selectedScenarioKey === 'scenario_a'
              ? 'bg-[#D82C2C] text-[#FFFFFF] border-[#D82C2C]'
              : 'bg-transparent border-[#3B3B3B] text-[#C8CECD] hover:text-[#FFFFFF] hover:border-[#697271]'
          )}
        >
          <Database className="w-3.5 h-3.5" />
          <span>01 // BROKEN PRISMA (HERO)</span>
          <span
            className={clsx(
              'px-1 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider',
              selectedScenarioKey === 'scenario_a'
                ? 'bg-[#1A1A1A] text-[#FFFFFF]'
                : 'bg-[#D82C2C]/20 text-[#D82C2C] border border-[#D82C2C]/40'
            )}
          >
            CRITICAL
          </span>
        </button>

        {/* Scenario B: Auth Session Refactor */}
        <button
          type="button"
          onClick={() => onSelectScenario('scenario_b')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-none border text-xs font-mono font-bold tracking-[0.08em] uppercase transition-colors shrink-0',
            selectedScenarioKey === 'scenario_b'
              ? 'bg-[#0033A0] text-[#FFFFFF] border-[#0033A0]'
              : 'bg-transparent border-[#3B3B3B] text-[#C8CECD] hover:text-[#FFFFFF] hover:border-[#697271]'
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>02 // AUTH REFACTOR</span>
          <span
            className={clsx(
              'px-1 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider',
              selectedScenarioKey === 'scenario_b'
                ? 'bg-[#1A1A1A] text-[#FFFFFF]'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            )}
          >
            WARN
          </span>
        </button>

        {/* Scenario C: Safe Utility Add */}
        <button
          type="button"
          onClick={() => onSelectScenario('scenario_c')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-none border text-xs font-mono font-bold tracking-[0.08em] uppercase transition-colors shrink-0',
            selectedScenarioKey === 'scenario_c'
              ? 'bg-[#0033A0] text-[#FFFFFF] border-[#0033A0]'
              : 'bg-transparent border-[#3B3B3B] text-[#C8CECD] hover:text-[#FFFFFF] hover:border-[#697271]'
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>03 // SAFE UTILITY</span>
          <span
            className={clsx(
              'px-1 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider',
              selectedScenarioKey === 'scenario_c'
                ? 'bg-[#1A1A1A] text-[#FFFFFF]'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            )}
          >
            SAFE
          </span>
        </button>
      </div>

      <div className="hidden lg:flex items-center space-x-2 text-[11px] text-[#697271] font-mono tracking-wider shrink-0 pl-4">
        <span>INTERACTION // SELECT NODE TO ISOLATE BLAST RADIUS</span>
      </div>
    </nav>
  );
};

export default PresetsBar;
