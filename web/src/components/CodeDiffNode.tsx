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

  // Swiss/editorial severity rules
  const riskStyles = {
    CRITICAL: {
      border: 'border-[#D82C2C]',
      accentRule: 'bg-[#D82C2C]',
      badgeBg: 'bg-[#D82C2C]/10 text-[#D82C2C] border-[#D82C2C]',
      badgeText: 'text-[#FFFFFF]',
      icon: Flame,
      statusLabel: 'CRITICAL // CONTRACT BREAK',
    },
    WARNING: {
      border: 'border-amber-500',
      accentRule: 'bg-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500',
      badgeText: 'text-[#FFFFFF]',
      icon: AlertTriangle,
      statusLabel: 'WARNING // SIGNATURE SHIFT',
    },
    SAFE: {
      border: 'border-[#0033A0]',
      accentRule: 'bg-[#0033A0]',
      badgeBg: 'bg-[#0033A0]/20 text-emerald-400 border-[#0033A0]',
      badgeText: 'text-[#FFFFFF]',
      icon: CheckCircle2,
      statusLabel: 'SAFE // VERIFIED INTACT',
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
        'w-[350px] bg-[#1A1A1A] border rounded-none text-[#FFFFFF] transition-all duration-150 relative cursor-pointer',
        riskStyles.border,
        isSelected
          ? 'ring-2 ring-[#FFFFFF] z-30 shadow-none'
          : 'hover:border-[#C8CECD]',
        data.isDimmed && 'opacity-20 filter grayscale pointer-events-none'
      )}
    >
      {/* 2px Solid Accent Rule at Top of Node */}
      <div className={clsx('h-[2px] w-full', riskStyles.accentRule)} />

      {/* Target handle on Position.Top (Engineered sharp square) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !rounded-none !bg-[#C8CECD] !border-2 !border-[#05070A] transition-colors hover:!bg-[#D82C2C]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2 !h-2 !rounded-none !bg-[#3B3B3B] !border-0 opacity-0"
      />

      {/* 1. Header: Technical notation row */}
      <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[10px] font-mono border-b border-[#3B3B3B] text-[#697271]">
        <span className="truncate max-w-[200px] uppercase tracking-wider" title={data.filePath}>
          {data.filePath}
        </span>

        {/* Diff metrics */}
        <div className="flex items-center space-x-1 shrink-0 font-bold">
          <span className="text-emerald-400">+{data.additions}</span>
          <span className="text-[#3B3B3B]">/</span>
          <span className="text-[#D82C2C]">-{data.deletions}</span>
        </div>
      </div>

      {/* 2. File Name Title */}
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <FileCode className="w-4 h-4 text-[#C8CECD] shrink-0" />
          <h4 className="font-sans font-semibold text-sm tracking-[-0.03em] text-[#FFFFFF] truncate" title={data.fileName}>
            {data.fileName}
          </h4>
        </div>

        {data.isRootCause && (
          <span className="px-1.5 py-0.5 bg-[#D82C2C] text-[#FFFFFF] text-[9px] font-mono font-bold uppercase tracking-[0.1em] shrink-0">
            ROOT CAUSE
          </span>
        )}
      </div>

      {/* 3. Card Interior */}
      <div className="px-3.5 pb-3 space-y-2.5">
        {/* Mini diff box with sharp 1px border & mono highlights */}
        <div className="bg-[#05070A] border border-[#3B3B3B] p-2 font-mono text-[11px] leading-relaxed select-text">
          {data.oldSnippet && (
            <div
              onClick={(e) => handleSnippetClick(e, data.oldSnippet)}
              className="text-[#D82C2C] bg-[#D82C2C]/10 border-l-2 border-[#D82C2C] px-2 py-0.5 mb-1 flex items-start cursor-pointer hover:bg-[#D82C2C]/20 transition-colors"
              title="Click to ask AI about this deletion"
            >
              <span className="select-none font-bold mr-2 shrink-0">-</span>
              <span className="line-through opacity-90 truncate">
                {data.oldSnippet.split('\n')[0]}
              </span>
            </div>
          )}
          {data.newSnippet && (
            <div
              onClick={(e) => handleSnippetClick(e, data.newSnippet)}
              className="text-emerald-400 bg-emerald-950/30 border-l-2 border-emerald-500 px-2 py-0.5 flex items-start cursor-pointer hover:bg-emerald-950/50 transition-colors"
              title="Click to ask AI about this addition"
            >
              <span className="select-none font-bold mr-2 shrink-0">+</span>
              <span className="truncate">{data.newSnippet.split('\n')[0]}</span>
            </div>
          )}
          {!data.oldSnippet && !data.newSnippet && (
            <span className="text-[#697271] italic block text-[10px]">NO CODE HUNKS CAPTURED</span>
          )}
        </div>

        {/* Risk verdict banner */}
        <div
          className={clsx(
            'p-2.5 border text-xs font-mono leading-tight',
            riskStyles.badgeBg
          )}
        >
          <div className="flex items-center space-x-1.5 font-bold uppercase tracking-[0.08em] text-[10px]">
            <RiskIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{riskStyles.statusLabel}</span>
          </div>
          <p className="mt-1 font-sans font-medium text-xs text-[#FFFFFF] leading-snug">
            {data.breakReason || 'Architectural shift verified intact.'}
          </p>
        </div>
      </div>

      {/* 4. Footer: Dependency Tags & Sharp Ask AI Action */}
      <div className="px-3.5 py-2 border-t border-[#3B3B3B] bg-[#05070A] text-[10px] font-mono text-[#697271] flex items-center justify-between">
        {data.imports.length > 0 ? (
          <span className="truncate max-w-[190px]" title={data.imports.join(', ')}>
            IMP // {data.imports.join(', ')}
          </span>
        ) : (
          <span>SELF-CONTAINED</span>
        )}

        <div className="flex items-center space-x-2">
          {isSelected && (
            <span className="text-[#D82C2C] font-bold uppercase tracking-wider text-[9px]">
              [ACTIVE]
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
            className="px-2 py-0.5 bg-[#1A1A1A] hover:bg-[#D82C2C] border border-[#3B3B3B] hover:border-[#D82C2C] text-[#FFFFFF] text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1 transition-colors"
            title="Ask AI about this file"
          >
            <Sparkles className="w-3 h-3 text-[#D82C2C] group-hover:text-[#FFFFFF]" />
            <span>ASK AI</span>
          </button>
        </div>
      </div>

      {/* Source handle on Position.Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !rounded-none !bg-[#C8CECD] !border-2 !border-[#05070A] transition-colors hover:!bg-[#D82C2C]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2 !h-2 !rounded-none !bg-[#3B3B3B] !border-0 opacity-0"
      />
    </div>
  );
});

CodeDiffNode.displayName = 'CodeDiffNode';
export default CodeDiffNode;
