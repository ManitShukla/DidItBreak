import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Code2,
  Trash2,
  Maximize2,
  Minimize2,
  Terminal,
} from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage, PinnedContext } from '../services/chatService';

export interface CodeChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  pinnedContext: PinnedContext | null;
  onClearPinned: () => void;
  activeFileName?: string;
  onClearHistory?: () => void;
}

const PRESET_CHIPS = [
  'Why was this line changed?',
  'What could break if this runs?',
  'Suggest a safer alternative.',
  'Will this cause runtime errors?',
];

export const CodeChatDrawer: React.FC<CodeChatDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSendMessage,
  isLoading,
  pinnedContext,
  onClearPinned,
  activeFileName,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  // Focus input when opened or snippet pinned
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, pinnedContext]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleChipClick = (chipText: string) => {
    onSendMessage(chipText);
  };

  return (
    <div
      role="region"
      aria-label="Code Explainer AI Drawer"
      className={clsx(
        'fixed bottom-0 right-0 sm:bottom-4 sm:right-4 bg-[#1A1A1A] border-2 border-[#3B3B3B] z-40 flex flex-col overflow-hidden font-mono transition-all duration-150 rounded-none shadow-none',
        isExpanded
          ? 'w-full sm:w-[680px] h-full sm:h-[820px] sm:max-h-[92vh]'
          : 'w-full sm:w-[480px] h-[580px] max-h-[85vh]'
      )}
    >
      {/* 2px Solid Accent Rule at Top */}
      <div className="h-[2px] w-full bg-[#D82C2C] shrink-0" />

      {/* 1. Header (Institutional Swiss classification) */}
      <div className="p-3 border-b border-[#3B3B3B] flex items-center justify-between bg-[#05070A]">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1 bg-[#1A1A1A] border border-[#3B3B3B] text-[#D82C2C]">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs text-[#FFFFFF] tracking-[0.1em] uppercase">
                DIAGNOSTIC AGENT // GEMINI FLASH
              </h3>
              <span className="w-1.5 h-1.5 bg-emerald-400 inline-block animate-ping" />
            </div>
            <p className="text-[10px] text-[#697271] truncate">
              {activeFileName ? `CONTEXT // ${activeFileName}` : 'CONTEXT // GLOBAL MULTI-FILE DIFF'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onClearHistory && history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="p-1.5 border border-[#3B3B3B] text-[#697271] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 border border-[#3B3B3B] text-[#697271] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors hidden sm:inline-flex"
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[#3B3B3B] text-[#697271] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors"
            title="Close Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Pinned Context Banner */}
      {pinnedContext && (
        <div className="px-3 py-2 bg-[#D82C2C]/10 border-b border-[#D82C2C] flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2 min-w-0">
            <Code2 className="w-4 h-4 text-[#D82C2C] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-wider text-[#D82C2C] font-bold">
                <span>PINNED SNIPPET //</span>
                <span className="text-[#FFFFFF]">
                  {pinnedContext.fileName} {pinnedContext.lineRange || ''}
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#FFFFFF] truncate max-w-[340px] bg-[#05070A] px-2 py-0.5 border border-[#3B3B3B] mt-1">
                {pinnedContext.codeSnippet}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearPinned}
            className="p-1 border border-[#3B3B3B] text-[#697271] hover:text-[#D82C2C] hover:border-[#D82C2C] transition-colors shrink-0"
            title="Unpin snippet"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs select-text">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#697271]">
            <div className="p-3 bg-[#05070A] border border-[#3B3B3B] text-[#0033A0]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.1em] text-[#FFFFFF]">
                DIAGNOSTIC AGENT READY
              </h4>
              <p className="text-[11px] text-[#697271] mt-1 max-w-[280px]">
                Click any line in a diff node or select code to ask whether it introduces runtime breakages.
              </p>
            </div>
          </div>
        ) : (
          history.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={clsx('flex items-start space-x-2', isUser && 'flex-row-reverse space-x-reverse')}
              >
                {/* Avatar Stamp */}
                <div
                  className={clsx(
                    'w-6 h-6 rounded-none flex items-center justify-center shrink-0 text-xs font-mono font-bold border',
                    isUser
                      ? 'bg-[#1A1A1A] border-[#3B3B3B] text-[#C8CECD]'
                      : 'bg-[#D82C2C] border-[#D82C2C] text-[#FFFFFF]'
                  )}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className="max-w-[85%] space-y-1">
                  {msg.pinnedContext && (
                    <div className="text-[10px] font-mono text-[#697271] bg-[#05070A] px-2 py-0.5 border border-[#3B3B3B] inline-block mb-1">
                      TARGET // {msg.pinnedContext.fileName} ({msg.pinnedContext.codeSnippet.slice(0, 30)}...)
                    </div>
                  )}

                  <div
                    className={clsx(
                      'p-3 border rounded-none leading-relaxed relative group text-xs font-mono',
                      isUser
                        ? 'bg-[#05070A] border-[#3B3B3B] text-[#FFFFFF]'
                        : 'bg-[#1A1A1A] border-[#3B3B3B] text-[#FFFFFF]'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-1.5 right-1.5 p-1 bg-[#05070A] border border-[#3B3B3B] text-[#697271] hover:text-[#FFFFFF] hover:border-[#FFFFFF] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <span className="text-[9px] text-[#697271] font-mono px-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#697271]">
            <div className="w-6 h-6 bg-[#D82C2C] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-2 bg-[#05070A] border border-[#3B3B3B] text-[#C8CECD] flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#D82C2C] animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-wider">
                GEMINI 1.5 FLASH ANALYZING AST GRAPH...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Question Chips */}
      <div className="px-3 py-1.5 bg-[#05070A] border-t border-[#3B3B3B] overflow-x-auto flex items-center space-x-2">
        {PRESET_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleChipClick(chip)}
            className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#3B3B3B] border border-[#3B3B3B] text-[10px] font-mono uppercase tracking-wider text-[#C8CECD] hover:text-[#FFFFFF] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 5. Input Area (Sharp rectangular input with solid red submit action) */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#3B3B3B] bg-[#05070A]">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pinnedContext
                ? `QUERY CONTEXT // ${pinnedContext.fileName}...`
                : 'ENTER ARCHITECTURAL QUERY (ENTER)...'
            }
            className="w-full pl-3 pr-10 py-2 bg-[#1A1A1A] border border-[#3B3B3B] focus:border-[#D82C2C] focus:outline-none text-[#FFFFFF] placeholder-[#697271] font-mono text-xs resize-none transition-colors rounded-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={clsx(
              'absolute right-1.5 px-2 py-1.5 text-xs font-mono font-bold uppercase transition-colors',
              inputText.trim() && !isLoading
                ? 'bg-[#D82C2C] hover:bg-[#D82C2C]/90 text-[#FFFFFF]'
                : 'bg-[#3B3B3B] text-[#697271] cursor-not-allowed'
            )}
            title="Send query (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1 flex items-center justify-between text-[9px] text-[#697271] font-mono px-1">
          <span>ENTER TO TRANSMIT // SHIFT+ENTER FOR NEWLINE</span>
          <span className="text-[#C8CECD]">ENGINE // FLASH_1.5</span>
        </div>
      </form>
    </div>
  );
};

export default CodeChatDrawer;
