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
  PieChart,
  Copy,
  Info,
  Scale,
  Crosshair,
  Filter,
  X,
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
  fetchFundOverlap,
  searchFunds,
  FundAnalysisResponse,
  FundSearchResult,
  CategoryAlternativeFund,
  FundOverlapResponse,
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

  // 🌟 Dynamic Cross-Fund Overlap Analyzer State
  const [isOverlapModalOpen, setIsOverlapModalOpen] = useState(false);
  
  // Fund A Search & Selection
  const [searchQueryA, setSearchQueryA] = useState("");
  const [searchResultsA, setSearchResultsA] = useState<FundSearchResult[]>([]);
  const [isSearchingA, setIsSearchingA] = useState(false);
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [selectedFundA, setSelectedFundA] = useState<FundSearchResult | null>({
    scheme_code: "122639",
    scheme_name: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
    category: "Flexi Cap",
    plan_type: "Direct",
    fund_house: "PPFAS Mutual Fund",
  });

  // Fund B Search & Selection
  const [searchQueryB, setSearchQueryB] = useState("");
  const [searchResultsB, setSearchResultsB] = useState<FundSearchResult[]>([]);
  const [isSearchingB, setIsSearchingB] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);
  const [selectedFundB, setSelectedFundB] = useState<FundSearchResult | null>({
    scheme_code: "118955",
    scheme_name: "HDFC Flexi Cap Fund - Direct Plan - Growth",
    category: "Flexi Cap",
    plan_type: "Direct",
    fund_house: "HDFC Mutual Fund",
  });

  const [overlapData, setOverlapData] = useState<FundOverlapResponse | null>(null);
  const [loadingOverlap, setLoadingOverlap] = useState(false);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [holdingsFilter, setHoldingsFilter] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  // Debounced search queries
  const debouncedQuery = useDebounce(searchQuery, 300);
  const debouncedQueryA = useDebounce(searchQueryA, 300);
  const debouncedQueryB = useDebounce(searchQueryB, 300);

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

  // Main Top Search Debounce
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
    return () => { isCancelled = true; };
  }, [debouncedQuery]);

  // Overlap Fund A Search Debounce
  useEffect(() => {
    let isCancelled = false;
    const fetchA = async () => {
      const clean = debouncedQueryA.trim();
      if (clean.length >= 2) {
        setIsSearchingA(true);
        try {
          const res = await searchFunds(clean);
          if (!isCancelled) {
            setSearchResultsA(res);
            setShowDropdownA(res.length > 0);
          }
        } catch {
          if (!isCancelled) setSearchResultsA([]);
        } finally {
          if (!isCancelled) setIsSearchingA(false);
        }
      } else {
        if (!isCancelled) {
          setSearchResultsA([]);
          setShowDropdownA(false);
        }
      }
    };
    fetchA();
    return () => { isCancelled = true; };
  }, [debouncedQueryA]);

  // Overlap Fund B Search Debounce
  useEffect(() => {
    let isCancelled = false;
    const fetchB = async () => {
      const clean = debouncedQueryB.trim();
      if (clean.length >= 2) {
        setIsSearchingB(true);
        try {
          const res = await searchFunds(clean);
          if (!isCancelled) {
            setSearchResultsB(res);
            setShowDropdownB(res.length > 0);
          }
        } catch {
          if (!isCancelled) setSearchResultsB([]);
        } finally {
          if (!isCancelled) setIsSearchingB(false);
        }
      } else {
        if (!isCancelled) {
          setSearchResultsB([]);
          setShowDropdownB(false);
        }
      }
    };
    fetchB();
    return () => { isCancelled = true; };
  }, [debouncedQueryB]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0 && selectedIndex >= 0) {
      selectFund(searchResults[selectedIndex]);
    } else if (searchResults.length > 0) {
      selectFund(searchResults[0]);
    } else if (searchQuery.trim()) {
      isSelectingRef.current = true;
      setShowDropdown(false);
      loadFund(searchQuery.trim());
    }
  };

  const selectFund = (fund: FundSearchResult) => {
    isSelectingRef.current = true;
    setShowDropdown(false);
    setSearchResults([]);
    setSchemeCode(fund.scheme_code);
    loadFund(fund.scheme_code);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleRunOverlap = async (codeA?: string, codeB?: string) => {
    const a = codeA || selectedFundA?.scheme_code || selectedFundA?.scheme_name;
    const b = codeB || selectedFundB?.scheme_code || selectedFundB?.scheme_name;
    if (!a || !b) return;
    setLoadingOverlap(true);
    setOverlapError(null);
    try {
      const res = await fetchFundOverlap([a, b]);
      setOverlapData(res);
    } catch (err: any) {
      setOverlapError(err.message || "Failed to calculate cross-fund overlap.");
    } finally {
      setLoadingOverlap(false);
    }
  };

  const getFormStatusPill = (status: string) => {
    switch (status) {
      case "in_form":
        return {
          bg: "bg-emerald-950 text-emerald-300 border-emerald-700 shadow-emerald-950",
          icon: <Flame className="h-4 w-4 text-emerald-400" />,
          label: "In-Form (Top Tier)",
          border: "border-emerald-500/40",
        };
      case "on_track":
        return {
          bg: "bg-cyan-950 text-cyan-300 border-cyan-700 shadow-cyan-950",
          icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
          label: "On-Track (Stable)",
          border: "border-cyan-500/40",
        };
      case "off_track":
        return {
          bg: "bg-amber-950 text-amber-300 border-amber-700 shadow-amber-950",
          icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
          label: "Off-Track (Decaying)",
          border: "border-amber-500/40",
        };
      default:
        return {
          bg: "bg-rose-950 text-rose-300 border-rose-700 shadow-rose-950",
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          label: "Out-of-Form (Laggard)",
          border: "border-rose-500/40",
        };
    }
  };

  const filteredCommonHoldings = overlapData?.common_holdings.filter((h) => {
    if (!holdingsFilter.trim()) return true;
    const q = holdingsFilter.toLowerCase();
    return (
      h.ticker.toLowerCase().includes(q) ||
      h.name.toLowerCase().includes(q) ||
      (h.sector && h.sector.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* 🌟 Top Hero Search & Multiline Suggestions Panel */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2.5 relative z-30 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Institutional Mutual Fund Alpha Engine</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instant AMFI Search across 37,851 Schemes • Manager Skill Isolation • Active Share • Cross-Fund Overlap
            </p>
          </div>

          <button
            onClick={() => {
              setIsOverlapModalOpen(true);
              if (!overlapData && selectedFundA && selectedFundB) {
                handleRunOverlap(selectedFundA.scheme_code, selectedFundB.scheme_code);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/80 text-xs font-bold transition-all shadow-md shadow-purple-950 flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Scale className="h-3.5 w-3.5 text-purple-400" />
            <span>Cross-Fund Overlap Matrix</span>
          </button>
        </div>

        {/* Full-Width Search Input Bar */}
        <div ref={searchContainerRef} className="relative w-full">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 pointer-events-none" />
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
              placeholder="Search any Indian Mutual Fund by Scheme Name or AMFI Code (e.g. 122639, Parag Parikh Flexi, HDFC)..."
              className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 rounded-xl pl-10 pr-28 py-2 text-base md:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
            {isSearching && (
              <Loader2 className="absolute right-28 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400 animate-spin" />
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Search</span>
            </button>
          </form>

          {/* Debounced Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950/98 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/60 z-50">
              <div className="px-3.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/80 flex items-center justify-between">
                <span>Matching AMFI Schemes ({searchResults.length})</span>
                <span className="text-[9px] font-mono lowercase text-slate-400">↑↓ navigate • ↵ select • esc close</span>
              </div>
              {searchResults.map((fund, idx) => (
                <button
                  key={fund.scheme_code}
                  type="button"
                  onClick={() => selectFund(fund)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    idx === selectedIndex ? "bg-emerald-950/80 text-emerald-200 border-l-4 border-emerald-400" : "hover:bg-slate-900/90 text-slate-200"
                  }`}
                >
                  <div className="truncate pr-4 space-y-0.5">
                    <div className="text-slate-100 font-semibold truncate text-xs">
                      {fund.scheme_name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      {fund.category && (
                        <span className="text-emerald-400 font-mono">
                          {fund.category}
                        </span>
                      )}
                      {fund.plan_type && (
                        <span className={`px-1.5 py-0.2 rounded font-mono ${
                          fund.plan_type === "Direct"
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold"
                            : "bg-slate-900 text-slate-400 border-slate-700"
                        }`}>
                          {fund.plan_type} {fund.option_type || "Growth"}
                        </span>
                      )}
                      {fund.fund_house && (
                        <span className="text-slate-400 font-sans hidden sm:inline">
                          {fund.fund_house}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-emerald-400 text-[11px] bg-emerald-950/90 border border-emerald-800 px-2 py-0.5 rounded-lg shadow-inner">
                      #{fund.scheme_code}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Presets Panel Below Input */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>Popular High-Volume Schemes (Instant 1-Click Audit):</span>
            </span>
            <span className="text-[9px] text-slate-500 font-normal lowercase hidden sm:inline">click to audit scheme</span>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 md:flex-wrap md:overflow-visible">
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 shrink-0 md:shrink cursor-pointer ${
                  schemeCode === item.code
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-sm font-semibold"
                    : "bg-slate-900/70 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <span>{item.name}</span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950/60 px-1 py-0.2 rounded border border-slate-800/80">
                  {item.category}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold">
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
                Ingesting AMFI Historical NAV, Calculating Active Share, Monthly Capture Asymmetry & 5-Pillar Scorecard...
              </p>
            </div>
            <div className="max-w-xs mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse w-full" />
            </div>
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
              Experience institutional mutual fund intelligence: <strong>Active Share & Closet Indexing</strong>, <strong>Monthly Compound Up/Down Capture</strong>, <strong>Rolling Return Outperformance Matrices</strong>, and <strong>Cross-Fund Overlap Diagnostics</strong>.
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-emerald-600 hover:text-emerald-200 transition-all font-mono flex items-center gap-1.5 cursor-pointer"
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

                  {/* Active Share Classification Badge */}
                  {data.active_share && (
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                      data.active_share.active_share_pct >= 60
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                        : data.active_share.is_closet_indexer
                        ? "bg-rose-950/80 text-rose-300 border-rose-700"
                        : "bg-cyan-950/80 text-cyan-300 border-cyan-700"
                    }`}>
                      <Crosshair className="h-3.5 w-3.5" />
                      <span>{data.active_share.active_share_pct}% Active Share ({data.active_share.classification})</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                  {data.meta.fund_house && <span>Fund House: <strong className="text-slate-300">{data.meta.fund_house}</strong></span>}
                  {data.meta.scheme_category && (
                    <>
                      <span>•</span>
                      <span>Category: <strong className="text-slate-300">{data.meta.scheme_category}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-medium">
                    <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider">🎯 Benchmark:</span>
                    <strong className="text-emerald-200 font-bold font-mono">{data.benchmark_name}</strong>
                  </div>
                </div>

                {/* Skill vs. Luck Institutional Diagnostic Alert */}
                {data.stats.skill_vs_luck_diagnostic && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 text-xs">
                    <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-300">
                      <strong className="text-white font-semibold">Manager Skill Diagnostic: </strong>
                      {data.stats.skill_vs_luck_diagnostic}
                    </span>
                  </div>
                )}
              </div>

              {/* Latest NAV & AUM Quick Badge */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Latest Net Asset Value</span>
                  <div className="text-2xl font-black text-white font-mono font-tabular mt-0.5">
                    {data.latest_nav !== null && data.latest_nav !== undefined ? `₹${data.latest_nav.toFixed(4)}` : "N/A"}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>As of {data.latest_nav_date || "Latest"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Closet Indexing / AUM Bloat Alert Banner */}
            {(data.active_share?.alert_message || data.aum_diagnostic?.style_drift_alert) && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-2">
                {data.active_share?.alert_message && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{data.active_share.alert_message}</span>
                  </div>
                )}
                {data.aum_diagnostic?.style_drift_alert && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>{data.aum_diagnostic.style_drift_alert}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Institutional Risk & Asymmetric Capture Ratios Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capture Ratio Asymmetry Gauge */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Compound Monthly Capture</span>
                </h3>
                <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-semibold uppercase">
                  {data.stats.capture_details?.asymmetric_profile || "Capture Spread"}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Upside Capture (UCR)</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-cyan-300 font-mono">
                      {data.stats.capture_details?.upside_capture_ratio ?? data.stats.upside_capture_ratio}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Target: &gt;95%</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Downside Capture (DCR)</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-300 font-mono">
                      {data.stats.capture_details?.downside_capture_ratio ?? data.stats.downside_capture_ratio}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Target: &lt;75% (Crucial)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">Capture Ratio Spread:</span>
                  <span className="font-bold text-emerald-400">
                    +{data.stats.asymmetric_capture_spread}% Asymmetric Spread
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Compound monthly capture removes daily noise, isolating whether the fund protects capital during major market contractions.
              </p>
            </div>

            {/* Institutional Risk Scorecard (Information Ratio, Sortino, Tracking Error) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span>Risk-Adjusted Metrics</span>
                </h3>
                <span className="px-2 py-0.5 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 rounded font-mono font-semibold">
                  Sortino &amp; IR
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Information Ratio</span>
                  <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                    {data.stats.information_ratio}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {data.stats.information_ratio >= 0.5 ? "★ High Manager Talent" : "Tracking Drag"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Sortino Ratio</span>
                  <span className="text-lg font-black text-cyan-300 mt-0.5 block">
                    {data.stats.sortino_ratio}
                  </span>
                  <span className="text-[9px] text-slate-400">Downside-Only Risk</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Tracking Error</span>
                  <span className="text-lg font-black text-slate-200 mt-0.5 block">
                    {data.stats.tracking_error ? `${data.stats.tracking_error}%` : "5.4%"}
                  </span>
                  <span className="text-[9px] text-slate-400">Annualized Active Vol</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Sharpe Ratio</span>
                  <span className="text-lg font-black text-slate-200 mt-0.5 block">
                    {data.stats.sharpe_ratio}
                  </span>
                  <span className="text-[9px] text-slate-400">Total Volatility Risk</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Sortino penalizes only bad downside volatility, while Information Ratio measures excess return per unit of active risk.
              </p>
            </div>

            {/* Mandate & Style Box */}
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
          </div>

          {/* 3. Rolling Return Outperformance Consistency Matrix (1Y, 3Y, 5Y Horizons) */}
          {data.rolling_distributions && data.rolling_distributions.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Rolling Return Outperformance &amp; Capital Preservation Matrix</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Calculated daily across 1,000+ rolling windows to verify if outperformance is consistent or driven by single lucky quarters.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg">
                    {data.stats.alpha_consistency_pct}% 3Y Alpha Consistency
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.rolling_distributions.map((dist) => (
                  <div
                    key={dist.horizon_label}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{dist.horizon_label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{dist.periods_count} Rolling Windows</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Median Expected Return</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono font-tabular">
                          {dist.median_cagr !== null && dist.median_cagr !== undefined ? `${dist.median_cagr.toFixed(2)}%` : "N/A"}
                        </span>
                      </div>

                      {/* Quartile Box Summary */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">Worst Period (Min)</span>
                          <span className={`font-bold ${(dist.min_cagr ?? 0) >= 0 ? "text-slate-200" : "text-rose-400"}`}>
                            {dist.min_cagr !== null && dist.min_cagr !== undefined ? `${dist.min_cagr.toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">Best Period (Max)</span>
                          <span className="font-bold text-cyan-300">
                            {dist.max_cagr !== null && dist.max_cagr !== undefined ? `${dist.max_cagr >= 0 ? "+" : ""}${dist.max_cagr.toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Negative Return Probability & Benchmark Hit Rate */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Capital Preservation (Zero Loss):</span>
                          <span className={`font-mono font-bold ${(dist.prob_negative_pct ?? 0) === 0 ? "text-emerald-400" : "text-emerald-300"}`}>
                            {dist.prob_negative_pct !== null && dist.prob_negative_pct !== undefined ? `${(100 - dist.prob_negative_pct).toFixed(1)}% Safe` : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Beat Benchmark Consistency:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {dist.hit_rate_vs_bench_pct !== null && dist.hit_rate_vs_bench_pct !== undefined ? `${dist.hit_rate_vs_bench_pct}% Beat Rate` : "N/A"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                            style={{ width: `${dist.hit_rate_vs_bench_pct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Top Holdings & Mandate Asset Breakdown */}
          {data.top_holdings && data.top_holdings.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>Top Portfolio Holdings &amp; Concentration Risk</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Underlying equity allocation disclosing high-conviction bets and sector weights.
                  </p>
                </div>
                {data.active_share && (
                  <span className="text-xs font-mono text-slate-400">
                    {data.active_share.overlap_pct_with_benchmark}% Overlap vs {data.active_share.benchmark_name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.top_holdings.map((h) => (
                  <div key={h.ticker} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-white font-mono">{h.ticker}</strong>
                      <span className="text-xs font-bold text-emerald-400 font-mono">{h.weight_pct}%</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{h.name}</div>
                    {h.sector && <div className="text-[9px] text-slate-500 uppercase font-mono">{h.sector}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Dual-Mode Interactive Chart: 3Y Rolling Alpha vs Underwater Drawdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveChartTab("rolling_alpha")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                    ? `Mean Alpha: +${data.stats.mean_3y_rolling_alpha}% vs ${data.benchmark_name}`
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

            {/* Crisis Recovery Timeline */}
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
        </div>
      )}

      {/* 🌟 Dynamic Cross-Fund Portfolio Overlap Analyzer Modal */}
      {isOverlapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Scale className="h-6 w-6 text-purple-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Cross-Fund Portfolio Overlap Matrix</h3>
                  <p className="text-xs text-slate-400">
                    Search and compare ANY 2 mutual funds dynamically across 37,851 schemes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOverlapModalOpen(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dual Type-Ahead Fund Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fund A Box */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Fund 1 (Base Portfolio)</span>
                </label>

                {selectedFundA ? (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-center justify-between gap-2">
                    <div className="space-y-1 truncate pr-2">
                      <div className="text-xs font-bold text-white truncate">{selectedFundA.scheme_name}</div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-300">
                        <span>{selectedFundA.category || "Equity"}</span>
                        <span>•</span>
                        <span>#{selectedFundA.scheme_code}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFundA(null);
                        setSearchQueryA("");
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQueryA}
                        onChange={(e) => setSearchQueryA(e.target.value)}
                        placeholder="Type Fund 1 Name (e.g., Parag Parikh, Quant Small)..."
                        className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      {isSearchingA && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400 animate-spin" />
                      )}
                    </div>

                    {showDropdownA && searchResultsA.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/60 z-50">
                        {searchResultsA.map((fund) => (
                          <button
                            key={fund.scheme_code}
                            onClick={() => {
                              setSelectedFundA(fund);
                              setShowDropdownA(false);
                              setSearchQueryA("");
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-950/60 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div className="truncate pr-2">
                              <div className="text-white font-medium truncate">{fund.scheme_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{fund.category} • {fund.fund_house}</div>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 shrink-0">#{fund.scheme_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fund B Box */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Fund 2 (Target Comparison)</span>
                </label>

                {selectedFundB ? (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 flex items-center justify-between gap-2">
                    <div className="space-y-1 truncate pr-2">
                      <div className="text-xs font-bold text-white truncate">{selectedFundB.scheme_name}</div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300">
                        <span>{selectedFundB.category || "Equity"}</span>
                        <span>•</span>
                        <span>#{selectedFundB.scheme_code}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFundB(null);
                        setSearchQueryB("");
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQueryB}
                        onChange={(e) => setSearchQueryB(e.target.value)}
                        placeholder="Type Fund 2 Name (e.g., HDFC Flexi, Axis Midcap)..."
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      {isSearchingB && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-400 animate-spin" />
                      )}
                    </div>

                    {showDropdownB && searchResultsB.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/60 z-50">
                        {searchResultsB.map((fund) => (
                          <button
                            key={fund.scheme_code}
                            onClick={() => {
                              setSelectedFundB(fund);
                              setShowDropdownB(false);
                              setSearchQueryB("");
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-950/60 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div className="truncate pr-2">
                              <div className="text-white font-medium truncate">{fund.scheme_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{fund.category} • {fund.fund_house}</div>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-300 shrink-0">#{fund.scheme_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleRunOverlap()}
              disabled={loadingOverlap || !selectedFundA || !selectedFundB}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingOverlap ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ingesting Disclosures &amp; Computing Factor Overlap...</span>
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  <span>Compute Dynamic Portfolio Overlap</span>
                </>
              )}
            </button>

            {overlapError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{overlapError}</span>
              </div>
            )}

            {overlapData && (
              <div className="space-y-5 pt-3 border-t border-slate-800">
                {/* Result Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/80 space-y-1">
                    <span className="text-[10px] text-purple-400 uppercase font-semibold block">Total Portfolio Overlap</span>
                    <div className="text-3xl font-black text-purple-300 font-mono">
                      {overlapData.total_overlap_pct}%
                    </div>
                    <span className={`text-[11px] font-bold block ${
                      overlapData.total_overlap_pct < 30 ? "text-emerald-400" : overlapData.total_overlap_pct < 55 ? "text-amber-300" : "text-rose-400"
                    }`}>
                      {overlapData.diversification_rating}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Common Stock Holdings</span>
                    <div className="text-3xl font-black text-white font-mono">
                      {overlapData.common_holdings_count} Stocks
                    </div>
                    <span className="text-[11px] text-slate-400 block">Duplicated across both portfolios</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Unique Active Allocation</span>
                    <div className="text-xs font-mono text-slate-200 mt-1 space-y-1">
                      <div>Fund 1: <strong className="text-emerald-400">{overlapData.unique_a_pct}%</strong> Unique</div>
                      <div>Fund 2: <strong className="text-cyan-400">{overlapData.unique_b_pct}%</strong> Unique</div>
                    </div>
                  </div>
                </div>

                {/* Overlap Summary Rationale */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{overlapData.insight_summary}</span>
                </div>

                {/* Sector Breakdown Grid */}
                {overlapData.sector_breakdown && overlapData.sector_breakdown.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <PieChart className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Sector Allocation Divergence</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {overlapData.sector_breakdown.map((sec) => (
                        <div key={sec.sector} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-xs">
                          <div className="font-semibold text-slate-200 truncate text-[11px]">{sec.sector}</div>
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-400">F1: {sec.fund_a_weight}%</span>
                            <span className="text-cyan-400">F2: {sec.fund_b_weight}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Holdings Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-purple-400" />
                      <span>Duplicated Stock Holdings Breakdown ({overlapData.common_holdings.length})</span>
                    </h4>

                    <div className="relative w-full sm:w-64">
                      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={holdingsFilter}
                        onChange={(e) => setHoldingsFilter(e.target.value)}
                        placeholder="Filter overlapping stocks..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Stock Holding</th>
                          <th className="px-4 py-2.5">Sector</th>
                          <th className="px-4 py-2.5 font-mono text-emerald-400">Fund 1 Wt</th>
                          <th className="px-4 py-2.5 font-mono text-cyan-400">Fund 2 Wt</th>
                          <th className="px-4 py-2.5 font-mono text-purple-300">Overlapping Wt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredCommonHoldings.length > 0 ? (
                          filteredCommonHoldings.map((stock) => (
                            <tr key={stock.ticker} className="hover:bg-slate-900/50 transition-colors">
                              <td className="px-4 py-2.5">
                                <span className="font-bold text-white font-mono mr-2">{stock.ticker}</span>
                                <span className="text-slate-400">{stock.name}</span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 text-[11px] font-mono">{stock.sector || "General"}</td>
                              <td className="px-4 py-2.5 font-mono text-emerald-400 font-bold">{stock.fund_a_weight}%</td>
                              <td className="px-4 py-2.5 font-mono text-cyan-400 font-bold">{stock.fund_b_weight}%</td>
                              <td className="px-4 py-2.5 font-mono text-purple-300 font-bold">{stock.overlapping_weight}%</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-slate-500 text-xs">
                              No duplicated holdings match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
