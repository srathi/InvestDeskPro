"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
  Grid,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Flame,
  Clock,
  Briefcase,
  Crosshair,
  SlidersHorizontal,
  RotateCcw,
  Scale,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download,
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
import * as XLSX from "xlsx";

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
    name: "Nifty Core 6",
    tickers: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "LT"],
  },
  {
    name: "Financials + Tech",
    tickers: ["HDFCBANK", "ICICIBANK", "SBIN", "TCS", "INFY", "HCLTECH"],
  },
  {
    name: "Defensive All-Weather",
    tickers: ["ITC", "HINDUNILVR", "SUNPHARMA", "CIPLA", "TCS", "NESTLEIND"],
  },
  {
    name: "High-Growth Leaders",
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
  "#e11d48",
  "#0ea5e9",
  "#a855f7",
  "#22c55e",
  "#eab308",
  "#f43f5e",
  "#64748b",
  "#38bdf8",
];

export const PortfolioOptimizerView: React.FC = () => {
  // 🌟 Default to empty list as requested
  const [tickerList, setTickerList] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState("");
  const [maxWeight, setMaxWeight] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<PortfolioOptimizeResponse | null>(null);

  // Table collapse/expand state
  const [isTableExpanded, setIsTableExpanded] = useState(true);

  // Custom User Weight State
  const [allocationMode, setAllocationMode] = useState<"risk_parity" | "custom">("risk_parity");
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

  // Selected tickers to display in Correlation Matrix
  const [selectedCorrTickers, setSelectedCorrTickers] = useState<string[]>([]);
  const [pairStockA, setPairStockA] = useState<string>("");
  const [pairStockB, setPairStockB] = useState<string>("");

  // Autocomplete state for portfolio stock additions
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedInput = useDebounce(newTicker, 250);

  const runOptimization = async (tickers: string[], cap: number) => {
    if (tickers.length < 2) {
      setRawResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await optimizePortfolio(tickers, cap);
      setRawResult(data);
      // Sync default weights into custom weights dictionary
      const initialMap: Record<string, number> = {};
      data.allocations.forEach((a) => {
        initialMap[a.ticker] = a.weight_pct;
      });
      setCustomWeights(initialMap);
      const cleanList = data.allocations.map((a) => a.ticker.replace(".NS", "").replace(".BO", ""));
      setTickerList(cleanList);

      // Initialize correlation subset to top 8 holdings or all
      const defaultSubset = data.tickers.slice(0, Math.min(8, data.tickers.length));
      setSelectedCorrTickers(defaultSubset);
      if (data.tickers.length >= 2) {
        setPairStockA(data.tickers[0]);
        setPairStockB(data.tickers[1]);
      }

      if (cleanList.length < tickers.length) {
        setUploadSuccess(`Loaded ${cleanList.length} of ${tickers.length} stock holdings (unresolvable or bond symbols skipped).`);
      } else {
        setUploadSuccess(`Successfully loaded and optimized all ${cleanList.length} stock holdings.`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to simulate risk-parity stress test.");
      setRawResult(null);
    } finally {
      setLoading(false);
    }
  };

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
      const updated = [...tickerList, clean];
      setTickerList(updated);
      setNewTicker("");
      setShowDropdown(false);
      setAllocationMode("risk_parity");
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
    const clean = tickerToRemove.replace(".NS", "").replace(".BO", "");
    const updated = tickerList.filter((t) => t !== clean && t !== tickerToRemove);
    setTickerList(updated);
    if (updated.length >= 2) {
      setAllocationMode("risk_parity");
      runOptimization(updated, maxWeight);
    } else {
      setRawResult(null);
      setError(null);
    }
  };

  const loadPreset = (basket: { name: string; tickers: string[] }) => {
    setTickerList(basket.tickers);
    setAllocationMode("risk_parity");
    setUploadSuccess(null);
    runOptimization(basket.tickers, maxWeight);
  };

  // 📥 Comprehensive CSV / Excel File Upload Handler for Zerodha, Groww, Upstox, ICICI, etc.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const IGNORED_TOKENS = new Set([
          "TOTAL", "SUBTOTAL", "GRAND", "CHARGES", "TURNOVER", "TAX", "STT", "PROFIT", "LOSS",
          "REALIZED", "UNREALIZED", "SHORT", "LONG", "TERM", "DATE", "SUMMARY", "NET", "BUY",
          "SELL", "CLIENT", "PAN", "DISCLAIMER", "STATEMENT", "EQUITY", "MUTUAL", "FUNDS",
          "DERIVATIVES", "COMMODITY", "CURRENCY", "ISIN", "QUANTITY", "VALUE", "AVERAGE",
          "PRICE", "OPEN", "CLOSE", "HIGH", "LOW", "SCRIP", "NAME", "SYMBOL", "INSTRUMENT",
          "SECURITY", "HOLDING", "HOLDINGS", "PORTFOLIO", "EXCHANGE", "SEGMENT", "STATUS",
          "NIL", "NA", "NAN", "NULL", "UNDEFINED", "TRADE", "TRADES", "TRADING", "BROKERAGE",
          "GST", "STAMP", "SEBI", "TRANSACTION", "CREDIT", "DEBIT", "AMOUNT", "SERIAL", "NO", "SR"
        ]);

        const extracted: string[] = [];

        // Scan all sheets in the workbook (e.g. Tradewise-Equity, Equity, Scripmaster, Sheet1)
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (!rows || rows.length === 0) continue;

          // Find header row by scanning first 35 rows for keyword markers
          let headerRowIdx = -1;
          let symbolColIdx = -1;

          for (let r = 0; r < Math.min(35, rows.length); r++) {
            const row = rows[r];
            if (!Array.isArray(row)) continue;
            for (let c = 0; c < row.length; c++) {
              const cellStr = String(row[c] || "").toLowerCase().trim();
              if (
                cellStr === "symbol" ||
                cellStr === "stock symbol" ||
                cellStr === "scrip" ||
                cellStr === "scrip name" ||
                cellStr === "ticker" ||
                cellStr === "instrument" ||
                cellStr === "instrument name" ||
                cellStr === "stock" ||
                cellStr === "security" ||
                cellStr === "tradename" ||
                cellStr === "company" ||
                cellStr === "isin"
              ) {
                headerRowIdx = r;
                symbolColIdx = c;
                break;
              }
            }
            if (headerRowIdx !== -1) break;
          }

          // If a table header was located in this sheet
          if (headerRowIdx !== -1 && symbolColIdx !== -1) {
            for (let r = headerRowIdx + 1; r < rows.length; r++) {
              const row = rows[r];
              if (!row || row.length === 0) continue;

              let raw = String(row[symbolColIdx] || "").trim();
              if (!raw) continue;

              // Clean ticker symbol (strip NSE:, BSE:, .NS, .BO, -EQ, quotes)
              let clean = raw
                .toUpperCase()
                .replace(/^NSE:/, "")
                .replace(/^BSE:/, "")
                .replace(/\.NS$/, "")
                .replace(/\.BO$/, "")
                .replace(/-EQ$/, "")
                .replace(/-BE$/, "")
                .replace(/-BL$/, "")
                .replace(/-BZ$/, "")
                .replace(/["'()]/g, "")
                .trim();

              const token = clean.split(/[\s,/]+/)[0];
              if (
                token &&
                token.length >= 2 &&
                token.length <= 25 &&
                isNaN(Number(token)) &&
                !IGNORED_TOKENS.has(token) &&
                !/^\d{4}-\d{2}-\d{2}/.test(token)
              ) {
                if (!extracted.includes(token)) {
                  extracted.push(token);
                }
              }
            }
          } else {
            // Fallback for raw simple single-column symbol list
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              if (!row || row.length === 0) continue;
              for (const cell of row) {
                if (!cell || typeof cell !== "string") continue;
                let clean = cell
                  .toUpperCase()
                  .replace(/^NSE:/, "")
                  .replace(/^BSE:/, "")
                  .replace(/\.NS$/, "")
                  .replace(/\.BO$/, "")
                  .replace(/-EQ$/, "")
                  .replace(/-BE$/, "")
                  .replace(/["'()]/g, "")
                  .trim();
                const token = clean.split(/[\s,/]+/)[0];
                if (
                  token &&
                  token.length >= 2 &&
                  token.length <= 20 &&
                  /^[A-Z0-9&-]+$/.test(token) &&
                  isNaN(Number(token)) &&
                  !IGNORED_TOKENS.has(token)
                ) {
                  if (!extracted.includes(token)) {
                    extracted.push(token);
                  }
                }
              }
            }
          }
        }

        if (extracted.length < 2) {
          setError(`Found only ${extracted.length} valid stock symbols in "${file.name}". Please ensure the file contains at least 2 equity stock symbols.`);
          return;
        }

        setTickerList(extracted);
        setAllocationMode("risk_parity");
        setUploadSuccess(`Imported ${extracted.length} stock holdings from "${file.name}". Solving optimal covariance and risk-parity allocations...`);
        setError(null);
        setIsTableExpanded(true);
        runOptimization(extracted, maxWeight);
      } catch (err: any) {
        setError(`Failed to parse file "${file.name}": ${err.message || "Invalid file format."}`);
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input so user can re-upload same file if needed
    e.target.value = "";
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = "Symbol,Company Name\nRELIANCE,Reliance Industries Ltd\nTCS,Tata Consultancy Services Ltd\nHDFCBANK,HDFC Bank Ltd\nINFY,Infosys Ltd\nITC,ITC Ltd\nLT,Larsen & Toubro Ltd\nTATAMOTORS,Tata Motors Ltd\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_portfolio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWeightChange = (ticker: string, newWeight: number) => {
    setAllocationMode("custom");
    const val = Math.max(0, Math.min(100, Number(newWeight) || 0));
    setCustomWeights((prev) => ({
      ...prev,
      [ticker]: Math.round(val * 10) / 10,
    }));
  };

  const handleNormalizeWeights = () => {
    const total = Object.values(customWeights).reduce((a, b) => a + b, 0);
    if (total <= 0) return;
    const factor = 100.0 / total;
    const normalized: Record<string, number> = {};
    Object.keys(customWeights).forEach((k) => {
      normalized[k] = Math.round(customWeights[k] * factor * 10) / 10;
    });
    setCustomWeights(normalized);
  };

  const handleEqualizeWeights = () => {
    if (tickerList.length === 0) return;
    setAllocationMode("custom");
    const eq = Math.round((100.0 / tickerList.length) * 10) / 10;
    const equalized: Record<string, number> = {};
    if (rawResult) {
      rawResult.allocations.forEach((a) => {
        equalized[a.ticker] = eq;
      });
    } else {
      tickerList.forEach((t) => {
        equalized[t] = eq;
      });
    }
    setCustomWeights(equalized);
  };

  const handleResetToRiskParity = () => {
    setAllocationMode("risk_parity");
    if (rawResult) {
      const initialMap: Record<string, number> = {};
      rawResult.allocations.forEach((a) => {
        initialMap[a.ticker] = a.weight_pct;
      });
      setCustomWeights(initialMap);
    }
  };

  // Recompute active display result based on whether user is in Custom or Risk Parity Mode
  const activeResult = useMemo(() => {
    if (!rawResult) return null;
    if (allocationMode === "risk_parity") return rawResult;

    // In Custom Mode: dynamically recalculate portfolio volatility, allocations, and risk contributions
    const allocations = rawResult.allocations.map((item) => {
      const userW = customWeights[item.ticker] ?? item.weight_pct;
      return {
        ...item,
        weight_pct: userW,
      };
    });

    const totalWeight = allocations.reduce((acc, a) => acc + a.weight_pct, 0);
    const scale = totalWeight > 0 ? 100.0 / totalWeight : 1.0;
    const normalizedWeights = allocations.map((a) => (a.weight_pct * scale) / 100.0);

    // Compute portfolio volatility using covariance matrix
    let portVar = 0.0;
    const n = rawResult.tickers.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const t_i = rawResult.tickers[i];
        const t_j = rawResult.tickers[j];
        const cov_ij = rawResult.covariance_matrix[t_i]?.[t_j] ?? 0.0;
        portVar += normalizedWeights[i] * normalizedWeights[j] * cov_ij;
      }
    }
    const portVol = Math.sqrt(Math.max(1e-8, portVar));

    // Compute marginal risk contribution for each asset
    const updatedAllocations = allocations.map((a, i) => {
      let mrc_i = 0.0;
      for (let j = 0; j < n; j++) {
        const t_j = rawResult.tickers[j];
        const cov_ij = rawResult.covariance_matrix[a.ticker]?.[t_j] ?? 0.0;
        mrc_i += cov_ij * normalizedWeights[j];
      }
      mrc_i = mrc_i / portVol;
      const prc_i = (normalizedWeights[i] * mrc_i) / portVol * 100.0;
      return {
        ...a,
        risk_contribution_pct: Math.round(prc_i * 10) / 10,
      };
    });

    const customExpectedReturn = updatedAllocations.reduce((acc, a, idx) => acc + normalizedWeights[idx] * (a.expected_return_1y || 12.0), 0);
    const customSharpe = portVol > 0 ? (customExpectedReturn - 6.5) / (portVol * 100.0) : 0;

    return {
      ...rawResult,
      allocations: updatedAllocations,
      total_portfolio_volatility: Math.round(portVol * 10000) / 100,
      portfolio_expected_return: Math.round(customExpectedReturn * 10) / 10,
      portfolio_sharpe_ratio: Math.round(customSharpe * 100) / 100,
    };
  }, [rawResult, allocationMode, customWeights]);

  const totalCustomWeight = useMemo(() => {
    return Object.values(customWeights).reduce((a, b) => a + b, 0);
  }, [customWeights]);

  const getCorrBg = (val: number) => {
    if (val >= 0.7) return "bg-rose-950/80 text-rose-300 font-bold border border-rose-800";
    if (val >= 0.4) return "bg-amber-950/60 text-amber-300";
    if (val >= 0.1) return "bg-cyan-950/60 text-cyan-300";
    return "bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-800/60";
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for CSV / XLS upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
      />

      {/* Interactive Stock Builder & Constraint Controls */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-800 space-y-4 relative z-30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-indigo-400" />
              <span>Interactive Portfolio Stress-Tester & Risk-Parity Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Add any number of Indian stocks (or import CSV / Excel) to simulate optimal inverse-volatility weights, marginal risk contributions, and historical crash replays vs Nifty 50 TRI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* CSV / Excel File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Upload holdings from Zerodha, Groww, Upstox, Excel or CSV export"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Import CSV / Excel</span>
            </button>

            {/* Allocation Cap Slider */}
            <div className="flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Max Cap:</span>
                <span className="text-xs font-bold text-cyan-300 font-mono w-8">{maxWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={maxWeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxWeight(val);
                  if (tickerList.length >= 2) {
                    runOptimization(tickerList, val);
                  }
                }}
                className="w-24 accent-cyan-500 cursor-pointer"
              />
            </div>
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
                  className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 rounded-xl pl-4 pr-9 py-2 text-base md:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono uppercase"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
                )}
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-950 flex items-center gap-1.5 shrink-0 cursor-pointer"
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
          <div className="flex items-center gap-1.5 pt-1 sm:pt-0 overflow-x-auto no-scrollbar py-1 md:flex-wrap md:overflow-visible">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1 shrink-0">Templates:</span>
            {PRESET_BASKETS.map((basket) => (
              <button
                key={basket.name}
                onClick={() => loadPreset(basket)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-indigo-600 hover:text-white transition-all whitespace-nowrap shrink-0 md:shrink cursor-pointer"
              >
                {basket.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Ticker Chips */}
        {tickerList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">Active Holdings ({tickerList.length}):</span>
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
            <button
              onClick={() => {
                setTickerList([]);
                setRawResult(null);
                setUploadSuccess(null);
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 text-xs md:text-sm flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button
            onClick={() => setUploadSuccess(null)}
            className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 🌟 Welcome / Empty State Prompt when list is empty */}
      {tickerList.length < 2 && !loading && (
        <div className="glass-panel p-10 rounded-3xl border border-slate-800/80 text-center space-y-6 my-4 bg-gradient-to-b from-slate-900/40 to-slate-950/80">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/50">
            <Briefcase className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-white tracking-tight">Your Portfolio is Currently Empty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add at least <strong className="text-indigo-300">2 stocks</strong> using the search bar above, <strong className="text-emerald-300">import a CSV/Excel file</strong> from your broker, or pick a template below.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Upload Portfolio (CSV / Excel)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-400" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/60 max-w-lg mx-auto">
            {PRESET_BASKETS.map((basket) => (
              <button
                key={basket.name}
                onClick={() => loadPreset(basket)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-indigo-950/80 text-slate-300 border border-slate-800 hover:border-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span>{basket.name} ({basket.tickers.length} Stocks)</span>
              </button>
            ))}
          </div>
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

      {activeResult && tickerList.length >= 2 && (
        <div className="space-y-6">
          {/* Concentration Warnings Ribbon */}
          {activeResult.concentration_warnings && activeResult.concentration_warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Portfolio Concentration & Risk Clustering Diagnostics:</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300 pl-6 list-disc">
                {activeResult.concentration_warnings.map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 🌟 COLLAPSIBLE / EXPANDABLE INTERACTIVE STOCK ALLOCATION MANAGER TABLE */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {/* Header Accordion Bar */}
            <div
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors select-none"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Manage Holdings & Custom Weight Allocations ({tickerList.length} Stocks)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      Math.abs(totalCustomWeight - 100) < 0.5 ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}>
                      Sum: {totalCustomWeight.toFixed(1)}% / 100%
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Adjust percent allocations via interactive sliders or direct inputs. Toggle between algorithmic Risk-Parity and Custom weights.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetToRiskParity();
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      allocationMode === "risk_parity"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Auto Risk-Parity
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAllocationMode("custom");
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      allocationMode === "custom"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Custom Sliders
                  </button>
                </div>

                <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
                  {isTableExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {/* Collapsible Body */}
            {isTableExpanded && (
              <div className="p-4 space-y-4">
                {/* Table Quick Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Active Mode:</span>
                    <strong className={allocationMode === "risk_parity" ? "text-indigo-400 font-mono" : "text-cyan-400 font-mono"}>
                      {allocationMode === "risk_parity" ? "Algorithmic Inverse-Volatility Risk-Parity" : "User-Defined Custom Allocations"}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleNormalizeWeights}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Proportionally scale all weights to sum exactly to 100%"
                    >
                      <RotateCcw className="h-3 w-3 text-emerald-400" />
                      <span>Normalize to 100%</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEqualizeWeights}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Set equal weights across all holdings"
                    >
                      <Scale className="h-3 w-3 text-cyan-400" />
                      <span>Equal-Weight</span>
                    </button>
                  </div>
                </div>

                {/* Table Rendering */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="pb-3 pl-2">Asset / Holding</th>
                        <th className="pb-3 text-center w-64">Target Weight % (Slider & Input)</th>
                        <th className="pb-3 text-right">1Y Realized Vol</th>
                        <th className="pb-3 text-right">Risk Contribution</th>
                        <th className="pb-3 text-right">1Y Return</th>
                        <th className="pb-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {activeResult.allocations.map((item, idx) => {
                        const currentWeight = customWeights[item.ticker] ?? item.weight_pct;
                        return (
                          <tr key={item.ticker} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 pl-2 font-bold text-slate-200">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                />
                                <div>
                                  <span className="font-mono text-sm block">{item.ticker.replace(".NS", "")}</span>
                                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                                    {item.name}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Slider + Normal Input Column */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={currentWeight}
                                  onChange={(e) => handleWeightChange(item.ticker, Number(e.target.value))}
                                  className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={currentWeight}
                                    onChange={(e) => handleWeightChange(item.ticker, Number(e.target.value))}
                                    className="w-16 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-right font-bold text-cyan-300 font-mono focus:outline-none"
                                  />
                                  <span className="text-slate-400 font-mono">%</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 text-right text-slate-300 font-tabular">
                              {item.realized_volatility}%
                            </td>

                            <td className="py-3 text-right font-tabular">
                              <span className={`font-bold ${item.risk_contribution_pct > 24 ? "text-amber-400" : "text-emerald-400"}`}>
                                {item.risk_contribution_pct}%
                              </span>
                            </td>

                            <td className={`py-3 text-right font-tabular ${item.expected_return_1y >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {item.expected_return_1y >= 0 ? `+${item.expected_return_1y}%` : `${item.expected_return_1y}%`}
                            </td>

                            <td className="py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeTicker(item.ticker)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Remove Stock"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Top Comparison KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Portfolio Volatility vs Nifty 50 */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <JargonTooltip termKey="volatility_drag">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                  {allocationMode === "risk_parity" ? "Risk-Parity Volatility" : "Custom Portfolio Volatility"}
                </span>
              </JargonTooltip>
              <div className="text-2xl font-black text-cyan-400 font-mono font-tabular">
                {activeResult.total_portfolio_volatility}%
              </div>
              <span className="text-[10px] text-slate-500">
                {activeResult.benchmark_comparison ? `Nifty 50: ${activeResult.benchmark_comparison.benchmark_volatility}%` : "Annualized standard deviation"}
              </span>
            </div>

            {/* 2. Volatility Reduction vs Equal Weight */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <JargonTooltip termKey="volatility_drag" title="Volatility Reduction">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Vol Reduction vs EW</span>
              </JargonTooltip>
              <div className="text-2xl font-black text-emerald-400 font-mono font-tabular flex items-center gap-1">
                <span>-{activeResult.volatility_reduction_pct}%</span>
              </div>
              <span className="text-[10px] text-slate-500">Equal-Weight: {activeResult.equal_weight_volatility}%</span>
            </div>

            {/* 3. Expected Return / Alpha */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">1Y Expected Return</span>
              <div className="text-2xl font-black text-slate-200 font-mono font-tabular">
                +{activeResult.portfolio_expected_return}%
              </div>
              <span className="text-[10px] text-slate-500">
                {activeResult.benchmark_comparison ? `Alpha vs Nifty 50: ${activeResult.benchmark_comparison.cagr_alpha_pct >= 0 ? "+" : ""}${activeResult.benchmark_comparison.cagr_alpha_pct}%` : "Weighted 1-year total return"}
              </span>
            </div>

            {/* 4. Portfolio Sharpe & ENB */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <JargonTooltip termKey="calmar_ratio" title="Sharpe & Risk-Adjusted Return">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Portfolio Sharpe</span>
              </JargonTooltip>
              <div className="text-2xl font-black text-amber-400 font-mono font-tabular">
                {activeResult.portfolio_sharpe_ratio}
              </div>
              <span className="text-[10px] text-slate-500">
                <JargonTooltip termKey="diversification_ratio">
                  <span>Effective Assets (ENB): {activeResult.effective_number_of_assets.toFixed(1)} / {activeResult.tickers.length}</span>
                </JargonTooltip>
              </span>
            </div>
          </div>

          {/* ⚡ Historical Market Crash Stress-Test Replays Panel */}
          {activeResult.stress_test_events && activeResult.stress_test_events.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Historical Market Crash Simulation & Stress-Tests</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Benchmarked against Nifty 50 TRI</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeResult.stress_test_events.map((event, idx) => {
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
                    <span>Target Asset Allocations ({allocationMode === "risk_parity" ? `Risk Parity Cap: ${activeResult.max_weight_constraint}%` : "Custom Mode"})</span>
                  </JargonTooltip>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Sum: {totalCustomWeight.toFixed(1)}%</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeResult.allocations}
                      dataKey="weight_pct"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {activeResult.allocations.map((entry, index) => (
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
                {activeResult.allocations.map((item, idx) => (
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
                <span className="text-[10px] text-slate-500 font-mono">Marginal Risk</span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeResult.allocations}
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
                Risk-parity balances marginal contributions to risk so no single volatile holding dominates overall portfolio fluctuations.
              </p>
            </div>
          </div>

          {/* Sector Exposure Breakdown */}
          {activeResult.sector_exposures && activeResult.sector_exposures.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  <span>Sector Allocation & Concentration Exposures</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Max Recommended Sector Cap: 25%</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeResult.sector_exposures.map((sec, idx) => (
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
          {activeResult.backtest_series && activeResult.backtest_series.length > 0 && (
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
                  <LineChart data={activeResult.backtest_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

          {/* Interactive Correlation Heatmap Matrix & Pairwise Inspector */}
          {activeResult.correlation_matrix && Object.keys(activeResult.correlation_matrix).length > 0 && (
            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid className="h-4 w-4 text-emerald-400" />
                    <span>Interactive Asset Correlation Matrix (Pearson $r$)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select which stocks to compare or inspect individual pairs to analyze co-movement and diversification benefit.
                  </p>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const top = activeResult.tickers.slice(0, Math.min(8, activeResult.tickers.length));
                      setSelectedCorrTickers(top);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 font-semibold transition-all cursor-pointer"
                  >
                    Top 8 Holdings
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCorrTickers([...activeResult.tickers])}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold transition-all cursor-pointer"
                  >
                    Show All ({activeResult.tickers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCorrTickers([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* 1. Interactive Stock Selector Pill Badges */}
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Click stocks to include / exclude in correlation matrix:
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {selectedCorrTickers.length} of {activeResult.tickers.length} Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeResult.tickers.map((t) => {
                    const isSelected = selectedCorrTickers.includes(t);
                    const cleanName = t.replace(".NS", "").replace(".BO", "");
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedCorrTickers.length <= 2) return;
                            setSelectedCorrTickers(selectedCorrTickers.filter((x) => x !== t));
                          } else {
                            setSelectedCorrTickers([...selectedCorrTickers, t]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-950/90 text-indigo-200 border border-indigo-600 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-indigo-400" : "bg-slate-600"}`} />
                        <span>{cleanName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pairwise 1-on-1 Correlation Inspector */}
              {activeResult.tickers.length >= 2 && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="h-4 w-4 text-cyan-400" />
                      <span>Pairwise Correlation Quick-Inspector</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">Real-Time Pearson $r$</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    {/* Select Stock A */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 block">Stock 1</label>
                      <select
                        value={pairStockA}
                        onChange={(e) => setPairStockA(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {activeResult.tickers.map((t) => (
                          <option key={`a-${t}`} value={t}>
                            {t.replace(".NS", "").replace(".BO", "")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Stock B */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 block">Stock 2</label>
                      <select
                        value={pairStockB}
                        onChange={(e) => setPairStockB(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {activeResult.tickers.map((t) => (
                          <option key={`b-${t}`} value={t}>
                            {t.replace(".NS", "").replace(".BO", "")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Correlation Metric Display */}
                    {(() => {
                      const pairVal = activeResult.correlation_matrix[pairStockA]?.[pairStockB] ?? (pairStockA === pairStockB ? 1.0 : 0.5);
                      const isHigh = pairVal >= 0.70;
                      const isLow = pairVal < 0.35;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-mono">Correlation</span>
                            <span className={`text-base font-black font-mono ${isHigh ? "text-rose-400" : isLow ? "text-emerald-400" : "text-cyan-400"}`}>
                              r = {pairVal.toFixed(2)}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono ${
                            isHigh
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : isLow
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          }`}>
                            {isHigh ? "High Co-Movement" : isLow ? "High Diversification" : "Moderate"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 3. Filtered Matrix Table */}
              {selectedCorrTickers.length >= 2 ? (
                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="pb-2 text-left pl-2">Asset</th>
                        {selectedCorrTickers.map((t) => (
                          <th key={`head-${t}`} className="pb-2 px-2 font-mono">
                            {t.replace(".NS", "").replace(".BO", "")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {selectedCorrTickers.map((rowTicker) => (
                        <tr key={`row-${rowTicker}`} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 pl-2 text-left font-bold text-slate-200">
                            {rowTicker.replace(".NS", "").replace(".BO", "")}
                          </td>
                          {selectedCorrTickers.map((colTicker) => {
                            const val = activeResult.correlation_matrix[rowTicker]?.[colTicker] ?? 1.0;
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
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  Please select at least 2 stocks using the pills above to view the correlation matrix.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
