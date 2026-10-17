import React from 'react';
import { Radio, Database, Lock, CheckCircle, Sparkles } from 'lucide-react';
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
    <div className="w-full bg-zinc-950/80 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto z-15 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] mr-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Demo Controls:</span>
        </div>

        {/* Live Watcher Stream Toggle */}
        <button
          onClick={onSelectLive}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 shrink-0',
            selectedScenarioKey === null
              ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30 font-semibold'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
          )}
        >
          <Radio className={clsx('w-3.5 h-3.5', selectedScenarioKey === null && 'animate-pulse')} />
          <span>Live Watcher Stream</span>
          {isWatcherConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-1 animate-ping" />
          )}
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0" />

        {/* Scenario A: Broken Prisma Migration */}
        <button
          onClick={() => onSelectScenario('scenario_a')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 shrink-0',
            selectedScenarioKey === 'scenario_a'
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm ring-1 ring-rose-500 font-semibold'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
          )}
        >
          <Database className="w-3.5 h-3.5 text-rose-400" />
          <span>Scenario A: Broken Prisma</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase font-bold">
            Hero
          </span>
        </button>

        {/* Scenario B: Auth Session Refactor */}
        <button
          onClick={() => onSelectScenario('scenario_b')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 shrink-0',
            selectedScenarioKey === 'scenario_b'
              ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-sm ring-1 ring-amber-500 font-semibold'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
          )}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Scenario B: Auth Refactor</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase font-bold">
            Warning
          </span>
        </button>

        {/* Scenario C: Safe Utility Add */}
        <button
          onClick={() => onSelectScenario('scenario_c')}
          className={clsx(
            'flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 shrink-0',
            selectedScenarioKey === 'scenario_c'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm ring-1 ring-emerald-500 font-semibold'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
          )}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scenario C: Safe Utility</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
            Safe
          </span>
        </button>
      </div>

      <div className="hidden lg:flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
        <span>Click node to isolate blast radius</span>
      </div>
    </div>
  );
};

export default PresetsBar;
