"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  LineChart as LineChartIcon,
  ShieldCheck,
  Zap,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Compass,
  Grid,
  TrendingUp,
  Award,
  Sparkles,
  Flame,
  Clock,
  ArrowRightLeft,
  Coins,
  ShieldAlert,
  Sliders,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  fetchFundAnalysis,
  searchFunds,
  FundAnalysisResponse,
  FundSearchResult,
  CategoryAlternativeFund,
} from "../lib/api";
import { useDebounce } from "../hooks/useDebounce";
import { JargonTooltip } from "./JargonTooltip";

const POPULAR_FUNDS = [
  { code: "122639", name: "Parag Parikh Flexi Cap", category: "Flexi Cap", tag: "In-Form 🔥" },
  { code: "118825", name: "Mirae Asset Large Cap", category: "Large Cap", tag: "Core 🛡️" },
  { code: "118955", name: "HDFC Flexi Cap", category: "Flexi Cap", tag: "In-Form 🔥" },
  { code: "120828", name: "Quant Small Cap", category: "Small Cap", tag: "Momentum ⚡" },
  { code: "125497", name: "SBI Small Cap", category: "Small Cap", tag: "Shield 🛡️" },
  { code: "120505", name: "Axis Midcap", category: "Mid Cap", tag: "Compounder 📈" },
  { code: "118778", name: "Nippon India Small Cap", category: "Small Cap", tag: "Top Alpha ⭐" },
  { code: "125354", name: "Axis Small Cap", category: "Small Cap", tag: "Low Vol 🛡️" },
  { code: "127042", name: "Motilal Oswal Midcap", category: "Mid Cap", tag: "In-Form 🔥" },
  { code: "118968", name: "HDFC Balanced Advantage", category: "Hybrid", tag: "All-Weather ⚖️" },
];

interface FundAnalyzerViewProps {
  initialSchemeCode?: string;
}

