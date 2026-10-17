import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import clsx from 'clsx';

export interface SelectableDiffViewProps {
  fileName: string;
  rawPatch: string;
  onSelectCode: (fileName: string, snippet: string, lineRange?: string) => void;
  selectedSnippet?: string | null;
}

export const SelectableDiffView: React.FC<SelectableDiffViewProps> = ({
  fileName,
  rawPatch,
  onSelectCode,
  selectedSnippet,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Split raw patch into individual renderable lines
  const lines = rawPatch.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const handleLineClick = (lineContent: string, lineNumber: number) => {
    // Clean diff prefix (+/-) from snippet for cleaner AI reasoning
    const cleaned = lineContent.replace(/^[+-]/, '').trim();
    if (!cleaned || lineContent.startsWith('diff --git') || lineContent.startsWith('index ')) {
      return;
    }
    onSelectCode(fileName, cleaned, `L${lineNumber}`);
  };

  return (
    <div className="rounded-[10px] bg-zinc-950 border border-zinc-800/90 overflow-hidden font-mono text-xs select-text shadow-inner">
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/70 border-b border-zinc-800 text-[11px] text-zinc-400">
        <span className="font-semibold text-zinc-300">Line-by-Line Diff Inspector</span>
        <span className="text-[10px] text-zinc-500">Click any line or 💬 to pin context</span>
      </div>

      <div className="overflow-x-auto max-h-80 divide-y divide-zinc-900/50">
        {lines.map((line, idx) => {
          const lineNumber = idx + 1;
          const isAddition = line.startsWith('+') && !line.startsWith('+++');
          const isDeletion = line.startsWith('-') && !line.startsWith('---');
          const isHunkHeader = line.startsWith('@@');
          const isMetaHeader =
            line.startsWith('diff ') ||
            line.startsWith('index ') ||
            line.startsWith('---') ||
            line.startsWith('+++');

          const cleanedLine = line.replace(/^[+-]/, '').trim();
          const isCurrentlySelected =
            selectedSnippet && cleanedLine && selectedSnippet.includes(cleanedLine);

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleLineClick(line, lineNumber)}
              className={clsx(
                'group relative flex items-center px-2.5 py-0.5 transition-colors cursor-pointer text-[11px] leading-5',
                isAddition && 'bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40',
                isDeletion && 'bg-[#ff385c]/10 text-rose-300 hover:bg-[#ff385c]/20',
                isHunkHeader && 'bg-sky-950/30 text-sky-400 font-semibold',
                isMetaHeader && 'text-zinc-500 bg-zinc-950/80',
                !isAddition && !isDeletion && !isHunkHeader && !isMetaHeader && 'text-zinc-300 hover:bg-zinc-900/60',
                isCurrentlySelected && 'ring-1 ring-[#ff385c] bg-[#ff385c]/20'
              )}
            >
              {/* Line number gutter */}
              <span className="w-8 shrink-0 text-right pr-3 text-[10px] text-zinc-600 select-none font-mono">
                {isMetaHeader || isHunkHeader ? '' : lineNumber}
              </span>

              {/* Line diff type marker */}
              <span className="w-3.5 shrink-0 text-center select-none font-bold">
                {isAddition ? '+' : isDeletion ? '-' : ' '}
              </span>

              {/* Line content */}
              <span className="flex-1 whitespace-pre font-mono overflow-x-hidden text-ellipsis pl-1">
                {isHunkHeader ? line : line.replace(/^[+-]/, '')}
              </span>

              {/* Floating Action Button on Hover (Airbnb Pill Button Style) */}
              {!isMetaHeader && !isHunkHeader && hoveredIndex === idx && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLineClick(line, lineNumber);
                  }}
                  className="absolute right-2 px-2.5 py-0.5 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white text-[10px] font-sans font-semibold shadow-airbnb-orb flex items-center space-x-1 animate-in fade-in zoom-in-95 duration-150 z-10"
                  title="Pin this line to AI Chat"
                >
                  <MessageSquarePlus className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectableDiffView;
