import React, { useState, useEffect, useRef } from 'react';
import {
  FolderGit2,
  ChevronDown,
  X,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

export interface DirectorySelectorProps {
  activePath: string;
  repoName: string;
  isConnected: boolean;
  isChanging: boolean;
  directoryError: string | null;
  onSelectDirectory: (path: string) => void;
}

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  activePath,
  repoName,
  isConnected,
  isChanging,
  directoryError,
  onSelectDirectory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPath, setInputPath] = useState(activePath || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync active path with input when activePath changes
  useEffect(() => {
    if (activePath) {
      setInputPath(activePath);
    }
  }, [activePath]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Sync incoming directory error
  useEffect(() => {
    if (directoryError) {
      setLocalError(directoryError);
    }
  }, [directoryError]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputPath.trim();
    if (!trimmed) {
      setLocalError('Please enter an absolute path.');
      return;
    }
    if (!isConnected) {
      setLocalError('Watcher daemon is offline. Ensure "node watcher.js" is running on port 8080.');
      return;
    }
    setLocalError(null);
    onSelectDirectory(trimmed);
  };

  const handlePresetClick = (presetPath: string) => {
    setInputPath(presetPath);
    setLocalError(null);
    if (isConnected) {
      onSelectDirectory(presetPath);
    }
  };

  const displayName = repoName || (activePath ? activePath.split(/[/\\]/).pop() : '') || 'Select Repository';

  return (
    <>
      {/* 1. Collapsed Pill mounted in top nav (Airbnb Pill Button Aesthetic) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all duration-200 group text-xs font-medium shrink-0 max-w-[260px] sm:max-w-[340px] shadow-airbnb"
        title={activePath ? `Active Repository: ${activePath}\nClick to switch directory` : 'Select target Git repository'}
      >
        <div className="w-5 h-5 rounded-full bg-[#ff385c]/15 text-[#ff385c] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FolderGit2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[190px]">
              {displayName}
            </span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline font-mono">
              (Git)
            </span>
          </div>
          {activePath && (
            <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[140px] sm:max-w-[190px]">
              {activePath}
            </span>
          )}
        </div>
        <div className="ml-auto pl-1">
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-300 group-hover:text-white group-hover:bg-zinc-700 transition-colors flex items-center gap-0.5 font-medium">
            Switch
            <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-white" />
          </span>
        </div>
      </button>

      {/* 2. Modal Dialog (Airbnb Modal Scrim & 14px Card Architecture) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#141417] border border-zinc-800 rounded-[14px] shadow-airbnb-float overflow-hidden flex flex-col text-zinc-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#111215]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#ff385c]/15 border border-[#ff385c]/30 text-[#ff385c] flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Switch Target Repository
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Point the local watcher daemon to any Git repository on your filesystem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Active Repository Card */}
              {activePath && (
                <div className="p-3.5 rounded-[10px] bg-zinc-900/60 border border-zinc-800 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                      Currently Watching:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Active
                    </span>
                  </div>
                  <p className="font-mono text-zinc-200 text-xs break-all bg-zinc-950 p-2.5 rounded-[8px] border border-zinc-800/80">
                    {activePath}
                  </p>
                </div>
              )}

              {/* Path Input Field (Airbnb text-input specification: 52px height, 8px radius) */}
              <div className="space-y-1.5">
                <label htmlFor="repo-path-input" className="block text-xs font-semibold text-zinc-200">
                  Absolute Directory Path
                </label>
                <div className="relative">
                  <input
                    id="repo-path-input"
                    ref={inputRef}
                    type="text"
                    value={inputPath}
                    onChange={(e) => {
                      setInputPath(e.target.value);
                      if (localError) setLocalError(null);
                    }}
                    placeholder="e.g. C:\Users\Projects\my-app or /home/user/code/my-app"
                    className="w-full h-[52px] px-3.5 pr-10 rounded-[8px] bg-zinc-950 border border-zinc-800 focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] text-zinc-100 placeholder-zinc-600 font-mono text-xs outline-none transition-all shadow-inner"
                  />
                  {inputPath && (
                    <button
                      type="button"
                      onClick={() => setInputPath('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 rounded"
                      title="Clear path"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Target directory must exist on disk and contain an initialized <code className="text-zinc-300 bg-zinc-900 px-1 py-0.2 rounded font-mono">.git</code> folder.
                </p>
              </div>

              {/* Quick Preset Shortcuts */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Quick Shortcuts
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetClick('.')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 font-mono text-[11px] text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>Daemon Root (.)</span>
                  </button>
                  {activePath && (
                    <button
                      type="button"
                      onClick={() => handlePresetClick(activePath)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 font-mono text-[11px] text-zinc-300 hover:text-white transition-colors"
                    >
                      <span>Active Path</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              {localError && (
                <div className="p-3.5 rounded-[10px] bg-rose-950/60 border border-rose-800/80 text-rose-300 flex items-start space-x-2.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 text-[#ff385c] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-[11px] block uppercase tracking-wider text-rose-300">
                      Directory Switch Rejected
                    </span>
                    <p className="text-xs text-rose-200 mt-0.5 font-medium leading-relaxed">
                      {localError}
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Actions (Airbnb Button Primary & Secondary tokens) */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-[8px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isChanging || !isConnected}
                  className={clsx(
                    'flex items-center space-x-2 px-5 py-2.5 rounded-[8px] text-xs font-semibold transition-all shadow-airbnb',
                    isChanging || !isConnected
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-[#ff385c] hover:bg-[#e00b41] text-white shadow-airbnb-orb active:scale-98'
                  )}
                >
                  {isChanging ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rebinding Watcher...</span>
                    </>
                  ) : (
                    <>
                      <span>Apply & Watch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DirectorySelector;
