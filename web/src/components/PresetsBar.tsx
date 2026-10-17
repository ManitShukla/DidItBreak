import React from 'react';
import { Radio, Database, Lock, CheckCircle, Sparkles, Compass } from 'lucide-react';
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
      aria-label="Demo Scenarios and Live Stream Switcher"
      className="w-full bg-[#121316]/90 border-b border-zinc-800/80 px-4 sm:px-6 py-2 flex items-center justify-between text-xs overflow-x-auto z-20 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="flex items-center space-x-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] mr-1 shrink-0">
          <Compass className="w-3.5 h-3.5 text-[#ff385c]" />
          <span>Demo Suite:</span>
        </div>

        {/* Live Watcher Stream Toggle Pill (Airbnb Button Pill) */}
        <button
          type="button"
          onClick={onSelectLive}
          className={clsx(
            'flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 shrink-0 shadow-airbnb',
            selectedScenarioKey === null
              ? 'bg-[#ff385c] border-[#ff385c] text-white shadow-airbnb-orb font-semibold'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80'
          )}
        >
          <Radio className={clsx('w-3.5 h-3.5', selectedScenarioKey === null && 'animate-pulse')} />
          <span>Live Watcher Stream</span>
          {isWatcherConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5 animate-ping" />
          )}
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0" />

        {/* Scenario A: Broken Prisma Migration (Hero Scenario) */}
        <button
          type="button"
          onClick={() => onSelectScenario('scenario_a')}
          className={clsx(
            'flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 shrink-0 shadow-airbnb',
            selectedScenarioKey === 'scenario_a'
              ? 'bg-[#ff385c]/15 border-[#ff385c] text-[#ff385c] ring-1 ring-[#ff385c]/30 font-semibold'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80'
          )}
        >
          <Database className="w-3.5 h-3.5 text-[#ff385c]" />
          <span>Scenario A: Broken Prisma</span>
          <span className="px-2 py-0.2 rounded-full text-[9px] bg-[#ff385c]/20 text-[#ff385c] border border-[#ff385c]/40 uppercase font-bold tracking-wider">
            Hero
          </span>
        </button>

        {/* Scenario B: Auth Session Refactor */}
        <button
          type="button"
          onClick={() => onSelectScenario('scenario_b')}
          className={clsx(
            'flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 shrink-0 shadow-airbnb',
            selectedScenarioKey === 'scenario_b'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/30 font-semibold'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80'
          )}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Scenario B: Auth Refactor</span>
          <span className="px-2 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold tracking-wider">
            Warning
          </span>
        </button>

        {/* Scenario C: Safe Utility Add */}
        <button
          type="button"
          onClick={() => onSelectScenario('scenario_c')}
          className={clsx(
            'flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 shrink-0 shadow-airbnb',
            selectedScenarioKey === 'scenario_c'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30 font-semibold'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80'
          )}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scenario C: Safe Utility</span>
          <span className="px-2 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold tracking-wider">
            Safe
          </span>
        </button>
      </div>

      <div className="hidden lg:flex items-center space-x-2 text-[11px] text-zinc-400 shrink-0 pl-4 font-sans">
        <Sparkles className="w-3 h-3 text-[#ff385c]" />
        <span>Click any node to isolate topological blast radius</span>
      </div>
    </nav>
  );
};

export default PresetsBar;
