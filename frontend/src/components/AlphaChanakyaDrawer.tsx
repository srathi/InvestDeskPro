"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  Zap,
  Activity,
  ChevronRight,
} from "lucide-react";
import {
  sendCopilotMessage,
  fetchCopilotSuggestions,
  CopilotChatMessage,
  CopilotContext,
  ToolExecutionRecord,
} from "../lib/api";

interface MessageItem {
  id: string;
  sender: "user" | "bot";
  text: string;
  isDeflection?: boolean;
  toolCalls?: ToolExecutionRecord[];
  suggestions?: string[];
  timestamp: string;
}

interface AlphaChanakyaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  selectedTicker?: string;
  selectedFundCode?: string;
  onSelectEntity?: (id: string, type: "stock" | "fund") => void;
}

export function AlphaChanakyaDrawer({
  isOpen,
  onClose,
  activeTab = "company",
  selectedTicker = "",
  selectedFundCode = "",
  onSelectEntity,
}: AlphaChanakyaDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      sender: "bot",
      text: `✨ **Pranāma! I am AlphaChanakya**, your AI quantitative equity and mutual fund strategist for **InvestDeskPro**.\n\nAsk me anything about **Stock Forensics (Altman Z, Beneish M, Piotroski F), Reverse DCF Implied Growth, 3Y Rolling Alpha Consistency, Active Share & Closet Indexing, or Portfolio Risk-Parity**.\n\n*(Note: I am strictly calibrated for Indian capital markets and institutional quantitative research. Distractions will be met with sharp Chanakyan wit!)*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [starterChips, setStarterChips] = useState<
    Array<{ label: string; query: string }>
  >([
    { label: "⚡ Audit Reliance 360°", query: "Run 360° Forensic and Reverse DCF audit for Reliance Industries" },
    { label: "🧭 Parag Parikh vs HDFC Overlap", query: "Compare cross-fund portfolio overlap between Parag Parikh Flexi Cap and HDFC Flexi Cap" },
    { label: "🛡️ Reverse DCF Implied Growth", query: "Explain how Reverse DCF calculates the market's implied 5-year compounding rate" },
    { label: "📊 Active Share & Closet Indexing", query: "What is Active Share and how do you detect closet indexers in AMFI mutual funds?" },
    { label: "🍕 Test Guardrail (Pizza)", query: "Can you give me a recipe for homemade pizza?" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update contextual starter chips when tab/ticker changes
  useEffect(() => {
    fetchCopilotSuggestions(activeTab, selectedTicker, selectedFundCode).then((chips) => {
      if (chips && chips.length > 0) {
        setStarterChips(
          chips.map((c) => ({
            label: `⚡ ${c.length > 32 ? c.slice(0, 30) + "..." : c}`,
            query: c,
          }))
        );
      }
    });
  }, [activeTab, selectedTicker, selectedFundCode]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages, loading]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const historyPayload: CopilotChatMessage[] = messages.map((m) => ({
        role: m.sender === "bot" ? "assistant" : "user",
        content: m.text,
      }));

      const contextPayload: CopilotContext = {
        activeTab,
        selectedTicker: selectedTicker || undefined,
        selectedFundCode: selectedFundCode || undefined,
      };

      const res = await sendCopilotMessage(query, historyPayload, contextPayload);

      const isDeflection = res.response.includes("neural weights are strictly allocated") ||
        res.response.includes("fiduciary protocol strictly limits me") ||
        res.response.includes("0.00% statistical alpha");

      const botMsg: MessageItem = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.response || "Strategy without execution is void. Please restate your query.",
        isDeflection,
        toolCalls: res.tool_calls_executed || [],
        suggestions: res.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: MessageItem = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: `⚠️ **AlphaChanakya encountered an error:** ${
          err.message || "Unable to connect to reasoning engine. Please try again."
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "bot",
        text: "✨ **Chat reset.** What stock setup, reverse DCF equation, or mutual fund dynamic shall we analyze now?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Helper to format bot markdown text cleanly
  const renderFormattedContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeader: string[] = [];

    const flushTable = (keyIdx: number) => {
      if (tableHeader.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-${keyIdx}`} className="my-2 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/90 shadow-inner">
            <table className="w-full text-left text-[11px] border-collapse">
              {tableHeader.length > 0 && (
                <thead>
                  <tr className="bg-gray-900/90 text-cyan-300 border-b border-gray-800">
                    {tableHeader.map((h, hi) => (
                      <th key={hi} className="px-2.5 py-1.5 font-bold font-mono tracking-tight">
                        {formatInline(h.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-gray-850 text-gray-200 font-sans">
                {tableRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-900/40 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2.5 py-1.5 whitespace-nowrap">
                        {formatInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeader = [];
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table parsing
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          inTable = true;
          return;
        }

        if (!inTable && tableHeader.length === 0) {
          tableHeader = cells;
          inTable = true;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      if (!trimmed) {
        elements.push(<div key={idx} className="h-1" />);
        return;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        elements.push(
          <div key={idx} className="font-bold text-cyan-300 mt-2 text-xs sm:text-sm">
            {trimmed.replace("### ", "")}
          </div>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <div key={idx} className="font-bold text-white mt-2.5 text-xs sm:text-sm">
            {trimmed.replace("## ", "")}
          </div>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const clean = trimmed.replace(/^([•\-\*]\s+)/, "");
        elements.push(
          <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5 text-gray-200">
            <span className="text-cyan-400 mt-0.5 font-bold">•</span>
            <div className="flex-1 leading-relaxed">{formatInline(clean)}</div>
          </div>
        );
        return;
      }

      // Standard text line
      elements.push(
        <div key={idx} className="text-gray-200 leading-relaxed my-0.5">
          {formatInline(line)}
        </div>
      );
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed">{elements}</div>;
  };

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-cyan-300 font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="text-amber-200 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-gray-950 border border-gray-800 text-cyan-400 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const activeTabLabel =
    activeTab === "company"
      ? "Stock Intelligence"
      : activeTab === "funds"
      ? "Fund Alpha"
      : "Quant Lab";

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-over / Modal Chat Window (Viz-to-Viz Match with SwingTradeDesk) */}
      <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[480px] h-[600px] max-h-[90vh] bg-[#080d1a]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0c1427] via-[#091122] to-[#080d1a] border-b border-gray-800/80 p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/40 to-amber-500/30 border border-cyan-400/50 flex items-center justify-center text-amber-300 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">AlphaChanakya AI</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                <span>Google Gemini 2.5 Flash</span>
                <span>•</span>
                <span className="text-cyan-400 font-semibold uppercase">{activeTabLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Minimize Copilot (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Context Banner */}
        <div className="bg-gray-950/80 px-3.5 py-1.5 border-b border-gray-900 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span className="flex items-center gap-1 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {activeTab === "company" && selectedTicker
                ? `Telemetry: Auditing ${selectedTicker}`
                : activeTab === "funds" && selectedFundCode
                ? `Telemetry: Auditing Fund #${selectedFundCode}`
                : "Grounded in Reverse DCF, Forensics & AMFI Engine"}
            </span>
          </span>
          <span className="text-gray-500 shrink-0">
            by{" "}
            <a
              href="https://www.rupeemap.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              rupeemap.in
            </a>
          </span>
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-gray-800">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3.5 shadow-md relative group transition-all ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none border border-cyan-400/30"
                    : m.isDeflection
                    ? "bg-amber-950/40 border border-amber-500/40 text-amber-100 rounded-bl-none"
                    : "bg-gray-900/90 border border-gray-800 hover:border-cyan-500/30 text-gray-200 rounded-bl-none"
                }`}
              >
                {/* Sender Header */}
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-white/10 text-[10px] font-mono text-gray-400">
                  <span className="font-semibold text-gray-300 flex items-center gap-1">
                    {m.sender === "user" ? (
                      "You"
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-400 inline" />
                        <span>AlphaChanakya</span>
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>{m.timestamp}</span>
                    {m.sender === "bot" && (
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-800 text-gray-400 hover:text-cyan-300 transition-all"
                        title="Copy Answer"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tool Calling Execution Records Pill (if any) */}
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mb-2 p-2 rounded-lg bg-gray-950 border border-cyan-500/30 flex flex-col gap-1 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Zap className="w-3 h-3 animate-bounce" />
                      <span>Quantitative Tools Executed:</span>
                    </div>
                    {m.toolCalls.map((tc, tci) => (
                      <div key={tci} className="text-gray-300 pl-3 border-l border-cyan-500/40 text-[10px]">
                        <code>{tc.tool}</code>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Content */}
                {m.sender === "user" ? (
                  <div className="text-xs sm:text-[13px] font-sans leading-relaxed">{m.text}</div>
                ) : (
                  renderFormattedContent(m.text)
                )}

                {/* Suggested Topics if deflected or dynamic followups */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-cyan-500/20 space-y-1.5">
                    <div className="text-[10px] text-cyan-300 font-mono font-semibold">
                      Suggested Financial Inquiries:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((topic, tidx) => (
                        <button
                          key={tidx}
                          onClick={() => handleSendMessage(topic)}
                          className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-mono transition-colors text-left flex items-center gap-1"
                        >
                          <span>⚡ {topic}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 p-3 bg-gray-900/80 rounded-2xl border border-cyan-500/30 max-w-[80%]">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-cyan-300">
                AlphaChanakya is calculating quantitative edge...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Starter Chips */}
        <div className="px-3.5 py-2 bg-gray-950/90 border-t border-gray-900 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {starterChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full bg-gray-900 hover:bg-cyan-500/20 border border-gray-800 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 font-mono transition-all flex-shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#0a0f1d] border-t border-gray-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about DCF, Forensics, Rolling Alpha, or Overlap..."
              className="flex-1 bg-gray-950 border border-gray-800 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-medium shadow-lg shadow-cyan-600/20 transition-all active:scale-95 flex-shrink-0"
              title="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[9px] text-gray-500 text-center mt-1.5 font-mono">
            Strictly for institutional quantitative research & valuation modeling. Not financial advice.
          </div>
        </div>
      </div>
    </>
  );
}
