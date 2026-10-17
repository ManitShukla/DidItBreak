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
} from 'lucide-react';
import clsx from 'clsx';
import { CodeDiffNodeData } from './CodeDiffNode';

export interface DetailDrawerProps {
  nodeData: CodeDiffNodeData | null;
  downstreamFiles: string[];
  upstreamFiles: string[];
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  nodeData,
  downstreamFiles,
  upstreamFiles,
  onClose,
}) => {
  if (!nodeData) return null;

  const risk = nodeData.riskLevel || 'SAFE';

  const riskBadgeStyles = {
    CRITICAL: 'bg-rose-950/80 border-rose-600 text-rose-300',
    WARNING: 'bg-amber-950/80 border-amber-600 text-amber-300',
    SAFE: 'bg-emerald-950/80 border-emerald-600 text-emerald-300',
  }[risk];

  return (
    <aside
      aria-label="Diff Blast Radius Inspection Drawer"
      className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-zinc-950/95 border-l border-zinc-800 shadow-2xl backdrop-blur-2xl z-30 flex flex-col transition-all duration-300 animate-in slide-in-from-right select-text"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-rose-500">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white truncate max-w-[240px]" title={nodeData.fileName}>
              {nodeData.fileName}
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 truncate max-w-[240px]">
              {nodeData.filePath}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Close Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="p-5 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
        {/* Risk & Root Cause Header */}
        <div className={clsx('p-3.5 rounded-xl border space-y-2', riskBadgeStyles)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {risk === 'CRITICAL' && <Flame className="w-5 h-5 text-rose-400" />}
              {risk === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {risk === 'SAFE' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              <span className="font-extrabold uppercase tracking-wider text-xs">
                {risk} RISK
              </span>
            </div>

            {nodeData.isRootCause && (
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow">
                Root Cause
              </span>
            )}
          </div>

          <p className="text-zinc-100 font-semibold text-xs leading-relaxed">
            {nodeData.breakReason || 'No runtime breakage detected.'}
          </p>
        </div>

        {/* Architectural Intent */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Architectural Intent (Plain English)
            </span>
          </div>
          <p className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-zinc-200 leading-relaxed font-medium">
            {nodeData.intentSummary || 'Modification to existing module logic.'}
          </p>
        </div>

        {/* Downstream Blast Radius (Files that depend on this node) */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Downstream Blast Radius
            </span>
            <span className="ml-auto px-1.5 py-0.2 rounded-full bg-zinc-900 text-[10px] font-mono text-zinc-300">
              {downstreamFiles.length} file(s)
            </span>
          </div>

          {downstreamFiles.length > 0 ? (
            <div className="space-y-1.5">
              {downstreamFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 font-mono text-[11px] text-zinc-200"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 text-zinc-500 italic">
              No direct downstream consumers detected in the current diff.
            </p>
          )}
        </div>

        {/* Upstream Dependencies */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Imported Dependencies & Upstream Links
            </span>
            {upstreamFiles.length > 0 && (
              <span className="ml-auto px-1.5 py-0.2 rounded-full bg-zinc-900 text-[10px] font-mono text-zinc-300">
                {upstreamFiles.length} upstream
              </span>
            )}
          </div>

          {upstreamFiles.length > 0 && (
            <div className="space-y-1">
              {upstreamFiles.map((upFile, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 font-mono text-[11px] text-sky-300"
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
                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-sky-300"
                >
                  {imp}
                </span>
              ))}
            </div>
          ) : upstreamFiles.length === 0 ? (
            <p className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 text-zinc-500 italic">
              No imported local or external modules in added lines.
            </p>
          ) : null}
        </div>

        {/* Raw Git Diff Patch */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Raw Git Diff Patch
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              +{nodeData.additions} / -{nodeData.deletions}
            </span>
          </div>
          <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-64 leading-snug">
            {nodeData.rawPatch}
          </pre>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-emerald-400 font-semibold">+{nodeData.additions}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-rose-400 font-semibold">-{nodeData.deletions}</span>
          <span className="text-zinc-500 ml-1">lines changed</span>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
};

export default DetailDrawer;
