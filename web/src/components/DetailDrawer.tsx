import React from 'react';
import {
  X,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  Terminal,
  ShieldAlert,
  Flame,
  MessageSquarePlus,
} from 'lucide-react';
import clsx from 'clsx';
import { CodeDiffNodeData } from './CodeDiffNode';
import SelectableDiffView from './SelectableDiffView';

export interface DetailDrawerProps {
  nodeData: CodeDiffNodeData | null;
  downstreamFiles: string[];
  upstreamFiles: string[];
  onClose: () => void;
  onSelectCode?: (fileName: string, snippet: string, lineRange?: string) => void;
  pinnedSnippet?: string | null;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  nodeData,
  downstreamFiles,
  upstreamFiles,
  onClose,
  onSelectCode,
  pinnedSnippet,
}) => {
  if (!nodeData) return null;

  const risk = nodeData.riskLevel || 'SAFE';

  // Airbnb badge styles matching DESIGN.md tokens
  const riskBadgeStyles = {
    CRITICAL: 'bg-[#ff385c]/10 border-[#ff385c]/40 text-rose-200',
    WARNING: 'bg-amber-500/10 border-amber-500/40 text-amber-200',
    SAFE: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200',
  }[risk];

  const handleAskAboutFile = () => {
    if (onSelectCode) {
      const targetSnippet =
        nodeData.newSnippet || nodeData.oldSnippet || `File modification in ${nodeData.fileName}`;
      onSelectCode(nodeData.fileName, targetSnippet);
    }
  };

  return (
    <aside
      aria-label="Diff Blast Radius Inspection Drawer"
      className="absolute top-0 right-0 bottom-0 w-[460px] max-w-[92vw] bg-[#121316]/95 border-l border-zinc-800 shadow-airbnb-float backdrop-blur-2xl z-30 flex flex-col transition-all duration-300 animate-in slide-in-from-right select-text"
    >
      {/* 1. Drawer Header (Airbnb Top-Nav Style) */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#141518]/80">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#ff385c]/15 border border-[#ff385c]/30 text-[#ff385c] flex items-center justify-center shrink-0">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-white tracking-tight truncate max-w-[220px]" title={nodeData.fileName}>
              {nodeData.fileName}
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 truncate max-w-[220px]">
              {nodeData.filePath}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleAskAboutFile}
            className="px-3 py-1.5 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white font-medium text-xs flex items-center space-x-1.5 shadow-airbnb-orb transition-all duration-200 active:scale-98"
            title="Ask AI about this file"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Drawer Scrollable Content (14px rounded interior cards) */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
        {/* Risk & Root Cause Header Card */}
        <div className={clsx('p-4 rounded-[14px] border space-y-2 shadow-airbnb', riskBadgeStyles)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {risk === 'CRITICAL' && <Flame className="w-4 h-4 text-[#ff385c]" />}
              {risk === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {risk === 'SAFE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span className="font-bold uppercase tracking-wider text-xs">
                {risk} RISK
              </span>
            </div>

            {nodeData.isRootCause && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff385c] text-white font-bold text-[10px] uppercase tracking-wider shadow-airbnb-orb">
                Root Cause
              </span>
            )}
          </div>

          <p className="text-zinc-100 font-medium text-xs leading-relaxed">
            {nodeData.breakReason || 'No runtime contract breakage detected.'}
          </p>
        </div>

        {/* Architectural Intent Card */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-zinc-400 px-0.5">
            <Terminal className="w-3.5 h-3.5 text-[#ff385c]" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Architectural Intent (Plain English)
            </span>
          </div>
          <p className="p-3.5 bg-zinc-900/70 rounded-[10px] border border-zinc-800 text-zinc-200 leading-relaxed font-medium shadow-sm">
            {nodeData.intentSummary || 'Modification to existing module logic.'}
          </p>
        </div>

        {/* Downstream Blast Radius */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-zinc-400 px-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#ff385c]" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Downstream Blast Radius
            </span>
            <span className="ml-auto px-2 py-0.2 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
              {downstreamFiles.length} file(s)
            </span>
          </div>

          {downstreamFiles.length > 0 ? (
            <div className="space-y-1.5">
              {downstreamFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-2.5 rounded-[8px] bg-zinc-900/60 border border-zinc-800 font-mono text-[11px] text-zinc-200 shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#ff385c] shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-3 bg-zinc-900/40 rounded-[8px] border border-zinc-800/60 text-zinc-500 italic">
              No direct downstream consumers detected in the current diff.
            </p>
          )}
        </div>

        {/* Upstream Dependencies */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-zinc-400 px-0.5">
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Imported Dependencies & Upstream Links
            </span>
            {upstreamFiles.length > 0 && (
              <span className="ml-auto px-2 py-0.2 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                {upstreamFiles.length} upstream
              </span>
            )}
          </div>

          {upstreamFiles.length > 0 && (
            <div className="space-y-1">
              {upstreamFiles.map((upFile, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-2 rounded-[8px] bg-zinc-900/60 border border-zinc-800 font-mono text-[11px] text-sky-300"
                >
                  <span className="text-zinc-500">←</span>
                  <span className="truncate">{upFile}</span>
                </div>
              ))}
            </div>
          )}

          {nodeData.imports.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {nodeData.imports.map((imp, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-sky-300 shadow-sm"
                >
                  {imp}
                </span>
              ))}
            </div>
          ) : upstreamFiles.length === 0 ? (
            <p className="p-3 bg-zinc-900/40 rounded-[8px] border border-zinc-800/60 text-zinc-500 italic">
              No imported local or external modules in added lines.
            </p>
          ) : null}
        </div>

        {/* Interactive Line-by-Line Selectable Diff */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-zinc-400 px-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Interactive Diff & AI Pinpoint
            </span>
            <span className="font-mono text-[10px] text-zinc-400">
              +{nodeData.additions} / -{nodeData.deletions} lines
            </span>
          </div>

          <SelectableDiffView
            fileName={nodeData.fileName}
            rawPatch={nodeData.rawPatch}
            onSelectCode={(fName, snippet, lineRange) => {
              if (onSelectCode) {
                onSelectCode(fName, snippet, lineRange);
              }
            }}
            selectedSnippet={pinnedSnippet}
          />
        </div>
      </div>

      {/* 3. Drawer Footer */}
      <div className="p-4 border-t border-zinc-800 bg-[#141518]/80 flex items-center justify-between">
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-emerald-400 font-semibold">+{nodeData.additions}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-[#ff385c] font-semibold">-{nodeData.deletions}</span>
          <span className="text-zinc-500 ml-1">lines changed</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-[8px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
};

export default DetailDrawer;
