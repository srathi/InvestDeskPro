"use client";

import React, { useState, useEffect } from "react";
import {
  Filter,
  Sliders,
  RotateCcw,
  Building2,
  ArrowUpDown,
  Search,
  CheckCircle,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  runScreener,
  fetchScreenerStocks,
  ScreenerStockItem,
  ScreenerFilterRequest,
} from "../lib/api";

const PRESET_QUERIES = [
  {
    id: "debt_free_roce",
    name: "Debt-Free High ROCE",
    desc: "D/E <= 0.1, ROCE >= 25%",
    filters: { max_debt_to_equity: 0.1, min_roce: 25.0 },
  },
  {
    id: "value_growth",
    name: "Undervalued Growth",
    desc: "P/E <= 30, ROE >= 18%",
    filters: { max_pe: 30.0, min_roe: 18.0 },
  },
  {
    id: "dividend_cash",
    name: "Dividend Aristocrats",
    desc: "Div Yield >= 1.5%",
    filters: { min_div_yield: 1.5 },
  },
  {
    id: "momentum_leaders",
    name: "Momentum Multibaggers",
    desc: "1Y Return >= 50%",
    filters: { min_return_1y: 50.0 },
  },
];

interface StockScreenerViewProps {
  onSelectStock: (ticker: string) => void;
}

