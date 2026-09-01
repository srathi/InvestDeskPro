"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Shield,
  Coins,
  Gauge,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchStockScorecard, StockScorecardResponse } from "../lib/api";

const PRESET_TICKERS = [
  { ticker: "TATAMOTORS", name: "Tata Motors" },
  { ticker: "RELIANCE", name: "Reliance Ind." },
  { ticker: "INFY", name: "Infosys" },
  { ticker: "TCS", name: "TCS" },
  { ticker: "HDFCBANK", name: "HDFC Bank" },
  { ticker: "ITC", name: "ITC Ltd." },
  { ticker: "LT", name: "Larsen & Toubro" },
];

export const StockScorecardView: React.FC = () => {
  const [tickerInput, setTickerInput] = useState("TATAMOTORS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockScorecardResponse | null>(null);

  const loadScorecard = async (ticker: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStockScorecard(ticker);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load stock scorecard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScorecard("TATAMOTORS");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      loadScorecard(tickerInput);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 border-emerald-500/50 bg-emerald-950/30";
    if (score >= 60) return "text-cyan-400 border-cyan-500/50 bg-cyan-950/30";
    if (score >= 45) return "text-amber-400 border-amber-500/50 bg-amber-950/30";
    return "text-rose-400 border-rose-500/50 bg-rose-950/30";
  };

  const getScoreRingGradient = (score: number) => {
    if (score >= 75) return "from-emerald-500 to-teal-400";
    if (score >= 60) return "from-cyan-500 to-blue-400";
    if (score >= 45) return "from-amber-500 to-yellow-400";
    return "from-rose-500 to-orange-400";
  };

  return (
    <div className="space-y-6">
      {/* Search & Preset Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="Enter NSE/BSE Ticker (e.g. TATAMOTORS, RELIANCE, INFY)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-cyan-950 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gauge className="h-3.5 w-3.5" />}
            <span>Analyze</span>
          </button>
        </form>

        {/* Quick Ticker Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Presets:</span>
          {PRESET_TICKERS.map((item) => (
            <button
              key={item.ticker}
              onClick={() => {
                setTickerInput(item.ticker);
                loadScorecard(item.ticker);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                tickerInput.toUpperCase() === item.ticker
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {item.ticker}
            </button>
          ))}
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
          <p className="text-sm font-mono text-slate-400">Computing 0–100 Institutional Factor Scorecard for {tickerInput}...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Main Top Header Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Company Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{data.company_name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                    {data.ticker}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>Sector: <strong className="text-slate-300">{data.sector}</strong></span>
                  <span>•</span>
                  <span>Industry: <strong className="text-slate-300">{data.industry}</strong></span>
                  {data.fundamentals.current_price && (
                    <>
                      <span>•</span>
                      <span>Price: <strong className="text-cyan-400 font-tabular font-mono">₹{data.fundamentals.current_price.toLocaleString("en-IN")}</strong></span>
                    </>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Institutional Verdict:</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getScoreColor(data.total_score)}`}>
                    {data.verdict}
                  </span>
                </div>
              </div>

              {/* Radial Composite Score Meter */}
              <div className="flex items-center gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * data.total_score) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white font-tabular">{data.total_score}</span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-300">Composite Factor Rating</div>
                  <p className="text-[11px] text-slate-400 max-w-[180px]">
                    Orthogonal scorecard weighted by Quality (40%), Value (30%), & Momentum (30%).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Factor Breakdown Grid (3 Pillars) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: Quality Factor (40 pts) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Quality Factor</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Weight: 40% Max</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-cyan-400 font-tabular">{data.quality.score}</span>
                  <span className="text-xs text-slate-500 font-mono"> / 40</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${(data.quality.score / data.quality.max_score) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Grade: <strong className="text-cyan-300">{data.quality.grade}</strong></span>
                  <span className="text-slate-500">{((data.quality.score / 40) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-300 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Key Quality Drivers</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{data.quality.summary}</p>
              </div>
            </div>

            {/* Pillar 2: Value Factor (30 pts) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Value Factor</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Weight: 30% Max</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-400 font-tabular">{data.value.score}</span>
                  <span className="text-xs text-slate-500 font-mono"> / 30</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${(data.value.score / data.value.max_score) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Grade: <strong className="text-amber-300">{data.value.grade}</strong></span>
                  <span className="text-slate-500">{((data.value.score / 30) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-300 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valuation Multiples</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{data.value.summary}</p>
              </div>
            </div>

            {/* Pillar 3: Momentum & Low Vol (30 pts) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Momentum & Low-Vol</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Weight: 30% Max</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400 font-tabular">{data.momentum_low_vol.score}</span>
                  <span className="text-xs text-slate-500 font-mono"> / 30</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${(data.momentum_low_vol.score / data.momentum_low_vol.max_score) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Grade: <strong className="text-emerald-300">{data.momentum_low_vol.grade}</strong></span>
                  <span className="text-slate-500">{((data.momentum_low_vol.score / 30) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-300 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trend & Risk Stats</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{data.momentum_low_vol.summary}</p>
              </div>
            </div>
          </div>

          {/* Key Fundamentals Matrix & Price Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fundamentals Matrix (2 Columns on large) */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Key Financial Ratios</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">NSE / BSE Live</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">ROE</span>
                  <div className="text-sm font-bold text-slate-200 font-tabular mt-0.5">
                    {data.fundamentals.roe !== null && data.fundamentals.roe !== undefined ? `${data.fundamentals.roe}%` : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">ROCE / ROA</span>
                  <div className="text-sm font-bold text-slate-200 font-tabular mt-0.5">
                    {data.fundamentals.roce !== null && data.fundamentals.roce !== undefined ? `${data.fundamentals.roce}%` : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Debt to Equity</span>
                  <div className="text-sm font-bold text-slate-200 font-tabular mt-0.5">
                    {data.fundamentals.debt_to_equity !== null && data.fundamentals.debt_to_equity !== undefined ? data.fundamentals.debt_to_equity : "0.00 (Cash Rich)"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Trailing P/E</span>
                  <div className="text-sm font-bold text-slate-200 font-tabular mt-0.5">
                    {data.fundamentals.trailing_pe ? `${data.fundamentals.trailing_pe}x` : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">PEG Ratio</span>
                  <div className="text-sm font-bold text-slate-200 font-tabular mt-0.5">
                    {data.fundamentals.peg_ratio ? data.fundamentals.peg_ratio : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Price to Book</span>
                  <div className="text-sm font-bold text-slate-200 font-tabular mt-0.5">
                    {data.fundamentals.price_to_book ? `${data.fundamentals.price_to_book}x` : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">6M Return</span>
                  <div className={`text-sm font-bold font-tabular mt-0.5 flex items-center gap-1 ${
                    (data.fundamentals.return_6m || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {(data.fundamentals.return_6m || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {data.fundamentals.return_6m !== null && data.fundamentals.return_6m !== undefined ? `${data.fundamentals.return_6m}%` : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">60D Realized Vol</span>
                  <div className="text-sm font-bold text-cyan-300 font-tabular mt-0.5">
                    {data.fundamentals.realized_vol_60d ? `${data.fundamentals.realized_vol_60d}% ann.` : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>1-Year Historical Price Trend</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Daily closes on National Stock Exchange of India (NSE)</p>
                </div>
                {data.fundamentals.return_1y !== null && data.fundamentals.return_1y !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">1Y Gain/Loss</span>
                    <span className={`text-sm font-bold font-mono ${data.fundamentals.return_1y >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {data.fundamentals.return_1y >= 0 ? `+${data.fundamentals.return_1y}%` : `${data.fundamentals.return_1y}%`}
                    </span>
                  </div>
                )}
              </div>

              {/* Recharts Area Chart */}
              <div className="h-64 w-full pt-4">
                {data.price_history && data.price_history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.price_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="stockPriceGrad" x1="0" y1="0" x2="0" y2="1">
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
                        tickFormatter={(v) => `₹${v.toFixed(0)}`}
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
                        fill="url(#stockPriceGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Price history chart data unavailable for this ticker
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
