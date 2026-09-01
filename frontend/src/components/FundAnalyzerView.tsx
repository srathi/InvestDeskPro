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
} from "../lib/api";
import { useDebounce } from "../hooks/useDebounce";

const POPULAR_FUNDS = [
  { code: "122639", name: "Parag Parikh Flexi Cap" },
  { code: "118834", name: "Mirae Asset Large Cap" },
  { code: "118989", name: "HDFC Top 100" },
  { code: "100377", name: "Quant Active Fund" },
  { code: "120716", name: "SBI Small Cap" },
  { code: "120828", name: "Kotak Emerging Equity" },
];

export const FundAnalyzerView: React.FC = () => {
  const [schemeCode, setSchemeCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FundAnalysisResponse | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query by 300ms
  const debouncedQuery = useDebounce(searchQuery, 300);

  const loadFund = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setShowDropdown(false);
    try {
      const res = await fetchFundAnalysis(code);
      setData(res);
    } catch (err: any) {
      setData(null);
      setError(err.message || "Failed to analyze mutual fund scheme.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced auto-search for matching AMFI schemes
  useEffect(() => {
    const fetchMatchingFunds = async () => {
      const clean = debouncedQuery.trim();
      if (clean.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchFunds(clean);
          setSearchResults(results);
          setShowDropdown(results.length > 0);
          setSelectedIndex(-1);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };

    fetchMatchingFunds();
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
    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
      const selected = searchResults[selectedIndex];
      setSchemeCode(selected.scheme_code);
      loadFund(selected.scheme_code);
      setSearchQuery(selected.scheme_name);
    } else if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
      const first = searchResults[0];
      setSchemeCode(first.scheme_code);
      loadFund(first.scheme_code);
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
    setSchemeCode(fund.scheme_code);
    loadFund(fund.scheme_code);
    setSearchQuery(fund.scheme_name);
    setShowDropdown(false);
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type Scheme Name (e.g. Parag Parikh, Mirae, HDFC)..."
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400 animate-spin" />
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Search AMFI</span>
              </button>
            </form>

            {/* Debounced Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto divide-y divide-slate-800/60 z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/60 flex items-center justify-between">
                  <span>Matching AMFI Schemes</span>
                  <span className="text-[9px] font-mono lowercase">↑↓ navigate • ↵ select</span>
                </div>
                {searchResults.map((fund, idx) => (
                  <button
                    key={fund.scheme_code}
                    type="button"
                    onClick={() => selectFund(fund)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors ${
                      idx === selectedIndex ? "bg-emerald-950/60 text-emerald-200" : "hover:bg-slate-900/80 text-slate-200"
                    }`}
                  >
                    <span className="truncate pr-3 text-slate-200 font-medium">{fund.scheme_name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                        #{fund.scheme_code}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Preset Scheme Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Popular:</span>
            {POPULAR_FUNDS.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setSchemeCode(item.code);
                  loadFund(item.code);
                  setSearchQuery("");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  schemeCode === item.code
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
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
          <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
          <p className="text-sm font-mono text-slate-400">Computing 3-Year Rolling Alpha & Advisorkhoj Outperformance Rate...</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-5 my-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <LineChartIcon className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white tracking-tight">Select or Search an AMFI Mutual Fund</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose any scheme from the popular list above or type a fund name (e.g. <strong className="text-emerald-300">Parag Parikh</strong>, <strong className="text-emerald-300">Mirae Asset</strong>, <strong className="text-emerald-300">Quant Active</strong>, <strong className="text-emerald-300">HDFC Top 100</strong>) to view 3-Year Rolling Alpha, Advisorkhoj Outperformance Win Rate, and Morningstar Style Box.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {POPULAR_FUNDS.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setSchemeCode(item.code);
                  loadFund(item.code);
                  setSearchQuery("");
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-emerald-600 hover:text-emerald-200 transition-all font-mono"
              >
                {item.name} (#{item.code})
              </button>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Fund Header Info Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-white tracking-tight">{data.meta.scheme_name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 rounded-md border border-emerald-800/80">
                    AMFI #{data.meta.scheme_code}
                  </span>
                  <span className="px-3 py-0.5 text-xs font-semibold rounded-md border bg-cyan-950/60 text-cyan-300 border-cyan-700/80 flex items-center gap-1">
                    <Award className="h-3 w-3 text-cyan-400" />
                    <span>{data.rolling_summary.verdict}</span>
                  </span>
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
              </div>

              {/* Latest NAV & Date */}
              <div className="flex items-center gap-5 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                <div>
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
          </div>

          {/* Advisorkhoj Outperformance Rate & Morningstar Style Box Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Advisorkhoj Consistency & Win Rate Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Advisorkhoj Alpha Consistency</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">3Y Windows</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Outperformance Win Rate</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {data.rolling_summary.outperformance_rate_pct}%
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${data.rolling_summary.outperformance_rate_pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
                  <span>Beat Benchmark in:</span>
                  <strong className="text-slate-200">
                    {data.rolling_summary.outperforming_windows} / {data.rolling_summary.total_windows} windows
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Measures the probability of an investor earning excess returns over Nifty 50 across any 36-month investment horizon.
              </p>
            </div>

            {/* 2. Morningstar 3x3 Style Box */}
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
                {/* Header Row */}
                <div className="text-slate-500 uppercase font-semibold">Value</div>
                <div className="text-slate-500 uppercase font-semibold">Blend</div>
                <div className="text-slate-500 uppercase font-semibold">Growth</div>

                {/* Row 1: Large */}
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

                {/* Row 2: Mid */}
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

                {/* Row 3: Small */}
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
                Classified by market cap orientation & active factor tilts.
              </div>
            </div>

            {/* 3. Downside Capture Shield */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Downside Protection Shield</span>
                </h3>
                {data.stats.downside_capture_ratio < 85 && (
                  <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-semibold">
                    ELITE SHIELD
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Downside Capture Ratio</span>
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {data.stats.downside_capture_ratio}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Upside Capture Ratio</span>
                  <span className="text-xl font-bold text-cyan-300 font-mono">
                    {data.stats.upside_capture_ratio}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">Capture Ratio Spread:</span>
                  <span className="font-bold text-emerald-400">
                    +{(data.stats.upside_capture_ratio - data.stats.downside_capture_ratio).toFixed(1)}% Active Spread
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                A downside ratio &lt;85% indicates exceptional capital preservation during market drawdowns.
              </p>
            </div>
          </div>

          {/* 3-Year Rolling Alpha Chart & Risk Ratios */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Rolling Alpha Chart */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4 text-emerald-400" />
                    <span>3-Year Rolling Alpha vs Nifty 50 TRI</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Point-in-time excess 3-year annualized return (%) over benchmark</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span>Rolling Alpha</span>
                  </span>
                </div>
              </div>

              {/* Chart Component */}
              <div className="h-72 w-full pt-4">
                {data.rolling_series && data.rolling_series.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.rolling_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rollingAlphaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) => v.slice(0, 7)}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={10}
                        tickLine={false}
                        domain={["auto", "auto"]}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                      />
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
                      <Area
                        type="monotone"
                        dataKey="rolling_alpha"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#rollingAlphaGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Insufficient historical dates to plot rolling 3-year chart.
                  </div>
                )}
              </div>
            </div>

            {/* Risk & Performance Breakdown Table */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Risk & Return Matrix</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Mean 3Y Rolling Alpha</span>
                  <span className={`font-bold font-mono font-tabular ${
                    data.stats.mean_3y_rolling_alpha >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {data.stats.mean_3y_rolling_alpha >= 0 ? `+${data.stats.mean_3y_rolling_alpha}%` : `${data.stats.mean_3y_rolling_alpha}%`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Sharpe Ratio (Rf=6.5%)</span>
                  <span className="font-bold text-slate-200 font-mono font-tabular">{data.stats.sharpe_ratio}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Sortino Ratio</span>
                  <span className="font-bold text-emerald-400 font-mono font-tabular">{data.stats.sortino_ratio}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Information Ratio</span>
                  <span className="font-bold text-cyan-400 font-mono font-tabular">{data.stats.information_ratio}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Max Historical Drawdown</span>
                  <span className="font-bold text-rose-400 font-mono font-tabular">-{data.stats.max_drawdown_pct}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Annualized Volatility</span>
                  <span className="font-bold text-slate-200 font-mono font-tabular">{data.stats.fund_volatility}%</span>
                </div>
              </div>

              {/* Point to Point CAGRs */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Historical CAGRs</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">1Y CAGR</span>
                    <span className="text-xs font-bold text-slate-200 font-mono">
                      {data.stats.cagr_1y !== null && data.stats.cagr_1y !== undefined ? `${data.stats.cagr_1y}%` : "N/A"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">3Y CAGR</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {data.stats.cagr_3y !== null && data.stats.cagr_3y !== undefined ? `${data.stats.cagr_3y}%` : "N/A"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">5Y CAGR</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      {data.stats.cagr_5y !== null && data.stats.cagr_5y !== undefined ? `${data.stats.cagr_5y}%` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