export const StockScreenerView: React.FC<StockScreenerViewProps> = ({ onSelectStock }) => {
  const [stocks, setStocks] = useState<ScreenerStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Filter Sliders State
  const [minMcap, setMinMcap] = useState<number>(0);
  const [maxPE, setMaxPE] = useState<number>(100);
  const [minROE, setMinROE] = useState<number>(0);
  const [minROCE, setMinROCE] = useState<number>(0);
  const [maxDE, setMaxDE] = useState<number>(2.0);
  const [min1YReturn, setMin1YReturn] = useState<number>(-50);
  const [sectorSearch, setSectorSearch] = useState<string>("");

  // Table Sorting
  const [sortBy, setSortBy] = useState<keyof ScreenerStockItem>("market_cap_cr");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const executeScreen = async (overrideFilters?: Partial<ScreenerFilterRequest>) => {
    setLoading(true);
    try {
      const payload: ScreenerFilterRequest = {
        min_market_cap_cr: minMcap > 0 ? minMcap : undefined,
        max_pe: maxPE < 100 ? maxPE : undefined,
        min_roe: minROE > 0 ? minROE : undefined,
        min_roce: minROCE > 0 ? minROCE : undefined,
        max_debt_to_equity: maxDE < 2.0 ? maxDE : undefined,
        min_return_1y: min1YReturn > -50 ? min1YReturn : undefined,
        sector: sectorSearch.trim() || undefined,
        sort_by: String(sortBy),
        sort_order: sortOrder,
        ...overrideFilters,
      };
      const res = await runScreener(payload);
      setStocks(res.stocks);
    } catch {
      const fallback = await fetchScreenerStocks().catch(() => ({ stocks: [] }));
      setStocks(fallback.stocks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeScreen();
  }, [minMcap, maxPE, minROE, minROCE, maxDE, min1YReturn, sectorSearch, sortBy, sortOrder]);

  const handleApplyPreset = (preset: typeof PRESET_QUERIES[0]) => {
    setActivePreset(preset.id);
    if (preset.id === "debt_free_roce") {
      setMaxDE(0.1);
      setMinROCE(25.0);
      setMaxPE(100);
      setMinROE(0);
      setMin1YReturn(-50);
    } else if (preset.id === "value_growth") {
      setMaxPE(30.0);
      setMinROE(18.0);
      setMaxDE(2.0);
      setMinROCE(0);
      setMin1YReturn(-50);
    } else if (preset.id === "dividend_cash") {
      setMinROE(15.0);
      setMaxDE(1.0);
      setMaxPE(100);
      setMinROCE(0);
      setMin1YReturn(-50);
    } else if (preset.id === "momentum_leaders") {
      setMin1YReturn(50.0);
      setMaxPE(100);
      setMaxDE(2.0);
      setMinROE(0);
      setMinROCE(0);
    }
  };

  const handleReset = () => {
    setActivePreset(null);
    setMinMcap(0);
    setMaxPE(100);
    setMinROE(0);
    setMinROCE(0);
    setMaxDE(2.0);
    setMin1YReturn(-50);
    setSectorSearch("");
    executeScreen({});
  };

  const handleExportCSV = () => {
    if (stocks.length === 0) return;
    let csv = "Ticker,Company Name,Sector,Market Cap (Cr),Price (Rs),P/E,ROE (%),ROCE (%),Debt to Equity,1Y Return (%)\n";
    stocks.forEach((s) => {
      csv += `"${s.ticker}","${s.company_name}","${s.sector}",${s.market_cap_cr},${s.price},${s.pe ?? ""},${s.roe ?? ""},${s.roce ?? ""},${s.debt_to_equity ?? ""},${s.return_1y ?? ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `InvestDeskPro_Screened_Stocks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: keyof ScreenerStockItem) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Queries Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Curated Institutional Screener Presets</h3>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePreset === preset.id
                  ? "bg-emerald-950/80 border-emerald-600 text-emerald-200 shadow-md shadow-emerald-950"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="font-bold text-xs text-white">{preset.name}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Filter Sliders Grid */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Multi-Factor Fundamental Sliders</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          {/* Max P/E */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Max Stock P/E:</span>
              <span className="font-bold text-cyan-400 font-tabular">{maxPE >= 100 ? "Any P/E" : `< ${maxPE}x`}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={maxPE}
              onChange={(e) => setMaxPE(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Min ROE */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Min Return on Equity (ROE):</span>
              <span className="font-bold text-emerald-400 font-tabular">{minROE <= 0 ? "Any ROE" : `> ${minROE}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="2"
              value={minROE}
              onChange={(e) => setMinROE(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Min ROCE */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Min Return on Capital (ROCE):</span>
              <span className="font-bold text-emerald-400 font-tabular">{minROCE <= 0 ? "Any ROCE" : `> ${minROCE}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="2"
              value={minROCE}
              onChange={(e) => setMinROCE(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Max D/E */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Max Debt to Equity (D/E):</span>
              <span className="font-bold text-amber-300 font-tabular">{maxDE >= 2.0 ? "Any D/E" : `< ${maxDE}x`}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={maxDE}
              onChange={(e) => setMaxDE(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Min 1Y Return */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Min 1-Year Return (%):</span>
              <span className="font-bold text-cyan-300 font-tabular">{min1YReturn <= -50 ? "Any Return" : `> ${min1YReturn}%`}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="150"
              step="10"
              value={min1YReturn}
              onChange={(e) => setMin1YReturn(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Sector Search */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[11px]">Filter by Sector / Industry:</span>
            <input
              type="text"
              value={sectorSearch}
              onChange={(e) => setSectorSearch(e.target.value)}
              placeholder="e.g. Technology, Auto, FMCG..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Filtered Results Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Filtered Indian Stock Results</h3>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
              {stocks.length} Companies
            </span>
          </div>
          <div className="flex items-center gap-3">
            {loading && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />}
            <button
              onClick={handleExportCSV}
              disabled={stocks.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:border-cyan-800 transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Export Screened Results to CSV"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th onClick={() => handleSort("company_name")} className="pb-2.5 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Company Name</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th onClick={() => handleSort("sector")} className="pb-2.5 cursor-pointer hover:text-white">Sector</th>
                <th onClick={() => handleSort("market_cap_cr")} className="pb-2.5 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Market Cap (Cr)</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th onClick={() => handleSort("price")} className="pb-2.5 text-right cursor-pointer hover:text-white">Price (₹)</th>
                <th onClick={() => handleSort("pe")} className="pb-2.5 text-right cursor-pointer hover:text-white">P/E</th>
                <th onClick={() => handleSort("roe")} className="pb-2.5 text-right cursor-pointer hover:text-white">ROE (%)</th>
                <th onClick={() => handleSort("roce")} className="pb-2.5 text-right cursor-pointer hover:text-white">ROCE (%)</th>
                <th onClick={() => handleSort("debt_to_equity")} className="pb-2.5 text-right cursor-pointer hover:text-white">D/E</th>
                <th onClick={() => handleSort("return_1y")} className="pb-2.5 text-right cursor-pointer hover:text-white">1Y Return</th>
                <th className="pb-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stocks.map((s) => (
                <tr
                  key={s.ticker}
                  className="hover:bg-slate-800/40 transition-colors text-slate-200"
                >
                  <td className="py-2.5 font-semibold text-white">
                    <div>{s.company_name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{s.ticker}</span>
                  </td>
                  <td className="py-2.5 text-slate-400 font-sans">{s.sector}</td>
                  <td className="py-2.5 text-right font-tabular">₹{s.market_cap_cr.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right font-tabular font-bold">₹{s.price.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-tabular text-cyan-300">{s.pe ? `${s.pe}x` : "-"}</td>
                  <td className="py-2.5 text-right font-tabular text-emerald-400">{s.roe ? `${s.roe}%` : "-"}</td>
                  <td className="py-2.5 text-right font-tabular text-emerald-400">{s.roce ? `${s.roce}%` : "-"}</td>
                  <td className="py-2.5 text-right font-tabular text-slate-300">{s.debt_to_equity !== null && s.debt_to_equity !== undefined ? `${s.debt_to_equity}x` : "0.00"}</td>
                  <td className={`py-2.5 text-right font-tabular ${(s.return_1y || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {(s.return_1y || 0) >= 0 ? `+${s.return_1y}%` : `${s.return_1y}%`}
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => onSelectStock(s.ticker.replace(".NS", ""))}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto"
                    >
                      <span>Analyze</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
