"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart as PieChartIcon,
  Plus,
  X,
  Sliders,
  Sparkles,
  TrendingDown,
  Shield,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  optimizePortfolio,
  PortfolioOptimizeResponse,
} from "../lib/api";

const PRESET_BASKETS = [
  {
    name: "Nifty Tech Leaders",
    tickers: ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
  },
  {
    name: "Financial Powerhouses",
    tickers: ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK"],
  },
  {
    name: "Defensive FMCG & Pharma",
    tickers: ["ITC", "HINDUNILVR", "NESTLEIND", "SUNPHARMA", "CIPLA"],
  },
  {
    name: "Diversified Bluechips",
    tickers: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "ITC", "LT"],
  },
];

const CHART_COLORS = [
  "#06b6d4",
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
  "#84cc16",
];

export const PortfolioOptimizerView: React.FC = () => {
  const [tickerList, setTickerList] = useState<string[]>([
    "RELIANCE",
    "TCS",
    "HDFCBANK",
    "INFY",
    "ICICIBANK",
    "ITC",
    "LT",
  ]);
  const [newTicker, setNewTicker] = useState("");
  const [maxWeight, setMaxWeight] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioOptimizeResponse | null>(null);

  const runOptimization = async (tickers: string[], cap: number) => {
    if (tickers.length < 2) {
      setError("Please add at least 2 stock tickers for portfolio optimization.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await optimizePortfolio(tickers, cap);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to calculate risk-parity portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOptimization(tickerList, maxWeight);
  }, []);

  const addTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTicker.trim().toUpperCase();
    if (clean && !tickerList.includes(clean)) {
      const updated = [...tickerList, clean];
      setTickerList(updated);
      setNewTicker("");
      runOptimization(updated, maxWeight);
    }
  };

  const removeTicker = (tickerToRemove: string) => {
    if (tickerList.length <= 2) {
      setError("A minimum of 2 tickers is required for risk parity.");
      return;
    }
    const updated = tickerList.filter((t) => t !== tickerToRemove);
    setTickerList(updated);
    runOptimization(updated, maxWeight);
  };

  const loadPreset = (basket: { name: string; tickers: string[] }) => {
    setTickerList(basket.tickers);
    runOptimization(basket.tickers, maxWeight);
  };

  return (
    <div className="space-y-6">
      {/* Basket Configuration Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Add Ticker Form */}
          <form onSubmit={addTicker} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              placeholder="Add Ticker (e.g. SBIN, MARUTI, TITAN)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-950 flex items-center gap-1 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Stock</span>
            </button>
          </form>

          {/* Allocation Cap Slider */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Max Weight Cap:</span>
              <span className="text-xs font-bold text-cyan-300 font-mono w-8">{maxWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={maxWeight}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxWeight(val);
                runOptimization(tickerList, val);
              }}
              className="w-24 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Preset Baskets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Institutional Baskets:</span>
          {PRESET_BASKETS.map((basket) => (
            <button
              key={basket.name}
              onClick={() => loadPreset(basket)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              {basket.name}
            </button>
          ))}
        </div>

        {/* Selected Ticker Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Selected Assets ({tickerList.length}):</span>
          {tickerList.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-900 border border-slate-700 text-slate-200"
            >
              <span>{ticker}</span>
              <button
                onClick={() => removeTicker(ticker)}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !result && (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
          <p className="text-sm font-mono text-slate-400">Calculating inverse-volatility risk-parity weights & covariance matrix...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Top Comparison KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Portfolio Volatility */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Risk-Parity Volatility</span>
              <div className="text-2xl font-black text-cyan-400 font-mono font-tabular">
                {result.total_portfolio_volatility}%
              </div>
              <span className="text-[10px] text-slate-500">Annualized realized standard deviation</span>
            </div>

            {/* 2. Volatility Reduction vs Equal Weight */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Vol Reduction vs EW</span>
              <div className="text-2xl font-black text-emerald-400 font-mono font-tabular flex items-center gap-1">
                <span>-{result.volatility_reduction_pct}%</span>
              </div>
              <span className="text-[10px] text-slate-500">Equal-Weight Baseline: {result.equal_weight_volatility}%</span>
            </div>

            {/* 3. Expected Return */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">1Y Expected Return</span>
              <div className="text-2xl font-black text-slate-200 font-mono font-tabular">
                +{result.portfolio_expected_return}%
              </div>
              <span className="text-[10px] text-slate-500">Weighted historical 1-year total return</span>
            </div>

            {/* 4. Portfolio Sharpe */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Portfolio Sharpe Ratio</span>
              <div className="text-2xl font-black text-amber-400 font-mono font-tabular">
                {result.portfolio_sharpe_ratio}
              </div>
              <span className="text-[10px] text-slate-500">Assuming 6.5% Indian Risk-Free Rate</span>
            </div>
          </div>

          {/* Allocation Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Allocation Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-cyan-400" />
                  <span>Target Asset Allocations (Cap: {result.max_weight_constraint}%)</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Sum: 100.0%</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={result.allocations}
                      dataKey="weight_pct"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {result.allocations.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.ticker}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                {result.allocations.map((item, idx) => (
                  <div key={item.ticker} className="flex items-center gap-1.5 font-mono">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="text-slate-300 font-semibold">{item.name || item.ticker}:</span>
                    <span className="text-slate-400">{item.weight_pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Contribution vs Asset Weight Bar Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-emerald-400" />
                  <span>Asset Weight vs % Risk Contribution</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Risk Parity Balance</span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.allocations}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      domain={[0, "auto"]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, name === "weight_pct" ? "Allocation Weight" : "Risk Contribution"]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(v) => (v === "weight_pct" ? "Allocation Weight (%)" : "% Contribution to Total Risk")}
                    />
                    <Bar dataKey="weight_pct" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="risk_contribution_pct" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Risk-parity ensures high-volatility assets do not dominate the total portfolio risk profile.
              </p>
            </div>
          </div>

          {/* Detailed Asset Breakdown Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Asset Allocation & Volatility Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="pb-3">Ticker</th>
                    <th className="pb-3 text-right">Target Weight</th>
                    <th className="pb-3 text-right">Uncapped Weight</th>
                    <th className="pb-3 text-right">1Y Realized Vol</th>
                    <th className="pb-3 text-right">Risk Contribution</th>
                    <th className="pb-3 text-right">1Y Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.allocations.map((item, idx) => (
                    <tr key={item.ticker} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 text-slate-200 font-bold flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span>{item.ticker}</span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-cyan-300 font-tabular">
                        {item.weight_pct}%
                      </td>
                      <td className="py-2.5 text-right text-slate-400 font-tabular">
                        {item.raw_weight_pct}%
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-tabular">
                        {item.realized_volatility}%
                      </td>
                      <td className="py-2.5 text-right text-emerald-400 font-tabular">
                        {item.risk_contribution_pct}%
                      </td>
                      <td className={`py-2.5 text-right font-tabular ${item.expected_return_1y >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {item.expected_return_1y >= 0 ? `+${item.expected_return_1y}%` : `${item.expected_return_1y}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