export const FundAnalyzerView: React.FC<FundAnalyzerViewProps> = ({
  initialSchemeCode = "",
}) => {
  const [schemeCode, setSchemeCode] = useState(initialSchemeCode || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FundAnalysisResponse | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<"rolling_alpha" | "underwater_drawdown">("rolling_alpha");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  // Debounce search query by 300ms
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (initialSchemeCode && initialSchemeCode.trim()) {
      const cleanCode = initialSchemeCode.replace("AMFI #", "").trim();
      isSelectingRef.current = true;
      setShowDropdown(false);
      setSearchResults([]);
      setSchemeCode(cleanCode);
      loadFund(cleanCode);
    }
  }, [initialSchemeCode]);

  const loadFund = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setShowDropdown(false);
    setSearchResults([]);
    try {
      const res = await fetchFundAnalysis(code);
      setData(res);
      setSchemeCode(code);
    } catch (err: any) {
      setData(null);
      setError(err.message || "Failed to analyze mutual fund scheme.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced auto-search for matching AMFI schemes
  useEffect(() => {
    let isCancelled = false;

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    const fetchMatchingFunds = async () => {
      const clean = debouncedQuery.trim();
      if (clean.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchFunds(clean);
          if (!isCancelled && !isSelectingRef.current) {
            setSearchResults(results);
            setShowDropdown(results.length > 0);
            setSelectedIndex(-1);
          }
        } catch {
          if (!isCancelled) setSearchResults([]);
        } finally {
          if (!isCancelled) setIsSearching(false);
        }
      } else {
        if (!isCancelled) {
          setSearchResults([]);
          setShowDropdown(false);
        }
      }
    };

    fetchMatchingFunds();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Click outside listener to close dropdown
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
    const clean = searchQuery.trim();
    if (!clean) return;

    isSelectingRef.current = true;
    setShowDropdown(false);
    setSearchResults([]);

    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
      const selected = searchResults[selectedIndex];
      setSchemeCode(selected.scheme_code);
      loadFund(selected.scheme_code);
      setSearchQuery(selected.scheme_name);
    } else if (searchResults.length > 0) {
      const first = searchResults[0];
      setSchemeCode(first.scheme_code);
      loadFund(first.scheme_code);
      setSearchQuery(first.scheme_name);
    } else {
      const digits = clean.replace(/[^0-9]/g, "");
      if (digits) {
        setSchemeCode(digits);
        loadFund(digits);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const selectFund = (fund: FundSearchResult) => {
    isSelectingRef.current = true;
    setShowDropdown(false);
    setSearchResults([]);
    setSchemeCode(fund.scheme_code);
    loadFund(fund.scheme_code);
    setSearchQuery(fund.scheme_name);
  };

  // Helper for PowerUp Form Status styling
  const getFormStatusPill = (status?: string) => {
    switch (status) {
      case "in_form":
        return {
          bg: "bg-emerald-950/80 border-emerald-600/80 text-emerald-300",
          icon: <Flame className="h-4 w-4 text-emerald-400 animate-pulse" />,
          label: "In-Form (Top Tier)",
          border: "border-emerald-500/40",
        };
      case "on_track":
        return {
          bg: "bg-cyan-950/80 border-cyan-600/80 text-cyan-300",
          icon: <CheckCircle2 className="h-4 w-4 text-cyan-400" />,
          label: "On-Track (Stable Core)",
          border: "border-cyan-500/40",
        };
      case "off_track":
        return {
          bg: "bg-amber-950/80 border-amber-600/80 text-amber-300",
          icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
          label: "Off-Track (Decaying Momentum)",
          border: "border-amber-500/40",
        };
      case "out_of_form":
      default:
        return {
          bg: "bg-rose-950/80 border-rose-600/80 text-rose-300",
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          label: "Out-of-Form (Laggard)",
          border: "border-rose-500/40",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Top Hero Search & Multiline Suggestions Panel */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-800 space-y-4 relative z-30 shadow-2xl backdrop-blur-xl">
        {/* Full-Width Search Input Bar */}
        <div ref={searchContainerRef} className="relative w-full">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                isSelectingRef.current = false;
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search any Indian Mutual Fund by Scheme Name or AMFI Code (e.g. 122639, Parag Parikh Flexi, HDFC, SBI Small Cap)..."
              className="w-full bg-slate-950/90 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-2xl pl-12 pr-36 py-3.5 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
            />
            {isSearching && (
              <Loader2 className="absolute right-32 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 animate-spin" />
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Search AMFI</span>
            </button>
          </form>

          {/* Debounced Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto divide-y divide-slate-800/60 z-50">
              <div className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/80 flex items-center justify-between">
                <span>Matching AMFI Schemes ({searchResults.length})</span>
                <span className="text-[9px] font-mono lowercase">↑↓ navigate • ↵ select • esc close</span>
              </div>
              {searchResults.map((fund, idx) => (
                <button
                  key={fund.scheme_code}
                  type="button"
                  onClick={() => selectFund(fund)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs md:text-sm transition-colors ${
                    idx === selectedIndex ? "bg-emerald-950/70 text-emerald-200" : "hover:bg-slate-900/80 text-slate-200"
                  }`}
                >
                  <span className="truncate pr-4 text-slate-200 font-medium">{fund.scheme_name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-emerald-400 text-xs bg-emerald-950/90 border border-emerald-800 px-2.5 py-0.5 rounded-lg">
                      #{fund.scheme_code}
                    </span>
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
              <span>Popular High-Volume Schemes (Instant 1-Click Institutional Audit):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal lowercase hidden sm:inline">click to audit scheme</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {POPULAR_FUNDS.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  isSelectingRef.current = true;
                  setShowDropdown(false);
                  setSearchResults([]);
                  setSchemeCode(item.code);
                  loadFund(item.code);
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  schemeCode === item.code
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-md shadow-emerald-950"
                    : "bg-slate-900/70 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <span>{item.name}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/80">
                  {item.category}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
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
          <div className="glass-panel p-8 rounded-3xl border border-emerald-800/40 text-center space-y-5 my-2 relative overflow-hidden bg-gradient-to-b from-emerald-950/20 to-slate-950/80">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white tracking-tight">
                Auditing Mutual Fund Scheme <span className="text-emerald-400 font-mono uppercase">{schemeCode ? `#${schemeCode}` : "AMFI"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Ingesting AMFI Historical NAV, Calculating 1Y/3Y/5Y Rolling Distributions, PowerUp 4-State Form Status & Downside Protection Cushion...
              </p>
            </div>
            {/* Animated Loading Bar */}
            <div className="max-w-xs mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse w-full" />
            </div>
          </div>

          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 space-y-3">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-8 w-24 bg-slate-800/80 rounded" />
                <div className="h-3 w-full bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-5 my-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Flame className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white tracking-tight">Select or Search an AMFI Mutual Fund</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience institutional mutual fund intelligence: <strong>PowerUp 4-State Form Status</strong>, <strong>Rolling Return Probability Distributions</strong>, <strong>Downside Capture Shields</strong>, <strong>Underwater Drawdown Recovery</strong>, and <strong>5-Pillar Scorecards</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-3xl mx-auto">
            {POPULAR_FUNDS.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setSchemeCode(item.code);
                  loadFund(item.code);
                  setSearchQuery("");
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-emerald-600 hover:text-emerald-200 transition-all font-mono flex items-center gap-1.5"
              >
                <span>{item.name}</span>
                <span className="text-[10px] text-emerald-400">({item.category})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* 1. Header Card with PowerUp Form Status & Institutional Rating */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-white tracking-tight">{data.meta.scheme_name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-slate-300 rounded-md border border-slate-800">
                    AMFI #{data.meta.scheme_code}
                  </span>

                  {/* PowerUp 4-State Form Pill */}
                  {data.form_rating && (
                    <JargonTooltip termKey="powerup_form_rating">
                      <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold cursor-help ${getFormStatusPill(data.form_rating.status).bg}`}>
                        {getFormStatusPill(data.form_rating.status).icon}
                        <span>{data.form_rating.status_title}</span>
                      </div>
                    </JargonTooltip>
                  )}

                  {/* Institutional Scorecard Badge */}
                  {data.scorecard && (
                    <JargonTooltip termKey="rolling_returns" title="5-Pillar Scorecard">
                      <span className="px-3 py-1 text-xs font-bold rounded-lg border bg-emerald-950/70 text-emerald-300 border-emerald-700/80 flex items-center gap-1.5 cursor-help">
                        <Award className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{data.scorecard.grade} Grade ({data.scorecard.total_score}/100)</span>
                      </span>
                    </JargonTooltip>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {data.meta.fund_house && <span>Fund House: <strong className="text-slate-300">{data.meta.fund_house}</strong></span>}
                  {data.meta.scheme_category && (
                    <>
                      <span>•</span>
                      <span>Category: <strong className="text-slate-300">{data.meta.scheme_category}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <span>Benchmark: <strong className="text-emerald-400">{data.benchmark_name}</strong></span>
                </div>

                {/* PowerUp Action Recommendation Box */}
                {data.form_rating && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-300">
                        <strong className="text-white font-semibold">Action Verdict: </strong>
                        {data.form_rating.action_recommendation}
                      </span>
                    </div>
                    {data.scorecard && (
                      <span className="text-slate-400 font-mono text-[11px] shrink-0">
                        {data.scorecard.verdict}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Latest NAV */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Latest Net Asset Value</span>
                  <div className="text-2xl font-black text-white font-mono font-tabular mt-0.5">
                    ₹{data.latest_nav.toFixed(4)}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>As of {data.latest_nav_date}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Badges & Warning Ribbon */}
            {data.scorecard && (data.scorecard.positive_badges.length > 0 || data.scorecard.warning_flags.length > 0) && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                {data.scorecard.positive_badges.map((badge, idx) => (
                  <span key={`pos-${idx}`} className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>{badge}</span>
                  </span>
                ))}
                {data.scorecard.warning_flags.map((flag, idx) => (
                  <span key={`warn-${idx}`} className="px-2.5 py-1 rounded-md bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                    <span>{flag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Smart Category Alternative Switcher (PowerUp Switch Recommendation) */}
          {data.suggested_alternatives && data.suggested_alternatives.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Smart Category Peer Alternatives (In-Form Benchmarks)</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Category: <strong className="text-cyan-300">{data.meta.scheme_category || "Equity"}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.suggested_alternatives.map((alt) => (
                  <div
                    key={alt.scheme_code}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-700/80 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {alt.form_status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">#{alt.scheme_code}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {alt.scheme_name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">3Y Rolling Alpha</span>
                        <span className="font-bold text-emerald-400">+{alt.alpha_3y}%</span>
                        {alt.alpha_delta_pct !== 0 && (
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            ({alt.alpha_delta_pct > 0 ? `+${alt.alpha_delta_pct}%` : `${alt.alpha_delta_pct}%`} vs this fund)
                          </span>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Downside Capture</span>
                        <span className="font-bold text-cyan-300">{alt.downside_capture}%</span>
                        <span className="text-[9px] text-emerald-400 block mt-0.5">
                          {alt.dcr_improvement_pct > 0 ? `${alt.dcr_improvement_pct}% lower drop` : "In-line"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSchemeCode(alt.scheme_code);
                        loadFund(alt.scheme_code);
                        setSearchQuery(alt.scheme_name);
                      }}
                      className="w-full py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Analyze This Alternative</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Rolling Return Probability Distributions (Beyond Past Trailing Returns) */}
          {data.rolling_distributions && data.rolling_distributions.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Rolling Return Probability Distributions (1Y, 3Y, 5Y Horizons)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    True compounding probability across thousands of historical random entry dates, eliminating point-to-point trailing bias.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg">
                  Zero Trailing Return Bias
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.rolling_distributions.map((dist) => (
                  <div
                    key={dist.horizon_label}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{dist.horizon_label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{dist.periods_count} Sampled Windows</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Median Expected Return</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono font-tabular">
                          {dist.median_cagr.toFixed(2)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">Worst Period (Min)</span>
                          <span className={`font-bold ${dist.min_cagr >= 0 ? "text-slate-200" : "text-rose-400"}`}>
                            {dist.min_cagr.toFixed(2)}%
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">Best Period (Max)</span>
                          <span className="font-bold text-cyan-300">
                            +{dist.max_cagr.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Negative Return Probability & Benchmark Hit Rate */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Risk of Negative Return:</span>
                          <span className={`font-mono font-bold ${dist.prob_negative_pct === 0 ? "text-emerald-400" : "text-amber-300"}`}>
                            {dist.prob_negative_pct}% Probability
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Beat Nifty 50 Hit Rate:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {dist.hit_rate_vs_bench_pct}% of times
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                            style={{ width: `${dist.hit_rate_vs_bench_pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Downside Shield, Style Box & Risk Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Downside vs Upside Capture Shield */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Downside Protection Shield</span>
                </h3>
                {data.stats.downside_capture_ratio <= 85 && (
                  <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-semibold">
                    ELITE SHIELD
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <JargonTooltip termKey="downside_capture">
                    <span className="text-xs text-slate-400">Downside Capture Ratio (DCR)</span>
                  </JargonTooltip>
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {data.stats.downside_capture_ratio}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Upside Capture Ratio (UCR)</span>
                  <span className="text-xl font-bold text-cyan-300 font-mono">
                    {data.stats.upside_capture_ratio}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">Asymmetric Capture Spread:</span>
                  <span className="font-bold text-emerald-400">
                    +{data.stats.asymmetric_capture_spread}% Spread
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                A downside capture &lt;80% ensures the fund drops significantly less than the benchmark during market pullbacks.
              </p>
            </div>

            {/* Morningstar Style Box */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Grid className="h-4 w-4 text-cyan-400" />
                  <span>Morningstar Style Box</span>
                </h3>
                <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                  {data.style_box.size} Cap / {data.style_box.style}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-center text-[10px] font-mono">
                <div className="text-slate-500 uppercase font-semibold">Value</div>
                <div className="text-slate-500 uppercase font-semibold">Blend</div>
                <div className="text-slate-500 uppercase font-semibold">Growth</div>

                {["Value", "Blend", "Growth"].map((st) => {
                  const isActive = data.style_box.size === "Large" && data.style_box.style === st;
                  return (
                    <div
                      key={`large-${st}`}
                      className={`p-2 rounded-lg border transition-all ${
                        isActive
                          ? "bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-950"
                          : "bg-slate-900/60 text-slate-400 border-slate-800"
                      }`}
                    >
                      Large
                    </div>
                  );
                })}

                {["Value", "Blend", "Growth"].map((st) => {
                  const isActive = (data.style_box.size === "Mid" || data.style_box.size === "Flexi") && data.style_box.style === st;
                  return (
                    <div
                      key={`mid-${st}`}
                      className={`p-2 rounded-lg border transition-all ${
                        isActive
                          ? "bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-950"
                          : "bg-slate-900/60 text-slate-400 border-slate-800"
                      }`}
                    >
                      {data.style_box.size === "Flexi" ? "Flexi" : "Mid"}
                    </div>
                  );
                })}

                {["Value", "Blend", "Growth"].map((st) => {
                  const isActive = data.style_box.size === "Small" && data.style_box.style === st;
                  return (
                    <div
                      key={`small-${st}`}
                      className={`p-2 rounded-lg border transition-all ${
                        isActive
                          ? "bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-950"
                          : "bg-slate-900/60 text-slate-400 border-slate-800"
                      }`}
                    >
                      Small
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Reflects market capitalization focus and factor tilt.
              </div>
            </div>

            {/* Investor Horizon & 10Y Cost Drag */}
            {data.playbook && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>Horizon & Cost Playbook</span>
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold font-mono">
                    ≥ {data.playbook.min_recommended_horizon_years}Y Rec
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recommended Duration</span>
                    <strong className="text-white font-medium block mt-0.5">{data.playbook.horizon_title}</strong>
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">{data.playbook.horizon_rationale}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold block">10Y Direct Plan Savings</span>
                      <span className="text-[11px] text-slate-300">Wealth preserved on ₹10L</span>
                    </div>
                    <span className="text-lg font-black text-emerald-300 font-mono">
                      +₹{data.playbook.direct_vs_regular_10y_drag_lakhs}L
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Dual-Mode Interactive Chart: 3Y Rolling Alpha vs Underwater Drawdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveChartTab("rolling_alpha")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeChartTab === "rolling_alpha"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-md shadow-emerald-950"
                        : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>3Y Rolling Alpha (%)</span>
                  </button>
                  <button
                    onClick={() => setActiveChartTab("underwater_drawdown")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeChartTab === "underwater_drawdown"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md shadow-cyan-950"
                        : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Underwater Drawdowns (%)</span>
                  </button>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {activeChartTab === "rolling_alpha"
                    ? `Mean Alpha: +${data.stats.mean_3y_rolling_alpha}% vs Nifty 50 TRI`
                    : `Max Fund Drawdown: -${data.stats.max_drawdown_pct}%`}
                </span>
              </div>

              {/* Chart Rendering */}
              <div className="h-72 w-full pt-4">
                {activeChartTab === "rolling_alpha" ? (
                  data.rolling_series && data.rolling_series.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.rolling_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rollingAlphaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} tickFormatter={(v) => v.slice(0, 7)} />
                        <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "0.75rem",
                            color: "#f8fafc",
                            fontSize: "12px",
                          }}
                          formatter={(value: any, name: any) => [
                            `${Number(value).toFixed(2)}%`,
                            name === "rolling_alpha" ? "3Y Rolling Alpha" : name,
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                        <Area type="monotone" dataKey="rolling_alpha" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#rollingAlphaGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                      Insufficient historical dates to plot rolling alpha chart.
                    </div>
                  )
                ) : (
                  data.drawdown_series && data.drawdown_series.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.drawdown_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fundDrawdownGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} tickFormatter={(v) => v.slice(0, 7)} />
                        <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `-${v.toFixed(0)}%`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "0.75rem",
                            color: "#f8fafc",
                            fontSize: "12px",
                          }}
                          formatter={(value: any, name: any) => [
                            `-${Number(value).toFixed(2)}%`,
                            name === "fund_drawdown_pct" ? "Fund Drawdown" : "Benchmark Drawdown",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area type="monotone" dataKey="benchmark_drawdown_pct" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" fill="transparent" />
                        <Area type="monotone" dataKey="fund_drawdown_pct" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#fundDrawdownGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                      Insufficient historical data for drawdown chart.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Risk & Historical Crash Recovery Events */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <span>Crisis Recovery Timeline</span>
              </h3>

              <div className="space-y-3">
                {data.drawdown_events && data.drawdown_events.map((evt, idx) => (
                  <div key={`evt-${idx}`} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-semibold">{evt.event_name}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{evt.period_label}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                      <div className="text-slate-400">
                        Fund Drop: <strong className="text-amber-300">-{evt.fund_max_drawdown_pct}%</strong>
                      </div>
                      <div className="text-slate-400">
                        Index Drop: <span className="text-slate-300">-{evt.benchmark_max_drawdown_pct}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800/60 text-slate-400">
                      <span>Recovery: <strong className="text-cyan-300">{evt.recovery_days_fund} days</strong></span>
                      <span className="text-emerald-400 font-semibold">+{evt.downside_cushion_pct}% Cushion</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Institutional 5-Pillar Scorecard Breakdown */}
          {data.scorecard && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Institutional 5-Pillar Holistic Scorecard Breakdown</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Total Score: {data.scorecard.total_score} / 100 ({data.scorecard.grade} Grade)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {data.scorecard.pillars.map((pillar) => (
                  <div key={pillar.pillar_name} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">{pillar.pillar_name}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-black text-white font-mono">{pillar.score.toFixed(1)}</span>
                        <span className="text-[10px] font-mono text-slate-500">/ {pillar.max_score} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(pillar.score / pillar.max_score) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                      {pillar.key_driver}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
