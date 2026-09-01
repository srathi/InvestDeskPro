"use client";

import React, { useState, useEffect } from "react";
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

const POPULAR_FUNDS = [
  { code: "122639", name: "Parag Parikh Flexi Cap" },
  { code: "118834", name: "Mirae Asset Large Cap" },
  { code: "118989", name: "HDFC Top 100" },
  { code: "100377", name: "Quant Active Fund" },
  { code: "120716", name: "SBI Small Cap" },
  { code: "120828", name: "Kotak Emerging Equity" },
];

export const FundAnalyzerView: React.FC = () => {
  const [schemeCode, setSchemeCode] = useState("122639");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FundAnalysisResponse | null>(null);

  const loadFund = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFundAnalysis(code);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze mutual fund scheme.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFund("122639");
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await searchFunds(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Presets Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Fund Name (e.g. Parag Parikh, Mirae, HDFC)..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Search AMFI</span>
            </button>
          </form>

          {/* Quick Preset Scheme Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Popular:</span>
            {POPULAR_FUNDS.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setSchemeCode(item.code);
                  loadFund(item.code);
                  setSearchResults([]);
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

        {/* Live Search Autocomplete Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-2 max-h-60 overflow-y-auto space-y-1 z-20">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1">Select Scheme:</div>
            {searchResults.map((fund) => (
              <button
                key={fund.scheme_code}
                onClick={() => {
                  setSchemeCode(fund.scheme_code);
                  loadFund(fund.scheme_code);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800/80 flex items-center justify-between text-slate-200 transition-colors"
              >
                <span className="truncate pr-4">{fund.scheme_name}</span>
                <span className="font-mono text-emerald-400 text-[11px] shrink-0">Code: {fund.scheme_code}</span>
              </button>
            ))}
          </div>
        )}
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
          <p className="text-sm font-mono text-slate-400">Fetching AMFI NAV history & computing 3-Year Rolling Alpha against Nifty 50 TRI...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Fund Header Info Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white tracking-tight">{data.meta.scheme_name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 rounded-md border border-emerald-800/80">
                    AMFI #{data.meta.scheme_code}
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
              <div className="flex items-center gap-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
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

          {/* Key Quant Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Mean 3Y Rolling Alpha */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Mean 3Y Rolling Alpha</span>
              <div className={`text-xl font-bold font-mono font-tabular ${
                data.stats.mean_3y_rolling_alpha >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                {data.stats.mean_3y_rolling_alpha >= 0 ? `+${data.stats.mean_3y_rolling_alpha}%` : `${data.stats.mean_3y_rolling_alpha}%`}
              </div>
              <p className="text-[10px] text-slate-500">Average excess annual CAGR over 36M rolling windows</p>
            </div>

            {/* 2. Alpha Consistency */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Alpha Consistency</span>
              <div className="text-xl font-bold text-cyan-400 font-mono font-tabular">
                {data.stats.alpha_consistency_pct}%
              </div>
              <p className="text-[10px] text-slate-500">Percentage of 3Y windows generating positive alpha</p>
            </div>

            {/* 3. Downside Capture Ratio */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Downside Capture</span>
                {data.stats.downside_capture_ratio < 85 && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold">
                    ELITE SHIELD
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-amber-300 font-mono font-tabular">
                {data.stats.downside_capture_ratio}%
              </div>
              <p className="text-[10px] text-slate-500">Fund loss ratio when benchmark declined (&lt;85% is ideal)</p>
            </div>

            {/* 4. Information Ratio */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Information Ratio</span>
              <div className="text-xl font-bold text-emerald-400 font-mono font-tabular">
                {data.stats.information_ratio}
              </div>
              <p className="text-[10px] text-slate-500">Active Return / Tracking Error (Manager skill)</p>
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
                  <p className="text-[11px] text-slate-400">Point-in-time excess 3-year annualized return (%)</p>
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
                <span>Risk & Return Profile</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Sharpe Ratio (Rf=6.5%)</span>
                  <span className="font-bold text-slate-200 font-mono font-tabular">{data.stats.sharpe_ratio}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Sortino Ratio</span>
                  <span className="font-bold text-emerald-400 font-mono font-tabular">{data.stats.sortino_ratio}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Upside Capture Ratio</span>
                  <span className="font-bold text-cyan-300 font-mono font-tabular">{data.stats.upside_capture_ratio}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Max Historical Drawdown</span>
                  <span className="font-bold text-rose-400 font-mono font-tabular">-{data.stats.max_drawdown_pct}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Annualized Volatility</span>
                  <span className="font-bold text-slate-200 font-mono font-tabular">{data.stats.fund_volatility}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Benchmark Volatility</span>
                  <span className="font-bold text-slate-400 font-mono font-tabular">{data.stats.benchmark_volatility}%</span>
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
