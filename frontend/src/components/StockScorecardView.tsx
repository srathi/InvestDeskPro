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
  Activity,
  Award,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Compass,
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
  { ticker: "RELIANCE", name: "Reliance Ind." },
  { ticker: "TCS", name: "TCS" },
  { ticker: "INFY", name: "Infosys" },
  { ticker: "HDFCBANK", name: "HDFC Bank" },
  { ticker: "ITC", name: "ITC Ltd." },
  { ticker: "LT", name: "Larsen & Toubro" },
  { ticker: "BAJFINANCE", name: "Bajaj Finance" },
];

export const StockScorecardView: React.FC = () => {
  const [tickerInput, setTickerInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockScorecardResponse | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced query for live autocompletion
  const debouncedQuery = useDebounce(tickerInput, 250);

  // Load stock scorecard
  const loadScorecard = async (ticker: string) => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setShowDropdown(false);
    try {
      const res = await fetchStockScorecard(ticker);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load stock scorecard.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch live autocomplete suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      const clean = debouncedQuery.trim();
      if (clean.length >= 1) {
        setIsSearching(true);
        try {
          const results = await searchStocks(clean);
          setSuggestions(results);
          setShowDropdown(results.length > 0);
          setSelectedIndex(-1);
        } catch {
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    };

    fetchSuggestions();
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const selected = suggestions[selectedIndex];
      setTickerInput(selected.ticker.replace(".NS", ""));
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
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const selectSuggestion = (item: StockSearchResult) => {
    setTickerInput(item.ticker.replace(".NS", ""));
    loadScorecard(item.ticker);
    setShowDropdown(false);
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

  return (
    <div className="space-y-6">
      {/* Top Search & Presets Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={tickerInput}
                  onChange={(e) => {
                    setTickerInput(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search NSE/BSE Stock (e.g. RELIANCE, TCS, INFY, ITC)..."
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono uppercase"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-400 animate-spin" />
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-cyan-950 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Analyze</span>
              </button>
            </form>

            {/* Debounced Autocomplete Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto divide-y divide-slate-800/60 z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/60 flex items-center justify-between">
                  <span>Matching Indian Equities</span>
                  <span className="text-[9px] font-mono lowercase">↑↓ navigate • ↵ select</span>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors ${
                      idx === selectedIndex ? "bg-cyan-950/60 text-cyan-200" : "hover:bg-slate-900/80 text-slate-200"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{item.ticker.replace(".NS", "")}</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-800 text-slate-300 rounded">
                          {item.exchange}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-500 hidden sm:inline">{item.sector}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Preset Stock Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Watchlist:</span>
            {PRESET_TICKERS.map((item) => (
              <button
                key={item.ticker}
                onClick={() => {
                  setTickerInput(item.ticker);
                  loadScorecard(item.ticker);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  data?.ticker.includes(item.ticker)
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {item.name}
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

      {loading && !data && (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
          <p className="text-sm font-mono text-slate-400">Computing 0–100 DVM Matrix & Simply Wall St Radar...</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-5 my-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Compass className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white tracking-tight">Select or Search an Indian Stock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose any stock from the watchlist above or type a company name or ticker (e.g. <strong className="text-cyan-300">RELIANCE</strong>, <strong className="text-cyan-300">TCS</strong>, <strong className="text-cyan-300">INFY</strong>, <strong className="text-cyan-300">ITC</strong>) to view its Trendlyne DVM Scorecard, Simply Wall St Radar, and Tickertape Red Flags.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {PRESET_TICKERS.map((item) => (
              <button
                key={item.ticker}
                onClick={() => {
                  setTickerInput(item.ticker);
                  loadScorecard(item.ticker);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-cyan-600 hover:text-cyan-200 transition-all font-mono"
              >
                {item.ticker} ({item.name})
              </button>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Trendlyne DVM Classification Banner */}
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
                      formatter={(val: any) => [`${val} / 100`, "Factor Score"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-400 text-center font-mono">
                Composite Rating: <strong className="text-cyan-300 font-bold">{data.total_score} / 100</strong>
              </div>
            </div>

            {/* Scorecard Sub-Pillars Breakdown */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>Institutional Scorecard Sub-Pillars</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg border ${getScoreColor(data.total_score)}`}>
                    Overall Score: {data.total_score} / 100
                  </span>
                </div>
              </div>

              {/* 3 Pillar Progress Cards */}
              <div className="space-y-3.5">
                {/* 1. Quality / Durability */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" />
                      <span>Quality & Durability Pillar</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{data.quality.grade}</span>
                      <span className="text-cyan-400 font-bold">{data.quality.score} / {data.quality.max_score} pts</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${(data.quality.score / data.quality.max_score) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{data.quality.summary}</p>
                </div>

                {/* 2. Valuation */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>Valuation & Multiples Pillar</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{data.value.grade}</span>
                      <span className="text-emerald-400 font-bold">{data.value.score} / {data.value.max_score} pts</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${(data.value.score / data.value.max_score) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{data.value.summary}</p>
                </div>

                {/* 3. Momentum & Low-Vol */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      <span>Momentum & Volatility Pillar</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{data.momentum_low_vol.grade}</span>
                      <span className="text-indigo-400 font-bold">{data.momentum_low_vol.score} / {data.momentum_low_vol.max_score} pts</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${(data.momentum_low_vol.score / data.momentum_low_vol.max_score) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{data.momentum_low_vol.summary}</p>
                </div>
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
                <span className="text-sm font-bold text-amber-400 mt-1 block">
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
