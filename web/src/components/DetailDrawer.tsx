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

  // Swiss severity styles
  const riskBadgeStyles = {
    CRITICAL: 'bg-[#D82C2C]/10 border-[#D82C2C] text-[#D82C2C]',
    WARNING: 'bg-amber-500/10 border-amber-500 text-amber-400',
    SAFE: 'bg-[#0033A0]/20 border-[#0033A0] text-emerald-400',
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
      className="absolute top-0 right-0 bottom-0 w-[480px] max-w-[95vw] bg-[#1A1A1A] border-l border-[#3B3B3B] z-30 flex flex-col select-text font-mono transition-transform duration-200 animate-in slide-in-from-right"
    >
      {/* 2px Accent Rule at Top */}
      <div
        className={clsx(
          'h-[2px] w-full shrink-0',
          risk === 'CRITICAL' && 'bg-[#D82C2C]',
          risk === 'WARNING' && 'bg-amber-500',
          risk === 'SAFE' && 'bg-[#0033A0]'
        )}
      />

      {/* 1. Drawer Header */}
      <div className="p-4 border-b border-[#3B3B3B] flex items-center justify-between bg-[#05070A]">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-1.5 bg-[#1A1A1A] border border-[#3B3B3B] text-[#D82C2C]">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-[#697271] uppercase tracking-[0.12em] font-bold">
              INSPECTION // BLAST RADIUS
            </div>
            <h3 className="font-sans font-bold text-sm text-[#FFFFFF] tracking-[-0.03em] truncate max-w-[240px]" title={nodeData.fileName}>
              {nodeData.fileName}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleAskAboutFile}
            className="px-3 py-1.5 bg-[#D82C2C] hover:bg-[#D82C2C]/90 text-[#FFFFFF] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
            title="Ask AI about this file"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ASK AI</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#1A1A1A] border border-[#3B3B3B] text-[#697271] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Technical Definition-List Content */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Risk & Root Cause Header */}
        <div className={clsx('p-3.5 border space-y-2', riskBadgeStyles)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {risk === 'CRITICAL' && <Flame className="w-4 h-4 text-[#D82C2C]" />}
              {risk === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {risk === 'SAFE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span className="font-bold uppercase tracking-[0.1em] text-xs">
                {risk} RISK // EVALUATION
              </span>
            </div>

            {nodeData.isRootCause && (
              <span className="px-2 py-0.5 bg-[#D82C2C] text-[#FFFFFF] font-bold text-[9px] uppercase tracking-wider">
                ROOT CAUSE
              </span>
            )}
          </div>

          <p className="font-sans font-medium text-xs text-[#FFFFFF] leading-relaxed">
            {nodeData.breakReason || 'No runtime contract breakage detected.'}
          </p>
        </div>

        {/* Technical Definition List */}
        <div className="bg-[#05070A] border border-[#3B3B3B] divide-y divide-[#3B3B3B]">
          {/* File Path */}
          <div className="p-3 flex items-start justify-between gap-2">
            <span className="text-[#697271] uppercase tracking-wider text-[10px] shrink-0">
              PATH //
            </span>
            <span className="font-mono text-right text-[#C8CECD] break-all text-xs">
              {nodeData.filePath}
            </span>
          </div>

          {/* Architectural Intent */}
          <div className="p-3 space-y-1">
            <div className="flex items-center space-x-1.5 text-[#697271] text-[10px] uppercase tracking-wider font-bold">
              <Terminal className="w-3.5 h-3.5 text-[#0033A0]" />
              <span>ARCHITECTURAL INTENT //</span>
            </div>
            <p className="font-sans text-xs text-[#FFFFFF] leading-relaxed font-medium">
              {nodeData.intentSummary || 'Modification to existing module logic.'}
            </p>
          </div>

          {/* Downstream Blast Radius */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-[#697271]">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#D82C2C]" />
                <span>DOWNSTREAM BLAST RADIUS //</span>
              </div>
              <span className="text-[#FFFFFF]">{downstreamFiles.length} AFFECTED</span>
            </div>

            {downstreamFiles.length > 0 ? (
              <div className="space-y-1">
                {downstreamFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-1.5 bg-[#1A1A1A] border border-[#3B3B3B] font-mono text-[11px] text-[#FFFFFF]"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D82C2C] shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#697271] italic text-[11px]">
                NO DIRECT DOWNSTREAM CONSUMERS IN ACTIVE DIFF.
              </p>
            )}
          </div>

          {/* Upstream Dependencies */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-[#697271]">
              <div className="flex items-center space-x-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#0033A0]" />
                <span>IMPORTED DEPENDENCIES //</span>
              </div>
              <span className="text-[#FFFFFF]">{upstreamFiles.length} UPSTREAM</span>
            </div>

            {upstreamFiles.length > 0 && (
              <div className="space-y-1">
                {upstreamFiles.map((upFile, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-1.5 bg-[#1A1A1A] border border-[#3B3B3B] font-mono text-[11px] text-[#0033A0]"
                  >
                    <span className="text-[#697271]">←</span>
                    <span className="truncate text-[#C8CECD]">{upFile}</span>
                  </div>
                ))}
              </div>
            )}

            {nodeData.imports.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {nodeData.imports.map((imp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#1A1A1A] border border-[#3B3B3B] font-mono text-[10px] text-[#C8CECD]"
                  >
                    {imp}
                  </span>
                ))}
              </div>
            ) : upstreamFiles.length === 0 ? (
              <p className="text-[#697271] italic text-[11px]">
                NO IMPORTED MODULES DETECTED.
              </p>
            ) : null}
          </div>
        </div>

        {/* Interactive Diff Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#697271] font-bold">
            <span>DIFF HUNKS // PINPOINT INSPECTION</span>
            <span>+{nodeData.additions} / -{nodeData.deletions}</span>
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
      <div className="p-3 border-t border-[#3B3B3B] bg-[#05070A] flex items-center justify-between font-mono text-xs">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-emerald-400 font-bold">+{nodeData.additions}</span>
          <span className="text-[#3B3B3B]">/</span>
          <span className="text-[#D82C2C] font-bold">-{nodeData.deletions}</span>
          <span className="text-[#697271]">LINES CHANGED</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#3B3B3B] border border-[#3B3B3B] text-xs font-bold text-[#FFFFFF] uppercase tracking-wider transition-colors"
        >
          DISMISS [ESC]
        </button>
      </div>
    </aside>
  );
};

export default DetailDrawer;
