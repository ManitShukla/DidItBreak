import React, { useState, useEffect, useRef } from 'react';
import {
  FolderGit2,
  X,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  HardDrive,
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

  const displayName = repoName || (activePath ? activePath.split(/[/\\]/).pop() : '') || 'SELECT REPO';

  return (
    <>
      {/* 1. Collapsed Tag mounted in top HUD (Sharp rectangular Swiss notation) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1 bg-[#05070A] border border-[#3B3B3B] hover:border-[#C8CECD] text-[#C8CECD] hover:text-[#FFFFFF] transition-colors group text-xs font-mono shrink-0 max-w-[280px] sm:max-w-[360px]"
        title={activePath ? `Active Repository: ${activePath}\nClick to switch directory` : 'Select target Git repository'}
      >
        <FolderGit2 className="w-3.5 h-3.5 text-[#0033A0] group-hover:text-[#FFFFFF] shrink-0" />
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-[#697271] uppercase tracking-wider text-[10px]">REPO //</span>
          <span className="font-bold text-[#FFFFFF] truncate max-w-[120px] sm:max-w-[170px] uppercase">
            {displayName}
          </span>
        </div>
        <div className="ml-auto pl-1 border-l border-[#3B3B3B]">
          <span className="text-[10px] tracking-wider text-[#697271] group-hover:text-[#FFFFFF] flex items-center gap-0.5">
            SWITCH [↵]
          </span>
        </div>
      </button>

      {/* 2. Modal Dialog (Sharp rectangular Swiss panel) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/85 backdrop-blur-none animate-in fade-in duration-100"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#1A1A1A] border-2 border-[#3B3B3B] rounded-none shadow-none overflow-hidden flex flex-col text-[#FFFFFF] animate-in zoom-in-95 duration-100 font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-[#3B3B3B] flex items-center justify-between bg-[#05070A]">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-[#1A1A1A] border border-[#3B3B3B] text-[#0033A0]">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#FFFFFF] tracking-[0.1em] uppercase">
                    DIRECTORY SELECTOR // TARGET FILESYSTEM
                  </h3>
                  <p className="text-[10px] text-[#697271] tracking-wider">
                    REBIND LOCAL WATCHER DAEMON TO AN ACTIVE GIT REPOSITORY
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 border border-[#3B3B3B] text-[#697271] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Active Repository Card */}
              {activePath && (
                <div className="p-3 bg-[#05070A] border border-[#3B3B3B] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#697271] tracking-wider">
                    <span className="flex items-center gap-1.5 font-bold uppercase">
                      <HardDrive className="w-3.5 h-3.5 text-[#0033A0]" />
                      ACTIVE REPOSITORY PATH:
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#0033A0]/30 border border-[#0033A0] text-emerald-400 font-bold uppercase text-[9px]">
                      MONITORED
                    </span>
                  </div>
                  <p className="font-mono text-[#C8CECD] text-xs break-all bg-[#1A1A1A] p-2 border border-[#3B3B3B]">
                    {activePath}
                  </p>
                </div>
              )}

              {/* Path Input Field */}
              <div className="space-y-1.5">
                <label htmlFor="repo-path-input" className="block text-xs font-bold text-[#C8CECD] uppercase tracking-wider">
                  ABSOLUTE TARGET PATH
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
                    placeholder="e.g. C:\Projects\repo or /home/user/code/repo"
                    className="w-full h-10 px-3 pr-8 bg-[#05070A] border border-[#3B3B3B] focus:border-[#D82C2C] focus:outline-none text-[#FFFFFF] placeholder-[#697271] font-mono text-xs rounded-none transition-colors"
                  />
                  {inputPath && (
                    <button
                      type="button"
                      onClick={() => setInputPath('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#697271] hover:text-[#FFFFFF]"
                      title="Clear path"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#697271] tracking-wide">
                  Target directory must exist on disk and contain an initialized <code className="text-[#C8CECD]">.git</code> repository.
                </p>
              </div>

              {/* Quick Preset Shortcuts */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-[#697271] uppercase tracking-[0.1em] block">
                  DIRECTORY SHORTCUTS //
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetClick('.')}
                    className="px-2.5 py-1 bg-[#05070A] border border-[#3B3B3B] hover:border-[#FFFFFF] font-mono text-[10px] text-[#C8CECD] hover:text-[#FFFFFF] transition-colors"
                  >
                    <span>DAEMON ROOT (.)</span>
                  </button>
                  {activePath && (
                    <button
                      type="button"
                      onClick={() => handlePresetClick(activePath)}
                      className="px-2.5 py-1 bg-[#05070A] border border-[#3B3B3B] hover:border-[#FFFFFF] font-mono text-[10px] text-[#C8CECD] hover:text-[#FFFFFF] transition-colors"
                    >
                      <span>ACTIVE TARGET</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              {localError && (
                <div className="p-3 bg-[#D82C2C]/10 border border-[#D82C2C] text-[#D82C2C] flex items-start space-x-2 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D82C2C]" />
                  <div className="min-w-0">
                    <span className="font-bold text-[10px] uppercase tracking-wider block">
                      REBIND REJECTED
                    </span>
                    <p className="text-xs text-[#FFFFFF] mt-0.5 font-mono">
                      {localError}
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#3B3B3B] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-[#05070A] hover:bg-[#1A1A1A] border border-[#3B3B3B] text-xs font-mono font-bold uppercase text-[#C8CECD] hover:text-[#FFFFFF] transition-colors"
                >
                  CANCEL [ESC]
                </button>

                <button
                  type="submit"
                  disabled={isChanging || !isConnected}
                  className={clsx(
                    'flex items-center space-x-2 px-5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors',
                    isChanging || !isConnected
                      ? 'bg-[#1A1A1A] text-[#697271] cursor-not-allowed border border-[#3B3B3B]'
                      : 'bg-[#D82C2C] hover:bg-[#D82C2C]/90 text-[#FFFFFF] border border-[#D82C2C]'
                  )}
                >
                  {isChanging ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>REBINDING...</span>
                    </>
                  ) : (
                    <>
                      <span>APPLY & WATCH</span>
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
