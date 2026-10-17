import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { FileCode, AlertTriangle, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ParsedFileDiff } from '../services/diffParser';

export interface CodeDiffNodeData extends ParsedFileDiff, Record<string, unknown> {
  riskLevel?: 'CRITICAL' | 'WARNING' | 'SAFE';
  breakReason?: string;
  intentSummary?: string;
  isRootCause?: boolean;
  isDimmed?: boolean;
  onPinSnippet?: (fileName: string, snippet: string) => void;
}

export type CodeDiffNodeType = Node<CodeDiffNodeData, 'codeDiffNode'>;

export const CodeDiffNode: React.FC<NodeProps<CodeDiffNodeType>> = memo((props) => {
  const data = props.data;
  const risk = data.riskLevel || (data.deletions > 0 && data.additions > 0 ? 'CRITICAL' : 'SAFE');
  const isSelected = props.selected;

  // Airbnb design token styles for cards and badges
  const riskStyles = {
    CRITICAL: {
      border: 'border-[#ff385c]/80',
      glow: 'shadow-[0_4px_20px_-4px_rgba(255,56,92,0.35)]',
      badgeBg: 'bg-[#ff385c]/10 text-rose-200 border-[#ff385c]/40',
      badgeText: 'text-rose-100',
      icon: Flame,
      headerBg: 'bg-[#ff385c]/10',
      accentColor: '#ff385c',
    },
    WARNING: {
      border: 'border-amber-500/80',
      glow: 'shadow-[0_4px_20px_-4px_rgba(245,158,11,0.3)]',
      badgeBg: 'bg-amber-500/10 text-amber-200 border-amber-500/40',
      badgeText: 'text-amber-100',
      icon: AlertTriangle,
      headerBg: 'bg-amber-500/10',
      accentColor: '#f59e0b',
    },
    SAFE: {
      border: 'border-emerald-500/80',
      glow: 'shadow-[0_4px_20px_-4px_rgba(16,185,129,0.25)]',
      badgeBg: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40',
      badgeText: 'text-emerald-100',
      icon: CheckCircle2,
      headerBg: 'bg-emerald-500/10',
      accentColor: '#10b981',
    },
  }[risk];

  const RiskIcon = riskStyles.icon;

  const handleSnippetClick = (e: React.MouseEvent, snippet: string) => {
    if (typeof data.onPinSnippet === 'function') {
      e.stopPropagation();
      (data.onPinSnippet as (fileName: string, snippet: string) => void)(data.fileName, snippet);
    }
  };

  return (
    <div
      className={clsx(
        'w-[340px] rounded-[14px] border bg-[#141417]/95 text-zinc-100 shadow-airbnb transition-all duration-300 backdrop-blur-md relative cursor-pointer overflow-hidden',
        riskStyles.border,
        riskStyles.glow,
        isSelected
          ? 'ring-2 ring-[#ff385c] scale-[1.02] z-30 shadow-airbnb-float'
          : 'hover:border-zinc-500 hover:shadow-airbnb-float',
        data.isDimmed && 'opacity-25 filter grayscale-[60%] pointer-events-none'
      )}
    >
      {/* Target handle on Position.Top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-zinc-300 !border-2 !border-[#141417] transition-colors hover:!bg-[#ff385c]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-[#141417] opacity-0"
      />

      {/* 1. Header: File name in modest weight 600 with addition/deletion pill */}
      <div
        className={clsx(
          'flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5',
          riskStyles.headerBg
        )}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <FileCode className="w-4 h-4 text-zinc-300 shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-white truncate" title={data.fileName}>
            {data.fileName}
          </span>
        </div>

        {/* Addition / Deletion pill badge (rounded.full) */}
        <div className="flex items-center space-x-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-950/90 border border-zinc-800 font-semibold shrink-0 shadow-sm">
          <span className="text-emerald-400">+{data.additions}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-[#ff385c]">-{data.deletions}</span>
        </div>
      </div>

      {/* 2. File Path Subheader */}
      <div className="px-4 py-1.5 border-b border-zinc-800/40 text-[11px] font-mono text-zinc-400 truncate bg-zinc-950/50">
        {data.filePath}
      </div>

      {/* 3. Card Interior (8px rounded mini diff & risk badge) */}
      <div className="p-3.5 space-y-2.5">
        {/* Mini diff box with interactive click-to-pin */}
        <div className="rounded-[8px] bg-zinc-950 p-2.5 font-mono text-[11px] leading-relaxed border border-zinc-800/80 overflow-hidden shadow-inner">
          {data.oldSnippet && (
            <div
              onClick={(e) => handleSnippetClick(e, data.oldSnippet)}
              className="text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 px-2 py-1 rounded-[6px] mb-1.5 flex items-start cursor-pointer transition-colors"
              title="Click to ask AI about this deletion"
            >
              <span className="select-none text-[#ff385c] font-bold mr-2 shrink-0">-</span>
              <span className="line-through opacity-85 truncate">
                {data.oldSnippet.split('\n')[0]}
              </span>
            </div>
          )}
          {data.newSnippet && (
            <div
              onClick={(e) => handleSnippetClick(e, data.newSnippet)}
              className="text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/50 px-2 py-1 rounded-[6px] flex items-start cursor-pointer transition-colors"
              title="Click to ask AI about this addition"
            >
              <span className="select-none text-emerald-400 font-bold mr-2 shrink-0">+</span>
              <span className="truncate">{data.newSnippet.split('\n')[0]}</span>
            </div>
          )}
          {!data.oldSnippet && !data.newSnippet && (
            <span className="text-zinc-500 italic block py-0.5">No direct code lines captured</span>
          )}
        </div>

        {/* Risk verdict badge (Guest-favorite pill style) */}
        <div
          className={clsx(
            'flex items-start space-x-2.5 p-3 rounded-[10px] border text-xs leading-snug shadow-sm',
            riskStyles.badgeBg
          )}
        >
          <RiskIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <span>{risk}</span>
              {data.isRootCause && (
                <span className="px-2 py-0.2 text-[9px] bg-[#ff385c] text-white rounded-full font-extrabold uppercase tracking-tight shadow-sm">
                  Root Cause
                </span>
              )}
            </div>
            <p className={clsx('mt-1 font-medium text-xs leading-tight', riskStyles.badgeText)}>
              {data.breakReason || 'Architectural shift verified non-breaking.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Footer: Dependency Tags & Ask AI Pill Button */}
      <div className="px-4 py-2 border-t border-zinc-800/40 text-[11px] text-zinc-400 flex items-center justify-between bg-zinc-950/40">
        {data.imports.length > 0 ? (
          <span className="font-mono text-zinc-400 truncate max-w-[170px]" title={data.imports.join(', ')}>
            Imports: {data.imports.join(', ')}
          </span>
        ) : (
          <span className="text-zinc-500">Self-contained</span>
        )}

        <div className="flex items-center space-x-2">
          {isSelected && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#ff385c]">
              Selected
            </span>
          )}

          <button
            type="button"
            onClick={(e) =>
              handleSnippetClick(
                e,
                data.newSnippet || data.oldSnippet || `Modifications in ${data.fileName}`
              )
            }
            className="text-[11px] font-medium text-zinc-200 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-[#ff385c] hover:shadow-airbnb-orb transition-all duration-200"
            title="Ask AI about this file"
          >
            <Sparkles className="w-3 h-3 text-[#ff385c] group-hover:text-white" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Source handle on Position.Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-zinc-300 !border-2 !border-[#141417] transition-colors hover:!bg-[#ff385c]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-[#141417] opacity-0"
      />
    </div>
  );
});

CodeDiffNode.displayName = 'CodeDiffNode';
export default CodeDiffNode;
