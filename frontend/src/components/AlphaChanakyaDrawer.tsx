"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  X,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  TrendingUp,
  PieChart,
  HelpCircle,
  ExternalLink,
  Zap,
  Activity,
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  sendCopilotMessage,
  fetchCopilotSuggestions,
  CopilotChatMessage,
  CopilotContext,
  ToolExecutionRecord
} from "../lib/api";

interface MessageItem {
  id: string;
  sender: "user" | "bot";
  text: string;
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
      text: `✨ **Pranāma! I am AlphaChanakya**, your AI quantitative equity and mutual fund strategist for **InvestDeskPro**.

I am equipped with direct access to:
- **Stock Intelligence**: 360° Forensics, Reverse DCF Implied Growth, Forward EPS Estimates, and Forensic Probes (*Altman Z, Beneish M, Piotroski F*).
- **Fund Alpha Engine**: 3Y Rolling Alpha Consistency, Active Share & Closet Indexing Alerts, and Cross-Fund Overlap.
- **Quant & Stress Lab**: Inverse-Volatility Risk Parity Allocation and Historical Crash Replay Stress-Testing.
- **Macro Outlook**: RBI stance, G-Sec yields, FII/DII institutional flows, and Indian tax nuances.

*How shall we evaluate your investments today?*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: [
        "Audit Reliance Industries 360°",
        "Compare Parag Parikh vs HDFC Flexi Cap overlap",
        "Explain Reverse DCF Implied Growth",
        "What is the current India VIX and FII flow status?"
      ]
    }
  ]);

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dynamicStarterChips, setDynamicStarterChips] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch contextual suggestions when tab/ticker changes
  useEffect(() => {
    fetchCopilotSuggestions(activeTab, selectedTicker, selectedFundCode).then((chips) => {
      if (chips && chips.length > 0) {
        setDynamicStarterChips(chips);
      }
    });
  }, [activeTab, selectedTicker, selectedFundCode]);

  // Focus input and scroll when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, loading]);

  // Handle escape key
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
    setExecutingTool("Analyzing quantitative factors & intent...");

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

      const botMsg: MessageItem = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.response || "Strategy without execution is void. Please restate your query.",
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
          err.message || "Unable to connect to the reasoning engine. Please try again."
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setExecutingTool(null);
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
        text: "✨ **Chat reset.** What stock forensic audit, mutual fund rolling alpha, or risk allocation shall we analyze now?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: dynamicStarterChips,
      },
    ]);
  };

  // Helper to parse and render Markdown tables and formatted text
  const renderFormattedContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeader: string[] = [];

    const flushTable = (keyIdx: number) => {
      if (tableHeader.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-${keyIdx}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/80 shadow-md">
            <table className="w-full text-left text-[11px] border-collapse">
              {tableHeader.length > 0 && (
                <thead>
                  <tr className="bg-slate-900/90 text-cyan-300 border-b border-slate-800">
                    {tableHeader.map((h, hi) => (
                      <th key={hi} className="px-3 py-2 font-bold font-mono tracking-tight">
                        {formatInline(h.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-800/50 text-slate-200 font-sans">
                {tableRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-900/40 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-1.5 whitespace-nowrap">
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

      // Table line detection
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        // Skip separator line (| :--- | :--- |)
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
      if (trimmed.startsWith("#### ")) {
        elements.push(
          <h5 key={idx} className="font-bold text-amber-300 mt-2.5 mb-1 text-xs tracking-wide">
            {trimmed.replace("#### ", "")}
          </h5>
        );
        return;
      }
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4 key={idx} className="font-bold text-cyan-300 mt-3 mb-1 text-sm flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-cyan-500 rounded-sm inline-block" />
            {trimmed.replace("### ", "")}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3 key={idx} className="font-extrabold text-white mt-3.5 mb-1.5 text-sm tracking-tight">
            {trimmed.replace("## ", "")}
          </h3>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const clean = trimmed.replace(/^([•\-\*]\s+)/, "");
        elements.push(
          <div key={idx} className="flex items-start gap-2 pl-1 my-0.5 text-slate-200">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
            <div className="flex-1 leading-relaxed">{formatInline(clean)}</div>
          </div>
        );
        return;
      }

      // Standard text line
      elements.push(
        <div key={idx} className="text-slate-200 leading-relaxed my-0.5">
          {formatInline(line)}
        </div>
      );
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return <div className="space-y-1 text-xs sm:text-[13px]">{elements}</div>;
  };

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-cyan-200 font-bold">
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
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px] shadow-inner font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <div
        className={`relative z-10 h-full ${
          isExpanded ? "w-full max-w-3xl" : "w-full sm:w-[480px]"
        } bg-[#080d1a]/95 border-l border-cyan-500/30 shadow-2xl backdrop-blur-2xl flex flex-col transition-all duration-300 transform animate-in slide-in-from-right`}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-[#0c1427] via-[#091122] to-[#080d1a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/30 via-cyan-600/30 to-indigo-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">AlphaChanakya AI</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold flex items-center gap-1 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span>Google Gemini 2.5 Flash</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-semibold uppercase">
                  {activeTab === "company" ? "Stock Intelligence" : activeTab === "funds" ? "Fund Alpha" : "Quant Lab"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
              title={isExpanded ? "Contract Drawer" : "Expand Drawer"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Close Drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Context Telemetry Pill */}
        <div className="px-4 py-1.5 bg-slate-950/70 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-cyan-400 font-bold">ACTIVE TELEMETRY:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 truncate">
              {activeTab === "company"
                ? `Stock: ${selectedTicker || "Reliance (Default)"}`
                : activeTab === "funds"
                ? `Fund: ${selectedFundCode || "PPFAS Flexi (Default)"}`
                : "Quant & Stress Lab"}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Hotkey: Cmd+J</span>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans selection:bg-cyan-500 selection:text-slate-950">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              {/* Message Card */}
              <div
                className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-3.5 shadow-xl backdrop-blur-md transition-all ${
                  msg.sender === "user"
                    ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border border-cyan-400/30 rounded-tr-none"
                    : "bg-slate-900/90 text-slate-100 border border-cyan-500/20 rounded-tl-none"
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[10px] font-mono">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    {msg.sender === "user" ? (
                      "You"
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>AlphaChanakya</span>
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.sender === "bot" && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:text-white transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tool Calling Execution Records Pill (if any) */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-2.5 p-2 rounded-lg bg-slate-950/90 border border-cyan-500/30 flex flex-col gap-1 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Zap className="w-3 h-3 animate-bounce" />
                      <span>Quantitative Tools Executed:</span>
                    </div>
                    {msg.toolCalls.map((tc, tci) => (
                      <div key={tci} className="text-slate-300 pl-4 border-l border-cyan-500/40 text-[10px]">
                        <code>{tc.tool}</code> ({Object.keys(tc.arguments).length > 0 ? JSON.stringify(tc.arguments) : "Real-time"})
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                {msg.sender === "user" ? (
                  <p className="text-xs sm:text-[13px] leading-relaxed font-medium">{msg.text}</p>
                ) : (
                  renderFormattedContent(msg.text)
                )}
              </div>

              {/* Dynamic Follow-Up Prompt Chips */}
              {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[92%] sm:max-w-[88%]">
                  {msg.suggestions.map((sug, si) => (
                    <button
                      key={si}
                      onClick={() => handleSendMessage(sug)}
                      className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-[11px] font-sans font-medium transition-all shadow-sm hover:scale-[1.02] active:scale-95 flex items-center gap-1 text-left"
                    >
                      <span>{sug}</span>
                      <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Real-time Tool Calling Loading State */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2.5 shadow-xl animate-pulse">
                <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{executingTool || "AlphaChanakya reasoning across quantitative models..."}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Context Starter Chips (when few messages) */}
        {messages.length <= 2 && dynamicStarterChips.length > 0 && !loading && (
          <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 shrink-0">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Recommended Inquiries:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dynamicStarterChips.map((chip, ci) => (
                <button
                  key={ci}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-sans font-medium transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 focus-within:border-cyan-400 rounded-xl px-3 py-2 shadow-inner transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about stocks, DCF, mutual fund alpha, overlap, or macro..."
              disabled={loading}
              className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              className="p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95 cursor-pointer"
              title="Send prompt (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-500 font-mono">
            <span>Strict financial guardrails active</span>
            <span>InvestDeskPro v1.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
