import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { FileCode, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import clsx from 'clsx';
import { ParsedFileDiff } from '../services/diffParser';

export interface CodeDiffNodeData extends ParsedFileDiff, Record<string, unknown> {
  riskLevel?: 'CRITICAL' | 'WARNING' | 'SAFE';
  breakReason?: string;
  intentSummary?: string;
  isRootCause?: boolean;
  isDimmed?: boolean;
}

export type CodeDiffNodeType = Node<CodeDiffNodeData, 'codeDiffNode'>;

export const CodeDiffNode: React.FC<NodeProps<CodeDiffNodeType>> = memo((props) => {
  const data = props.data;
  const risk = data.riskLevel || (data.deletions > 0 && data.additions > 0 ? 'CRITICAL' : 'SAFE');
  const isSelected = props.selected;

  const riskStyles = {
    CRITICAL: {
      border: 'border-rose-500',
      glow: 'shadow-[0_0_25px_-5px_rgba(244,63,94,0.4)] shadow-rose-500/20',
      badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-500/50',
      badgeText: 'text-rose-200',
      icon: Flame,
      headerBg: 'bg-rose-950/20',
    },
    WARNING: {
      border: 'border-amber-500',
      glow: 'shadow-[0_0_25px_-5px_rgba(245,158,11,0.35)]',
      badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-500/50',
      badgeText: 'text-amber-200',
      icon: AlertTriangle,
      headerBg: 'bg-amber-950/20',
    },
    SAFE: {
      border: 'border-emerald-500',
      glow: 'shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]',
      badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50',
      badgeText: 'text-emerald-200',
      icon: CheckCircle2,
      headerBg: 'bg-emerald-950/20',
    },
  }[risk];

  const RiskIcon = riskStyles.icon;

  return (
    <div
      className={clsx(
        'w-[340px] rounded-xl border-2 bg-zinc-900/95 text-zinc-100 shadow-xl transition-all duration-300 backdrop-blur-md relative cursor-pointer',
        riskStyles.border,
        riskStyles.glow,
        isSelected
          ? 'ring-4 ring-rose-500/60 scale-[1.03] z-30 shadow-2xl shadow-rose-500/30'
          : 'hover:border-zinc-400',
        data.isDimmed && 'opacity-25 filter grayscale-[60%] pointer-events-none'
      )}
    >
      {/* Target handle on Position.Top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-zinc-300 !border-2 !border-zinc-950 transition-colors hover:!bg-rose-400"
      />
      {/* Lateral target handle for horizontal layout links */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-zinc-950 opacity-0"
      />

      {/* File name header with addition/deletion pill */}
      <div
        className={clsx(
          'flex items-center justify-between border-b border-zinc-800/80 px-3.5 py-2.5 rounded-t-[10px]',
          riskStyles.headerBg
        )}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <FileCode className="w-4 h-4 text-zinc-300 shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-white truncate" title={data.fileName}>
            {data.fileName}
          </span>
        </div>

        {/* Addition / Deletion pill */}
        <div className="flex items-center space-x-1 font-mono text-xs px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 font-semibold shrink-0">
          <span className="text-emerald-400">+{data.additions}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-rose-400">-{data.deletions}</span>
        </div>
      </div>

      {/* Path subheader */}
      <div className="px-3.5 py-1 border-b border-zinc-800/40 text-[11px] font-mono text-zinc-400 truncate bg-zinc-950/40">
        {data.filePath}
      </div>

      {/* Card Interior */}
      <div className="p-3 space-y-2.5">
        {/* Mini diff box: soft red line-through for deletions, soft green for additions */}
        <div className="rounded-lg bg-zinc-950 p-2.5 font-mono text-[11px] leading-relaxed border border-zinc-800/80 overflow-hidden shadow-inner">
          {data.oldSnippet && (
            <div className="text-rose-300 bg-rose-950/40 px-2 py-1 rounded mb-1.5 flex items-start">
              <span className="select-none text-rose-500 font-bold mr-2 shrink-0">-</span>
              <span className="line-through opacity-85 truncate">
                {data.oldSnippet.split('\n')[0]}
              </span>
            </div>
          )}
          {data.newSnippet && (
            <div className="text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded flex items-start">
              <span className="select-none text-emerald-400 font-bold mr-2 shrink-0">+</span>
              <span className="truncate">{data.newSnippet.split('\n')[0]}</span>
            </div>
          )}
          {!data.oldSnippet && !data.newSnippet && (
            <span className="text-zinc-500 italic block py-0.5">No direct code lines captured</span>
          )}
        </div>

        {/* Risk verdict badge rendering breakReason in high-contrast text */}
        <div
          className={clsx(
            'flex items-start space-x-2.5 p-2.5 rounded-lg border text-xs leading-snug shadow-sm',
            riskStyles.badgeBg
          )}
        >
          <RiskIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <span>{risk}</span>
              {data.isRootCause && (
                <span className="px-1.5 py-0.2 text-[9px] bg-rose-600 text-white rounded font-extrabold uppercase tracking-tight shadow">
                  Root Cause
                </span>
              )}
            </div>
            <p className={clsx('mt-1 font-semibold text-xs leading-tight', riskStyles.badgeText)}>
              {data.breakReason || 'Architectural shift verified.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer with dependencies / selection hint */}
      <div className="px-3.5 py-1.5 border-t border-zinc-800/40 text-[10px] text-zinc-400 flex items-center justify-between bg-zinc-950/30 rounded-b-[10px]">
        {data.imports.length > 0 ? (
          <span className="font-mono text-zinc-400 truncate max-w-[240px]">
            Imports: {data.imports.join(', ')}
          </span>
        ) : (
          <span className="text-zinc-500">Self-contained module</span>
        )}
        {isSelected && (
          <span className="text-[9px] uppercase tracking-wider font-bold text-rose-400 animate-pulse">
            Selected
          </span>
        )}
      </div>

      {/* Source handle on Position.Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-zinc-300 !border-2 !border-zinc-950 transition-colors hover:!bg-rose-400"
      />
      {/* Lateral source handle for horizontal layout links */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-zinc-950 opacity-0"
      />
    </div>
  );
});

CodeDiffNode.displayName = 'CodeDiffNode';
export default CodeDiffNode;
