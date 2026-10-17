import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Code2,
  Trash2,
  Maximize2,
  Minimize2,
  AlertTriangle,
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
        'fixed bottom-5 right-5 bg-[#121316]/95 border border-zinc-800 rounded-[16px] shadow-airbnb-float backdrop-blur-2xl z-40 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-3',
        isExpanded
          ? 'w-[640px] max-w-[calc(100vw-2.5rem)] h-[780px] max-h-[92vh]'
          : 'w-[440px] max-w-[calc(100vw-2.5rem)] h-[600px] max-h-[85vh]'
      )}
    >
      {/* 1. Header (Airbnb Top-Nav Style) */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#141518]/90">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#ff385c] text-white flex items-center justify-center shadow-airbnb-orb shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-white tracking-tight">
                DidItBreak AI Assistant
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 truncate">
              {activeFileName ? `Context: ${activeFileName}` : 'Global Multi-File Diff Context'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onClearHistory && history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 rounded-full hidden sm:flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Pinned Context Banner (Airbnb Badge Card) */}
      {pinnedContext && (
        <div className="px-3.5 py-2.5 bg-[#ff385c]/10 border-b border-[#ff385c]/25 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start space-x-2 min-w-0">
            <Code2 className="w-4 h-4 text-[#ff385c] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[10px] uppercase tracking-wider text-[#ff385c]">
                  Pinned Code Context
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({pinnedContext.fileName} {pinnedContext.lineRange || ''})
                </span>
              </div>
              <p className="font-mono text-[11px] text-zinc-200 truncate max-w-[320px] bg-zinc-950/90 px-2 py-0.5 rounded-[6px] mt-1 border border-zinc-800">
                {pinnedContext.codeSnippet}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearPinned}
            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-[#ff385c] hover:bg-[#ff385c]/20 transition-colors shrink-0"
            title="Unpin snippet"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs select-text">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-zinc-500">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-[#ff385c] flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-200">Ask DidItBreak AI</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
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
                className={clsx('flex items-start space-x-2.5', isUser && 'flex-row-reverse space-x-reverse')}
              >
                {/* Avatar */}
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs shadow-airbnb',
                    isUser ? 'bg-zinc-800 text-zinc-300' : 'bg-[#ff385c] text-white'
                  )}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className="max-w-[85%] space-y-1">
                  {/* Pinned pill inside user message if present */}
                  {msg.pinnedContext && (
                    <div className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-[6px] border border-zinc-800 inline-block mb-1">
                      Target: {msg.pinnedContext.fileName} ({msg.pinnedContext.codeSnippet.slice(0, 30)}...)
                    </div>
                  )}

                  <div
                    className={clsx(
                      'p-3.5 rounded-[14px] leading-relaxed relative group text-xs',
                      isUser
                        ? 'bg-[#ff385c] text-white rounded-tr-[4px] shadow-airbnb-orb font-medium'
                        : 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 rounded-tl-[4px] shadow-airbnb'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <span className="text-[9px] text-zinc-500 font-mono px-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2.5 text-xs text-zinc-400 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-[#ff385c] flex items-center justify-center text-white shrink-0 shadow-airbnb-orb">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-[14px] bg-zinc-900 border border-zinc-800 rounded-tl-[4px] text-zinc-300 flex items-center space-x-2 shadow-airbnb">
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#ff385c] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">Gemini 1.5 Flash analyzing diff...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Question Chips (Airbnb Category-Strip Pills) */}
      <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-800/80 overflow-x-auto flex items-center space-x-2 scrollbar-none">
        {PRESET_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleChipClick(chip)}
            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white whitespace-nowrap transition-colors shrink-0 disabled:opacity-50 shadow-airbnb"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 5. Input Area (Airbnb text-input with Search-Orb Send Action) */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-[#141518]/90">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pinnedContext
                ? `Ask about ${pinnedContext.fileName}...`
                : 'Ask a question about the active diff...'
            }
            className="w-full pl-3.5 pr-11 py-2.5 rounded-[10px] bg-zinc-950 border border-zinc-800 focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] text-zinc-100 placeholder-zinc-500 text-xs outline-none resize-none transition-all shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={clsx(
              'absolute right-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all shadow-airbnb',
              inputText.trim() && !isLoading
                ? 'bg-[#ff385c] hover:bg-[#e00b41] shadow-airbnb-orb active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            )}
            title="Send query (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <AlertTriangle className="w-3 h-3 text-amber-500 inline" />
            AI Safety Engine
          </span>
        </div>
      </form>
    </div>
  );
};

export default CodeChatDrawer;
