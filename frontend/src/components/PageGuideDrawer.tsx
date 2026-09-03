"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  BookOpen,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Layers,
  Award,
  ShieldCheck,
  TrendingUp,
  Activity,
  ExternalLink,
  Info,
  CheckCircle2,
  Lightbulb,
  Sliders,
  Scale,
  Zap,
  Crosshair,
  PieChart,
  Target,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import {
  PAGE_GUIDES,
  UNIVERSAL_GLOSSARY,
  STRATEGY_BLUEPRINTS,
  JargonTerm,
  PageGuide,
  StrategyBlueprint,
} from "../data/investDeskKnowledgeBase";

interface PageGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView?: string; // "company360" | "quant" | "screener" | "portfolio"
  quantSubTab?: string; // "stocks" | "funds" | "portfolio"
  initialTerm?: string | null;
}

export const PageGuideDrawer: React.FC<PageGuideDrawerProps> = ({
  isOpen,
  onClose,
  activeView = "company360",
  quantSubTab = "stocks",
  initialTerm = null,
}) => {
  const [selectedDrawerTab, setSelectedDrawerTab] = useState<"page" | "strategies" | "glossary">("page");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTermKey, setSelectedTermKey] = useState<string | null>(null);

  // Sync initial term if opened from an inline tooltip
  useEffect(() => {
    if (initialTerm) {
      setSelectedTermKey(initialTerm);
      setSelectedDrawerTab("glossary");
    }
  }, [initialTerm]);

  // Listen for custom open event
  useEffect(() => {
    const handleCustomOpen = (e: CustomEvent<{ term?: string; tab?: "page" | "strategies" | "glossary" }>) => {
      if (e.detail?.tab) {
        setSelectedDrawerTab(e.detail.tab);
      }
      if (e.detail?.term) {
        setSelectedTermKey(e.detail.term);
        setSelectedDrawerTab("glossary");
      }
    };
    window.addEventListener("open-investdesk-guide" as any, handleCustomOpen);
    return () => window.removeEventListener("open-investdesk-guide" as any, handleCustomOpen);
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Determine current active page guide key
  const pageGuideKey = useMemo(() => {
    if (activeView === "quant") {
      if (quantSubTab === "funds") return "quant_funds";
      if (quantSubTab === "portfolio") return "quant_portfolio";
      return "quant_stocks";
    }
    if (activeView === "screener") return "screener";
    return "company360";
  }, [activeView, quantSubTab]);

  const currentGuide: PageGuide = PAGE_GUIDES[pageGuideKey] || PAGE_GUIDES.company360;

  // Filter glossary items
  const filteredGlossary = useMemo(() => {
    let list = Object.entries(UNIVERSAL_GLOSSARY).map(([key, item]) => ({ key, ...item }));
    if (selectedCategory !== "ALL") {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.term.toLowerCase().includes(q) ||
          (item.acronym && item.acronym.toLowerCase().includes(q)) ||
          item.short_def.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.formula && item.formula.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchQuery, selectedCategory]);

  // Category filter list
  const categories = useMemo(() => {
    const set = new Set<string>();
    Object.values(UNIVERSAL_GLOSSARY).forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["ALL", ...Array.from(set)];
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-text">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#090D16] border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
          
          {/* Top Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/90 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Page Guide & Financial Playbook
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Contextual Intelligence for <strong className="text-cyan-300">{currentGuide.title}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Guide (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strategies, financial terms, formulas (e.g. ROCE, DCF, WACC, Beneish, DCR)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setSelectedDrawerTab("page");
                  setSearchQuery("");
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedDrawerTab === "page"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>📍 Page Guide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDrawerTab("strategies");
                  setSearchQuery("");
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedDrawerTab === "strategies"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>🎯 Strategies ({STRATEGY_BLUEPRINTS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDrawerTab("glossary")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedDrawerTab === "glossary"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>📚 Dictionary ({Object.keys(UNIVERSAL_GLOSSARY).length})</span>
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            
            {/* TAB 1: Current Page Guide */}
            {selectedDrawerTab === "page" && !searchQuery && (
              <div className="space-y-5 animate-fadeIn">
                {/* Operational Blueprint Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Operational Blueprint</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {currentGuide.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentGuide.summary}
                  </p>
                </div>

                {/* Guide Sections */}
                <div className="space-y-4">
                  {currentGuide.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2.5"
                    >
                      <h4 className="text-xs font-bold text-cyan-300 tracking-wide flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        {section.heading}
                      </h4>
                      {section.description && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                      {section.bullets && (
                        <ul className="space-y-1.5 pl-2 text-xs text-slate-300">
                          {section.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span className="leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {section.tips && (
                        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-start gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Pro Tip:</strong> {section.tips}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Practical Example */}
                {currentGuide.example && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold font-mono">
                      <Award className="w-4 h-4" />
                      <span>{currentGuide.example.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentGuide.example.text}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Institutional Strategy Blueprints */}
            {selectedDrawerTab === "strategies" && !searchQuery && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>Institutional Investment Strategy Playbooks</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Pre-defined quantitative and fundamental rulesets designed to maximize risk-adjusted alpha across market cycles.
                  </p>
                </div>

                {STRATEGY_BLUEPRINTS.map((strat) => (
                  <div
                    key={strat.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <span>{strat.name}</span>
                        </h4>
                        <span className="text-[11px] text-amber-400 block font-semibold mt-0.5">
                          {strat.tagline}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                        {strat.idealHoldingPeriod}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {strat.targetProfile}
                    </p>

                    {/* Rules */}
                    <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                      <span className="text-[9px] uppercase font-sans font-bold text-slate-500 block">
                        Core Filter Rules & Metrics:
                      </span>
                      {strat.pillarRules.map((rule, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-1.5 text-cyan-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>

                    {/* Example Equities */}
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                      <span className="text-slate-500">Benchmark Equities:</span>
                      <div className="flex flex-wrap gap-1">
                        {strat.exampleEquities.map((eq) => (
                          <span
                            key={eq}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px]"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Searchable Jargon Dictionary */}
            {(selectedDrawerTab === "glossary" || searchQuery) && (
              <div className="space-y-4 animate-fadeIn">
                {/* Category Filter Chips */}
                {!searchQuery && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Glossary Items List */}
                <div className="space-y-3">
                  {filteredGlossary.map((item) => {
                    const isExpanded = selectedTermKey === item.key;
                    return (
                      <div
                        key={item.key}
                        className={`bg-slate-900/80 border rounded-xl p-4 transition-all ${
                          isExpanded
                            ? "border-cyan-500/60 bg-slate-900 shadow-lg"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div
                          onClick={() => setSelectedTermKey(isExpanded ? null : item.key)}
                          className="flex items-start justify-between cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 font-mono">
                                {item.term}
                              </h4>
                              {item.acronym && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                                  {item.acronym}
                                </span>
                              )}
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-normal">
                              {item.short_def}
                            </p>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-mono ml-2 mt-0.5 shrink-0">
                            {isExpanded ? "Collapse ▲" : "Details ▼"}
                          </span>
                        </div>

                        {/* Expanded Details Card */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 text-xs animate-fadeIn">
                            {/* Formula Box */}
                            {item.formula && (
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                                <span className="text-[9px] uppercase font-sans font-bold text-slate-500 block mb-1">
                                  Mathematical Formula / Ruleset:
                                </span>
                                <code>{item.formula}</code>
                              </div>
                            )}

                            {/* Institutional Edge */}
                            {item.importance && (
                              <div>
                                <span className="text-slate-400 font-semibold block text-[11px] mb-0.5">
                                  Institutional Edge / Why It Matters:
                                </span>
                                <p className="text-slate-300 leading-relaxed">
                                  {item.importance}
                                </p>
                              </div>
                            )}

                            {/* Practical Playbook */}
                            {item.playbook && (
                              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/50 space-y-1 text-cyan-200">
                                <span className="font-bold text-cyan-300 block text-[11px]">
                                  How to Interpret & Invest:
                                </span>
                                <p className="whitespace-pre-line leading-relaxed text-[11px]">
                                  {item.playbook}
                                </p>
                              </div>
                            )}

                            {/* Thresholds Strip */}
                            {item.thresholds && (
                              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                                  <span className="block text-[8px] uppercase text-emerald-500 font-bold">Good / Elite</span>
                                  {item.thresholds.good}
                                </div>
                                <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300">
                                  <span className="block text-[8px] uppercase text-amber-500 font-bold">Moderate / Fair</span>
                                  {item.thresholds.moderate}
                                </div>
                                <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300">
                                  <span className="block text-[8px] uppercase text-rose-500 font-bold">Risk / Avoid</span>
                                  {item.thresholds.bad}
                                </div>
                              </div>
                            )}

                            {/* Example */}
                            {item.example && (
                              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1 text-slate-300">
                                <span className="font-bold text-emerald-400 block text-[11px]">
                                  Practical Example:
                                </span>
                                <p className="leading-relaxed text-[11px]">
                                  {item.example}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredGlossary.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      No financial terms matched &quot;{searchQuery}&quot;. Try searching for ROCE, DCF, WACC, Beneish, DVM, or DCR.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">?</kbd> anytime to toggle Guide</span>
            <span>InvestDeskPro Quantitative Knowledge Base</span>
          </div>
        </div>
      </div>
    </div>
  );
};
