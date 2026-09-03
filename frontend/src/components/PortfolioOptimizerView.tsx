"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  Grid,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Flame,
  Clock,
  Briefcase,
  Crosshair,
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
  LineChart,
  Line,
} from "recharts";
import {
  optimizePortfolio,
  searchStocks,
  PortfolioOptimizeResponse,
  StockSearchResult,
} from "../lib/api";
import { useDebounce } from "../hooks/useDebounce";
import { JargonTooltip } from "./JargonTooltip";

const PRESET_BASKETS = [
  {
    name: "My Core Bluechips",
    tickers: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "LT"],
  },
  {
    name: "Financials + Tech Powerhouse",
    tickers: ["HDFCBANK", "ICICIBANK", "SBIN", "TCS", "INFY", "HCLTECH"],
  },
  {
    name: "Defensive All-Weather",
    tickers: ["ITC", "HINDUNILVR", "SUNPHARMA", "CIPLA", "TCS", "NESTLEIND"],
  },
  {
    name: "High-Growth Cyclicals",
    tickers: ["TATAMOTORS", "LT", "TATASTEEL", "ADANIENT", "BHARTIARTL"],
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
    "ITC",
    "LT",
    "TATAMOTORS",
  ]);
  const [newTicker, setNewTicker] = useState("");
  const [maxWeight, setMaxWeight] = useState(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioOptimizeResponse | null>(null);

  // Autocomplete state for portfolio stock additions
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(newTicker, 250);

  const runOptimization = async (tickers: string[], cap: number) => {
    if (tickers.length < 2) {
      setError("Please add at least 2 stock tickers for portfolio stress-testing & risk parity.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await optimizePortfolio(tickers, cap);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to simulate risk-parity stress test.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOptimization(tickerList, maxWeight);
  }, []);

  // Fetch stock suggestions for basket
  useEffect(() => {
    const fetchStockSuggestions = async () => {
      const clean = debouncedInput.trim();
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

    fetchStockSuggestions();
  }, [debouncedInput]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTickerSymbol = (tickerToAdd: string) => {
    const clean = tickerToAdd.trim().toUpperCase().replace(".NS", "").replace(".BO", "");
    if (clean && !tickerList.includes(clean)) {
      if (tickerList.length >= 12) {
        setError("Maximum 12 stocks supported for optimal covariance estimation.");
        return;
      }
      const updated = [...tickerList, clean];
      setTickerList(updated);
      setNewTicker("");
      setShowDropdown(false);
      runOptimization(updated, maxWeight);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      addTickerSymbol(suggestions[selectedIndex].ticker);
    } else if (newTicker.trim()) {
      addTickerSymbol(newTicker);
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

  const getCorrBg = (val: number) => {
    if (val >= 0.7) return "bg-rose-950/80 text-rose-300 font-bold border border-rose-800";
    if (val >= 0.4) return "bg-amber-950/60 text-amber-300";
    if (val >= 0.1) return "bg-cyan-950/60 text-cyan-300";
    return "bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-800/60";
  };

  return (
    <div className="space-y-6">
      {/* Interactive Stock Builder & Constraint Controls */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-800 space-y-4 relative z-30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-indigo-400" />
              <span>Interactive Portfolio Stress-Tester & Risk-Parity Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Enter 3 to 10 of your custom stock holdings. The engine calculates optimal inverse-volatility weights, marginal risk contributions, and historical crash replays vs Nifty 50 TRI.
            </p>
          </div>

          {/* Allocation Cap Slider */}
          <div className="flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Max Asset Cap:</span>
              <span className="text-xs font-bold text-cyan-300 font-mono w-8">{maxWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
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

        {/* Add Ticker Input Bar with Autocomplete */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div ref={inputContainerRef} className="relative flex-1 max-w-lg">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newTicker}
                  onChange={(e) => {
                    setNewTicker(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type any Indian stock to add (e.g. SBIN, Tata Motors, L&T, Maruti)..."
                  className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 rounded-xl pl-4 pr-9 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono uppercase"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-950 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add Holding</span>
              </button>
            </form>

            {/* Dropdown Suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950/98 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/60 z-50">
                <div className="px-3.5 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/80 flex items-center justify-between">
                  <span>Matching Indian Equities ({suggestions.length})</span>
                  <span className="text-[9px] font-mono lowercase">↑↓ navigate • ↵ select</span>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => addTickerSymbol(item.ticker)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      idx === selectedIndex ? "bg-indigo-950/70 text-indigo-200" : "hover:bg-slate-900/80 text-slate-200"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{item.ticker.replace(".NS", "")}</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-800 text-slate-300 rounded">
                          {item.exchange}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.name}</p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                      <span className="hidden sm:inline-block text-indigo-400/90 font-mono">{item.sector}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Preset Portfolios */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Quick Templates:</span>
            {PRESET_BASKETS.map((basket) => (
              <button
                key={basket.name}
                onClick={() => loadPreset(basket)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-indigo-600 hover:text-white transition-all whitespace-nowrap"
              >
                {basket.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Ticker Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 font-medium">Portfolio Holdings ({tickerList.length}):</span>
          {tickerList.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-900 border border-slate-700 text-slate-200 shadow-sm"
            >
              <span>{ticker}</span>
              <button
                onClick={() => removeTicker(ticker)}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Remove Holding"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {tickerList.length > 2 && (
            <button
              onClick={() => {
                setTickerList(["RELIANCE", "TCS", "HDFCBANK"]);
                runOptimization(["RELIANCE", "TCS", "HDFCBANK"], maxWeight);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline ml-2 cursor-pointer"
            >
              Reset to 3 Core Stocks
            </button>
          )}
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
          <div className="glass-panel p-8 rounded-3xl border border-indigo-800/40 text-center space-y-5 my-2 relative overflow-hidden bg-gradient-to-b from-indigo-950/20 to-slate-950/80">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white tracking-tight">
                Simulating Multi-Asset Covariance & Historical Crash Stress-Tests
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Replaying COVID-19 2020 shock, 2022 rate-hike cycles, and computing inverse-volatility parity with {maxWeight}% cap constraint...
              </p>
            </div>
            <div className="max-w-xs mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Concentration Warnings Ribbon */}
          {result.concentration_warnings && result.concentration_warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Portfolio Concentration & Risk Clustering Diagnostics:</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300 pl-6 list-disc">
                {result.concentration_warnings.map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Comparison KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Portfolio Volatility vs Nifty 50 */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <JargonTooltip termKey="volatility_drag">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Risk-Parity Volatility</span>
              </JargonTooltip>
              <div className="text-2xl font-black text-cyan-400 font-mono font-tabular">
                {result.total_portfolio_volatility}%
              </div>
              <span className="text-[10px] text-slate-500">
                {result.benchmark_comparison ? `Nifty 50: ${result.benchmark_comparison.benchmark_volatility}%` : "Annualized standard deviation"}
              </span>
            </div>

            {/* 2. Volatility Reduction vs Equal Weight */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <JargonTooltip termKey="volatility_drag" title="Volatility Reduction">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Vol Reduction vs EW</span>
              </JargonTooltip>
              <div className="text-2xl font-black text-emerald-400 font-mono font-tabular flex items-center gap-1">
                <span>-{result.volatility_reduction_pct}%</span>
              </div>
              <span className="text-[10px] text-slate-500">Equal-Weight: {result.equal_weight_volatility}%</span>
            </div>

            {/* 3. Expected Return / Alpha */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">1Y Expected Return</span>
              <div className="text-2xl font-black text-slate-200 font-mono font-tabular">
                +{result.portfolio_expected_return}%
              </div>
              <span className="text-[10px] text-slate-500">
                {result.benchmark_comparison ? `Alpha vs Nifty 50: ${result.benchmark_comparison.cagr_alpha_pct >= 0 ? "+" : ""}${result.benchmark_comparison.cagr_alpha_pct}%` : "Weighted 1-year total return"}
              </span>
            </div>

            {/* 4. Portfolio Sharpe & ENB */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <JargonTooltip termKey="calmar_ratio" title="Sharpe & Risk-Adjusted Return">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Portfolio Sharpe</span>
              </JargonTooltip>
              <div className="text-2xl font-black text-amber-400 font-mono font-tabular">
                {result.portfolio_sharpe_ratio}
              </div>
              <span className="text-[10px] text-slate-500">
                <JargonTooltip termKey="diversification_ratio">
                  <span>Effective Assets (ENB): {result.effective_number_of_assets.toFixed(1)} / {result.tickers.length}</span>
                </JargonTooltip>
              </span>
            </div>
          </div>

          {/* ⚡ Historical Market Crash Stress-Test Replays Panel */}
          {result.stress_test_events && result.stress_test_events.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Historical Market Crash Simulation & Stress-Tests</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Benchmarked against Nifty 50 TRI</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.stress_test_events.map((event, idx) => {
                  const hasCushion = event.downside_cushion_pct > 0;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{event.event_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            hasCushion
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                              : "bg-amber-950/80 text-amber-300 border border-amber-800"
                          }`}>
                            {hasCushion ? `+${event.downside_cushion_pct}% Cushion` : `${event.downside_cushion_pct}% vs Index`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block">{event.period_label}</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{event.historical_context}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <span className="text-[9px] text-slate-500 block uppercase">Portfolio Max DD</span>
                            <span className="font-bold text-rose-400 text-sm">
                              -{event.portfolio_max_drawdown_pct}%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <span className="text-[9px] text-slate-500 block uppercase">Nifty 50 Max DD</span>
                            <span className="font-bold text-slate-400 text-sm">
                              -{event.benchmark_max_drawdown_pct}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>Recovery Duration:</span>
                          </span>
                          <span className="text-slate-200 font-bold">~{event.recovery_days_portfolio} Days</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allocation Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Allocation Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-cyan-400" />
                  <JargonTooltip termKey="erc">
                    <span>Target Asset Allocations (Cap: {result.max_weight_constraint}%)</span>
                  </JargonTooltip>
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
                  <span>Capital Weight vs Marginal Risk Contribution (MCR)</span>
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
                      formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, name === "weight_pct" ? "Allocation Weight" : "% Contribution to Risk"]}
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
                Risk-parity ensures higher volatility stocks receive lower capital weights so marginal risk is equalized.
              </p>
            </div>
          </div>

          {/* Sector Exposure Breakdown */}
          {result.sector_exposures && result.sector_exposures.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  <span>Sector Allocation & Concentration Exposures</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Max Recommended Sector Cap: 25%</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.sector_exposures.map((sec, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{sec.sector}</span>
                      <span className={`font-mono font-bold ${sec.weight_pct > 30 ? "text-amber-400" : "text-cyan-300"}`}>
                        {sec.weight_pct}% Weight
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${sec.weight_pct > 30 ? "bg-amber-400" : "bg-cyan-400"}`}
                        style={{ width: `${Math.min(100, sec.weight_pct * 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Risk Contribution:</span>
                      <span className="text-emerald-400">{sec.risk_contribution_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cumulative Backtest Chart with Nifty 50 TRI Benchmark */}
          {result.backtest_series && result.backtest_series.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    <span>Portfolio Visualizer 1-Year Cumulative Backtest vs Benchmark</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Risk-Parity vs Equal-Weight vs Nifty 50 TRI cumulative total returns (%)</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                    <span>Risk-Parity</span>
                  </span>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                    <span>Equal-Weight</span>
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    <span>Nifty 50 TRI</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.backtest_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                        name === "risk_parity" ? "Risk-Parity Return" : (name === "benchmark" ? "Nifty 50 TRI" : "Equal-Weight Return"),
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="risk_parity"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="equal_weight"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Correlation Heatmap Matrix */}
          {result.correlation_matrix && Object.keys(result.correlation_matrix).length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Grid className="h-4 w-4 text-emerald-400" />
                  <span>Asset Correlation Matrix (Pearson $r$)</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Lower Correlation = Higher Diversification</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                      <th className="pb-2 text-left">Asset</th>
                      {result.tickers.map((t) => (
                        <th key={`head-${t}`} className="pb-2 px-2 font-mono">
                          {t.replace(".NS", "")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {result.tickers.map((rowTicker) => (
                      <tr key={`row-${rowTicker}`} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 text-left font-bold text-slate-200">
                          {rowTicker.replace(".NS", "")}
                        </td>
                        {result.tickers.map((colTicker) => {
                          const val = result.correlation_matrix[rowTicker]?.[colTicker] ?? 1.0;
                          return (
                            <td key={`cell-${rowTicker}-${colTicker}`} className="py-2.5 px-2">
                              <span className={`px-2 py-1 rounded text-xs block ${getCorrBg(val)}`}>
                                {val.toFixed(2)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
