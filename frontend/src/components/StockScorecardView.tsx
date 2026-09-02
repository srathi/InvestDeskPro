"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Search,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Sparkles,
  Users,
  PieChart as PieIcon,
  Table,
  BarChart3,
  Percent,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  fetchStockScorecard,
  searchStocks,
  StockScorecardResponse,
  StockSearchResult,
} from "../lib/api";
import { useDebounce } from "../hooks/useDebounce";

const PRESET_TICKERS = [
  { ticker: "RELIANCE", name: "Reliance Ind.", sector: "Oil & Gas / Retail", tag: "Large Cap 🏢" },
  { ticker: "TCS", name: "TCS", sector: "IT Services", tag: "High ROCE 💎" },
  { ticker: "PICCADIL", name: "Piccadily Agro", sector: "Distilleries", tag: "Compounder 🚀" },
  { ticker: "INFY", name: "Infosys", sector: "IT & Cloud", tag: "Tech Bluechip 💻" },
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Banking", tag: "Core Bank 🏦" },
  { ticker: "ITC", name: "ITC Ltd.", sector: "FMCG / Cigarettes", tag: "High Dividend 💰" },
  { ticker: "TATAMOTORS", name: "Tata Motors", sector: "Automotive", tag: "EV Leader 🚗" },
  { ticker: "CONFIPET", name: "Confidence Pet.", sector: "LPG Infrastructure", tag: "Small Cap ⚡" },
  { ticker: "LT", name: "Larsen & Toubro", sector: "Capital Goods", tag: "Infra Giant 🏗️" },
  { ticker: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC / Lending", tag: "Retail Credit 💳" },
  { ticker: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma / Healthcare", tag: "Pharma Leader 💊" },
  { ticker: "TATASTEEL", name: "Tata Steel", sector: "Metals & Mining", tag: "Materials ⚙️" },
];

interface StockScorecardViewProps {
  initialTicker?: string;
}

export const StockScorecardView: React.FC<StockScorecardViewProps> = ({ initialTicker = "" }) => {
  const [tickerInput, setTickerInput] = useState(initialTicker || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockScorecardResponse | null>(null);

  // Autocompletion state
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  // Debounced query for live autocompletion
  const debouncedQuery = useDebounce(tickerInput, 250);

  // Load stock scorecard
  const loadScorecard = async (ticker: string) => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setShowDropdown(false);
    setSuggestions([]);
    try {
      const res = await fetchStockScorecard(ticker);
      setData(res);
    } catch (err: any) {
      setData(null);
      setError(err.message || "Failed to load stock scorecard.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch live autocomplete suggestions as user types
  useEffect(() => {
    let isCancelled = false;

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      setShowDropdown(false);
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const clean = debouncedQuery.trim();
      if (clean.length >= 1) {
        setIsSearching(true);
        try {
          const results = await searchStocks(clean);
          if (!isCancelled && !isSelectingRef.current) {
            setSuggestions(results);
            setShowDropdown(results.length > 0);
            setSelectedIndex(-1);
          }
        } catch {
          if (!isCancelled) setSuggestions([]);
        } finally {
          if (!isCancelled) setIsSearching(false);
        }
      } else {
        if (!isCancelled) {
          setSuggestions([]);
          setShowDropdown(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // React to initialTicker prop changes
  useEffect(() => {
    if (initialTicker && initialTicker.trim()) {
      isSelectingRef.current = true;
      setShowDropdown(false);
      setSuggestions([]);
      setTickerInput(initialTicker);
      loadScorecard(initialTicker);
    }
  }, [initialTicker]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isSelectingRef.current = true;
    setShowDropdown(false);
    setSuggestions([]);
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const selected = suggestions[selectedIndex];
      setTickerInput(selected.ticker.replace(".NS", "").replace(".BO", ""));
      loadScorecard(selected.ticker);
    } else if (tickerInput.trim()) {
      loadScorecard(tickerInput.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const selectSuggestion = (item: StockSearchResult) => {
    isSelectingRef.current = true;
    setShowDropdown(false);
    setSuggestions([]);
    setTickerInput(item.ticker.replace(".NS", "").replace(".BO", ""));
    loadScorecard(item.ticker);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 border-emerald-500/30 bg-emerald-950/40";
    if (score >= 50) return "text-cyan-400 border-cyan-500/30 bg-cyan-950/40";
    if (score >= 35) return "text-amber-400 border-amber-500/30 bg-amber-950/40";
    return "text-rose-400 border-rose-500/30 bg-rose-950/40";
  };

  const getDvmBg = (val: number) => {
    if (val >= 65) return "bg-emerald-500 text-slate-950";
    if (val >= 45) return "bg-cyan-500 text-slate-950";
    if (val >= 30) return "bg-amber-500 text-slate-950";
    return "bg-rose-500 text-white";
  };

  const getPegColor = (peg?: number) => {
    if (!peg || peg <= 0) return "text-slate-400";
    if (peg <= 1.0) return "text-emerald-400 font-bold";
    if (peg <= 1.8) return "text-cyan-400 font-bold";
    if (peg <= 2.5) return "text-amber-400 font-semibold";
    return "text-rose-400 font-semibold";
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Top Hero Search & Multiline Suggestions Panel */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-800 space-y-4 relative z-30 shadow-2xl backdrop-blur-xl">
        {/* Full-Width Search Input Bar */}
        <div ref={searchContainerRef} className="relative w-full">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400 pointer-events-none" />
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => {
                isSelectingRef.current = false;
                setTickerInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search any Indian Stock by Symbol or Company Name (e.g. RELIANCE, TCS, PICCADIL, TATAMOTORS, HDFCBANK)..."
              className="w-full bg-slate-950/90 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 rounded-2xl pl-12 pr-36 py-3.5 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all shadow-inner font-mono uppercase"
            />
            {isSearching && (
              <Loader2 className="absolute right-32 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 animate-spin" />
            )}
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-md shadow-cyan-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Analyze Stock</span>
            </button>
          </form>

          {/* Debounced Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto divide-y divide-slate-800/60 z-50">
              <div className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/80 flex items-center justify-between">
                <span>Matching Indian Equities ({suggestions.length})</span>
                <span className="text-[9px] font-mono lowercase">↑↓ navigate • ↵ select • esc close</span>
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={item.ticker}
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs md:text-sm transition-colors ${
                    idx === selectedIndex ? "bg-cyan-950/70 text-cyan-200" : "hover:bg-slate-900/80 text-slate-200"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-sm">{item.ticker.replace(".NS", "").replace(".BO", "")}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded">
                        {item.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 font-mono hidden sm:inline">{item.sector}</span>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Multi-line Quick Presets Panel Below Input */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>High-Conviction Watchlist (Instant 0-100 Factor Audit):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal lowercase hidden sm:inline">click to audit stock</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {PRESET_TICKERS.map((item) => (
              <button
                key={item.ticker}
                onClick={() => {
                  isSelectingRef.current = true;
                  setShowDropdown(false);
                  setSuggestions([]);
                  setTickerInput(item.ticker);
                  loadScorecard(item.ticker);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  data?.ticker.includes(item.ticker)
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-md shadow-cyan-950 font-semibold"
                    : "bg-slate-900/70 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <span className="font-mono font-bold text-white">{item.ticker}</span>
                <span className="text-slate-400">({item.name})</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/80">
                  {item.sector}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">
                  {item.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="space-y-6 animate-pulse py-4">
          <div className="glass-panel p-8 rounded-3xl border border-cyan-800/40 text-center space-y-5 my-2 relative overflow-hidden bg-gradient-to-b from-cyan-950/20 to-slate-950/80">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white tracking-tight">
                Computing 0–100 Factor Scorecard for <span className="text-cyan-400 font-mono uppercase">{tickerInput || "Selected Stock"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Analyzing Financial Statements, Durability-Valuation-Momentum (DVM) Archetypes, Piotroski F-Score & Altman Z-Score Probes...
              </p>
            </div>
            {/* Animated Loading Bar */}
            <div className="max-w-xs mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 animate-pulse w-full" />
            </div>
          </div>

          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 space-y-3">
                <div className="h-4 w-28 bg-slate-800 rounded" />
                <div className="h-8 w-20 bg-slate-800/80 rounded" />
                <div className="h-3 w-full bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-5 my-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Select or Search an Indian Stock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore 0–100 Durability, Valuation & Momentum (DVM) scorecards, Screener.in-grade annual financials, shareholding pattern, calculated PEG ratio, and growth archetype classifications.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-3xl mx-auto">
            {PRESET_TICKERS.map((item) => (
              <button
                key={item.ticker}
                onClick={() => {
                  setTickerInput(item.ticker);
                  loadScorecard(item.ticker);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-700 transition-all font-mono flex items-center gap-1.5"
              >
                <span className="font-bold text-white">{item.ticker}</span>
                <span className="text-slate-400">({item.name})</span>
                <span className="text-[10px] text-cyan-400">{item.tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Header Banner: Company Info + DVM Classification */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-white tracking-tight">{data.company_name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-cyan-300 rounded-md border border-cyan-800/80">
                    {data.ticker}
                  </span>
                  <span className="px-3 py-0.5 text-xs font-semibold rounded-md border bg-indigo-950/60 text-indigo-300 border-indigo-700/80 flex items-center gap-1">
                    <Compass className="h-3 w-3 text-indigo-400" />
                    <span>{data.dvm.classification}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>Sector: <strong className="text-slate-300">{data.sector}</strong></span>
                  <span>•</span>
                  <span>Industry: <strong className="text-slate-300">{data.industry}</strong></span>
                  {data.fundamentals.market_cap && (
                    <>
                      <span>•</span>
                      <span>Market Cap: <strong className="text-slate-300 font-mono">₹{(data.fundamentals.market_cap / 1e7).toFixed(1)} Cr</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Trendlyne DVM 3-Pillar Score Badges */}
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="text-center px-3 py-1 border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Durability</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-black rounded font-mono ${getDvmBg(data.dvm.durability)}`}>
                      {data.dvm.durability}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Quality (40%)</span>
                </div>

                <div className="text-center px-3 py-1 border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valuation</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-black rounded font-mono ${getDvmBg(data.dvm.valuation)}`}>
                      {data.dvm.valuation}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Price / Book (30%)</span>
                </div>

                <div className="text-center px-3 py-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Momentum</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-black rounded font-mono ${getDvmBg(data.dvm.momentum)}`}>
                      {data.dvm.momentum}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Trend / Vol (30%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Style & Growth Classification Card */}
          {data.classification && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Stock Archetype & Growth Profile</span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{data.classification.stock_type}</span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                    data.classification.is_growth_stock
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80"
                      : "bg-slate-900 text-slate-300 border-slate-700"
                  }`}>
                    Growth Stock: {data.classification.is_growth_stock ? "YES" : "NO"}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded-lg">
                    Growth Score: {data.classification.growth_score}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">3-Year Revenue CAGR</span>
                  <span className={`text-base font-bold mt-1 block ${
                    (data.classification.cagr_3y_revenue || 0) >= 15 ? "text-emerald-400" : "text-slate-200"
                  }`}>
                    {data.classification.cagr_3y_revenue !== null && data.classification.cagr_3y_revenue !== undefined
                      ? `+${data.classification.cagr_3y_revenue}%`
                      : "N/A"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Topline expansion rate</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">3-Year Net Profit CAGR</span>
                  <span className={`text-base font-bold mt-1 block ${
                    (data.classification.cagr_3y_profit || 0) >= 18 ? "text-emerald-400" : "text-slate-200"
                  }`}>
                    {data.classification.cagr_3y_profit !== null && data.classification.cagr_3y_profit !== undefined
                      ? `+${data.classification.cagr_3y_profit}%`
                      : "N/A"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Bottomline compounding rate</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">PEG Valuation Multiple</span>
                  <span className={`text-base font-bold mt-1 block ${getPegColor(data.fundamentals.peg_ratio)}`}>
                    {data.fundamentals.peg_ratio ? `${data.fundamentals.peg_ratio.toFixed(2)}x` : "N/A"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Price / Earnings-to-Growth</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                <Compass className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Institutional Diagnostic:</strong> {data.classification.rationale}</span>
              </div>
            </div>
          )}

          {/* Annual Financial Statements (Screener.in Table) */}
          {data.financials_annual && data.financials_annual.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Annual Financial Statements (Screener.in Model)</h3>
                </div>
                <span className="text-xs font-mono text-slate-500">Figures in ₹ Crores (Except EPS)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/60">
                      <th className="py-2.5 px-3 font-semibold text-slate-300">Metric</th>
                      {data.financials_annual.map((yr) => (
                        <th key={yr.year} className="py-2.5 px-3 text-right font-bold text-slate-200">
                          {yr.year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 font-semibold text-white">Sales / Revenue (₹ Cr)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right text-slate-200">
                          {yr.revenue_cr !== null && yr.revenue_cr !== undefined ? `₹${yr.revenue_cr.toLocaleString()}` : "—"}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 text-slate-400">YoY Sales Growth (%)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right">
                          {yr.yoy_revenue_growth_pct !== null && yr.yoy_revenue_growth_pct !== undefined ? (
                            <span className={yr.yoy_revenue_growth_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {yr.yoy_revenue_growth_pct >= 0 ? `+${yr.yoy_revenue_growth_pct}%` : `${yr.yoy_revenue_growth_pct}%`}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 font-semibold text-white">Operating Profit / EBITDA (₹ Cr)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right text-cyan-300">
                          {yr.operating_profit_cr !== null && yr.operating_profit_cr !== undefined ? `₹${yr.operating_profit_cr.toLocaleString()}` : "—"}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 text-slate-400">OPM (%)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right text-slate-300">
                          {yr.opm_pct !== null && yr.opm_pct !== undefined ? `${yr.opm_pct}%` : "—"}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors bg-cyan-950/10">
                      <td className="py-2 px-3 font-bold text-white">Net Profit (₹ Cr)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right font-bold text-emerald-400">
                          {yr.net_profit_cr !== null && yr.net_profit_cr !== undefined ? `₹${yr.net_profit_cr.toLocaleString()}` : "—"}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 text-slate-400">YoY Net Profit Growth (%)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right">
                          {yr.yoy_profit_growth_pct !== null && yr.yoy_profit_growth_pct !== undefined ? (
                            <span className={yr.yoy_profit_growth_pct >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                              {yr.yoy_profit_growth_pct >= 0 ? `+${yr.yoy_profit_growth_pct}%` : `${yr.yoy_profit_growth_pct}%`}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 text-slate-400">NPM (%)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right text-slate-300">
                          {yr.npm_pct !== null && yr.npm_pct !== undefined ? `${yr.npm_pct}%` : "—"}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 font-semibold text-white">EPS (₹)</td>
                      {data.financials_annual.map((yr) => (
                        <td key={yr.year} className="py-2 px-3 text-right font-bold text-slate-200">
                          {yr.eps !== null && yr.eps !== undefined ? `₹${yr.eps.toFixed(2)}` : "—"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shareholding Pattern Card (Screener.in / Trendlyne Model) */}
          {data.shareholding && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Shareholding Pattern & Insider Pledge</h3>
                </div>
                <span className="text-xs font-mono text-slate-500">Screener.in / Trendlyne Model</span>
              </div>

              {/* Visual Distribution Stacked Bar */}
              <div className="space-y-1.5">
                <div className="h-4 w-full bg-slate-900 rounded-lg overflow-hidden flex">
                  <div
                    style={{ width: `${data.shareholding.promoters_pct}%` }}
                    className="bg-cyan-500 h-full transition-all"
                    title={`Promoters: ${data.shareholding.promoters_pct}%`}
                  />
                  <div
                    style={{ width: `${data.shareholding.institutions_pct}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Institutions: ${data.shareholding.institutions_pct}%`}
                  />
                  <div
                    style={{ width: `${data.shareholding.public_retail_pct}%` }}
                    className="bg-slate-600 h-full transition-all"
                    title={`Public / Retail: ${data.shareholding.public_retail_pct}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" /> Promoters ({data.shareholding.promoters_pct}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Institutions ({data.shareholding.institutions_pct}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600" /> Public ({data.shareholding.public_retail_pct}%)
                  </span>
                </div>
              </div>

              {/* Detailed Category Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Promoter Holding</span>
                  <span className="text-sm font-bold text-cyan-400 mt-1 block">
                    {data.shareholding?.promoters_pct ?? 0}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">FII Holding</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">
                    {data.shareholding?.fii_pct ?? (data.shareholding?.institutions_pct ? (data.shareholding.institutions_pct * 0.6).toFixed(2) : "0.00")}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">DII / Mutual Funds</span>
                  <span className="text-sm font-bold text-indigo-300 mt-1 block">
                    {data.shareholding?.dii_pct ?? (data.shareholding?.institutions_pct ? (data.shareholding.institutions_pct * 0.4).toFixed(2) : "0.00")}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Public / Retail</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">
                    {data.shareholding?.public_retail_pct ?? 0}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Promoter Pledge</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">
                    {(data.shareholding?.pledged_pct ?? 0) === 0 ? "0.0% (Clean)" : `${data.shareholding?.pledged_pct}%`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Simply Wall St Snowflake Radar & Factor Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simply Wall St 5-Axis Radar Diagram */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Factor Snowflake Radar</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Simply Wall St Model</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radar_axes}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="axis" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                    <Radar
                      name={data.ticker}
                      dataKey="value"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.4}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${val}/100`, "Factor Score"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Composite Rating:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${getScoreColor(data.total_score)}`}>
                  {data.total_score} / 100
                </span>
              </div>
            </div>

            {/* Pillar Breakdown (Quality, Value, Momentum) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quality Factor */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Quality & Capital Efficiency</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {data.quality.score} / {data.quality.max_score} pts • {data.quality.grade}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${(data.quality.score / data.quality.max_score) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{data.quality.summary}</p>
              </div>

              {/* Value Factor */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">Valuation Multiples</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {data.value.score} / {data.value.max_score} pts • {data.value.grade}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${(data.value.score / data.value.max_score) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{data.value.summary}</p>
              </div>

              {/* Momentum Factor */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">Momentum & Realized Low-Volatility</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {data.momentum_low_vol.score} / {data.momentum_low_vol.max_score} pts • {data.momentum_low_vol.grade}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${(data.momentum_low_vol.score / data.momentum_low_vol.max_score) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{data.momentum_low_vol.summary}</p>
              </div>
            </div>
          </div>

          {/* Tickertape Health Checks & Red Flags */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Tickertape-Style Asset Health & Red Flags</span>
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{data.flags.green_flags.length} Strengths</span>
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{data.flags.red_flags.length} Alerts</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Green Flags (Strengths) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Positive Fundamental Triggers (Green Flags)
                </span>
                <div className="space-y-1.5">
                  {data.flags.green_flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags (Risk Alerts) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                  Potential Risk Checks (Red Flags)
                </span>
                <div className="space-y-1.5">
                  {data.flags.red_flags.length > 0 ? (
                    data.flags.red_flags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-200 flex items-start gap-2.5"
                      >
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>No critical red flags detected. Clean solvency and liquidity profile.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Financial Ratios Matrix */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>Key Financial Ratios</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">NSE / BSE Live</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">ROE</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">
                  {data.fundamentals.roe !== null && data.fundamentals.roe !== undefined ? `${data.fundamentals.roe}%` : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">ROCE / ROA</span>
                <span className="text-sm font-bold text-cyan-400 mt-1 block">
                  {data.fundamentals.roce !== null && data.fundamentals.roce !== undefined ? `${data.fundamentals.roce}%` : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Debt to Equity</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {data.fundamentals.debt_to_equity !== null && data.fundamentals.debt_to_equity !== undefined
                    ? `${data.fundamentals.debt_to_equity}`
                    : "Zero Debt"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Trailing P/E</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {data.fundamentals.trailing_pe ? `${data.fundamentals.trailing_pe.toFixed(1)}x` : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">PEG Ratio</span>
                <span className={`text-sm font-bold mt-1 block ${getPegColor(data.fundamentals.peg_ratio)}`}>
                  {data.fundamentals.peg_ratio ? `${data.fundamentals.peg_ratio.toFixed(2)}` : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Price to Book</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {data.fundamentals.price_to_book ? `${data.fundamentals.price_to_book.toFixed(2)}x` : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">6M Return</span>
                <span className={`text-sm font-bold mt-1 block ${
                  (data.fundamentals.return_6m || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {data.fundamentals.return_6m !== null && data.fundamentals.return_6m !== undefined
                    ? `${data.fundamentals.return_6m >= 0 ? "+" : ""}${data.fundamentals.return_6m}%`
                    : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">60D Realized Vol</span>
                <span className="text-sm font-bold text-slate-300 mt-1 block">
                  {data.fundamentals.realized_vol_60d ? `${data.fundamentals.realized_vol_60d}% ann.` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* 1-Year Historical Price Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span>1-Year Historical Price Performance</span>
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                {data.fundamentals.current_price && (
                  <span className="text-slate-200">
                    Latest Close: <strong className="text-cyan-400">₹{data.fundamentals.current_price.toFixed(2)}</strong>
                  </span>
                )}
                {data.fundamentals.return_1y !== null && data.fundamentals.return_1y !== undefined && (
                  <span className={`font-bold ${data.fundamentals.return_1y >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    1Y Return: {data.fundamentals.return_1y >= 0 ? `+${data.fundamentals.return_1y}%` : `${data.fundamentals.return_1y}%`}
                  </span>
                )}
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {data.price_history && data.price_history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.price_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Close Price"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#priceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  Price history unavailable for this ticker.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
