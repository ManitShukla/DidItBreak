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
    <div className="bg-[#05070A] border border-[#3B3B3B] font-mono text-xs select-text">
      <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border-b border-[#3B3B3B] text-[10px] uppercase tracking-wider text-[#697271]">
        <span className="font-bold text-[#FFFFFF]">LINE-BY-LINE DIFF INSPECTOR</span>
        <span>CLICK LINE OR 💬 TO PIN CONTEXT</span>
      </div>

      <div className="overflow-x-auto max-h-80 divide-y divide-[#1A1A1A]">
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
                'group relative flex items-center px-2 py-0.5 transition-colors cursor-pointer text-[11px] leading-5 font-mono',
                isAddition && 'bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 border-l-2 border-emerald-500',
                isDeletion && 'bg-[#D82C2C]/10 text-[#D82C2C] hover:bg-[#D82C2C]/20 border-l-2 border-[#D82C2C]',
                isHunkHeader && 'bg-[#0033A0]/20 text-[#0033A0] font-bold border-l-2 border-[#0033A0]',
                isMetaHeader && 'text-[#697271] bg-[#05070A]',
                !isAddition && !isDeletion && !isHunkHeader && !isMetaHeader && 'text-[#C8CECD] hover:bg-[#1A1A1A]',
                isCurrentlySelected && 'bg-[#D82C2C]/20 border-l-2 border-[#D82C2C]'
              )}
            >
              {/* Line number gutter */}
              <span className="w-8 shrink-0 text-right pr-3 text-[10px] text-[#697271] select-none font-mono">
                {isMetaHeader || isHunkHeader ? '' : lineNumber}
              </span>

              {/* Line diff type marker */}
              <span className="w-3 shrink-0 text-center select-none font-bold">
                {isAddition ? '+' : isDeletion ? '-' : ' '}
              </span>

              {/* Line content */}
              <span className="flex-1 whitespace-pre font-mono overflow-x-hidden text-ellipsis pl-1">
                {isHunkHeader ? line : line.replace(/^[+-]/, '')}
              </span>

              {/* Floating Action Button on Hover */}
              {!isMetaHeader && !isHunkHeader && hoveredIndex === idx && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLineClick(line, lineNumber);
                  }}
                  className="absolute right-2 px-2 py-0.5 bg-[#D82C2C] text-[#FFFFFF] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1 animate-in fade-in duration-100 z-10"
                  title="Pin this line to AI Chat"
                >
                  <MessageSquarePlus className="w-3 h-3" />
                  <span>ASK AI</span>
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
