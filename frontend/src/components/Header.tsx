"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Building2,
  Filter,
  Layers,
  Cpu,
  Search,
  ExternalLink,
  TrendingUp,
  LineChart,
  PieChart,
  ShieldCheck,
  Sparkles,
  Loader2,
  BookOpen,
} from "lucide-react";
import { fetchOmniSearch, OmniSearchResult, fetchMarketRibbonData, MarketIndexQuote, InstitutionalFlow } from "../lib/api";

interface HeaderProps {
  activeTab: "company" | "funds" | "quant";
  setActiveTab: (tab: "company" | "funds" | "quant") => void;
  apiOnline: boolean;
  onSelectEntity?: (id: string, type: "stock" | "fund") => void;
  onResetHome?: () => void;
  onOpenGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  apiOnline,
  onSelectEntity,
  onResetHome,
  onOpenGuide,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OmniSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [marketIndices, setMarketIndices] = useState<MarketIndexQuote[]>([
    { symbol: "^NSEI", name: "NIFTY 50", price: 24823.15, change: 168.20, change_pct: 0.68, currency: "INR", updated_at: "Live" },
    { symbol: "^BSESN", name: "SENSEX", price: 81332.72, change: 445.50, change_pct: 0.55, currency: "INR", updated_at: "Live" },
    { symbol: "^NSEBANK", name: "NIFTY BANK", price: 51290.40, change: 418.60, change_pct: 0.82, currency: "INR", updated_at: "Live" },
    { symbol: "^INDIAVIX", name: "INDIA VIX", price: 13.42, change: -0.44, change_pct: -3.15, currency: "INR", updated_at: "Live" },
    { symbol: "BZ=F", name: "BRENT CRUDE", price: 73.50, change: -0.45, change_pct: -0.61, currency: "USD", unit: "/bbl", updated_at: "Live" },
  ]);
  const [institutionalFlow, setInstitutionalFlow] = useState<InstitutionalFlow[]>([
    { category: "FII", buy_value_cr: 26715.88, sell_value_cr: 20027.51, net_value_cr: 6688.37, date: "Latest" },
    { category: "DII", buy_value_cr: 17639.89, sell_value_cr: 14826.91, net_value_cr: 2812.98, date: "Latest" },
  ]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Fetch market indices (every 60s) and institutional flow (once on mount)
  useEffect(() => {
    let isMounted = true;
    const loadRibbonData = async () => {
      try {
        const data = await fetchMarketRibbonData();
        if (isMounted && data) {
          if (data.indices && data.indices.length > 0) {
            setMarketIndices(data.indices);
          }
          if (data.institutional_flow && data.institutional_flow.length > 0) {
            setInstitutionalFlow(data.institutional_flow);
          }
        }
      } catch (e) {
        // Keep existing quotes
      }
    };
    loadRibbonData();
    const interval = setInterval(loadRibbonData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Global Cmd+K / Ctrl+K / '/' / '?' shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if ((e.key === "?" || (e.shiftKey && e.key === "/")) && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        onOpenGuide?.();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onOpenGuide]);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const res = await fetchOmniSearch(searchQuery);
          setSearchResults(res);
          setShowDropdown(res.length > 0);
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
    }, 180);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: OmniSearchResult) => {
    isSelectingRef.current = true;
    setShowDropdown(false);
    setSearchResults([]);
    setSearchQuery("");
    inputRef.current?.blur();
    if (onSelectEntity) {
      const targetId = item.type === "fund" ? item.id : (item.symbol_or_code || item.id);
      onSelectEntity(targetId, item.type);
    }
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
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelect(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
      } else if (searchQuery.trim()) {
        isSelectingRef.current = true;
        setShowDropdown(false);
        setSearchResults([]);
        const query = searchQuery.trim().toUpperCase();
        setSearchQuery("");
        inputRef.current?.blur();
        if (onSelectEntity) {
          onSelectEntity(query, "stock");
        }
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleBrandClick = () => {
    if (onResetHome) {
      onResetHome();
    } else {
      setActiveTab("company");
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Market Indices Ribbon */}
      <div className="border-b border-slate-800/60 px-4 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between overflow-x-auto gap-6 whitespace-nowrap bg-slate-900/40">
        <div className="flex items-center gap-6">
          {/* Major Indices & Commodities */}
          {marketIndices.map((idx) => {
            const isPos = idx.change_pct >= 0;
            const isVix = idx.name.includes("VIX");
            const isCrude = idx.name.includes("CRUDE") || idx.name.includes("BRENT");
            const isUsd = idx.currency === "USD" || isCrude;

            // For VIX & Crude, a drop is favorable for Indian equities / macro
            const colorClass = isVix || isCrude
              ? (idx.change_pct <= 0 ? "text-cyan-400" : "text-amber-400")
              : (isPos ? "text-emerald-400" : "text-rose-400");

            const formattedPrice = isUsd
              ? `$${idx.price.toFixed(2)}${idx.unit ? idx.unit : ""}`
              : idx.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return (
              <div key={idx.symbol} className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{idx.name}</span>
                <span className={`${colorClass} font-bold`}>
                  {idx.change_pct >= 0 ? `+${idx.change_pct.toFixed(2)}%` : `${idx.change_pct.toFixed(2)}%`}
                </span>
                <span className="text-slate-400 font-tabular">
                  {formattedPrice}
                </span>
              </div>
            );
          })}

          {/* Institutional Cash Flow (FII / DII Daily Activity) */}
          {institutionalFlow.length > 0 && (
            <>
              <span className="text-slate-700 select-none">|</span>
              {institutionalFlow.map((flow) => {
                const isBuy = flow.net_value_cr >= 0;
                const formattedNet = Math.abs(flow.net_value_cr).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                });
                return (
                  <div
                    key={flow.category}
                    className="flex items-center gap-1.5"
                    title={`${flow.category} Cash Activity (${flow.date}): Buy ₹${flow.buy_value_cr.toLocaleString("en-IN")} Cr | Sell ₹${flow.sell_value_cr.toLocaleString("en-IN")} Cr`}
                  >
                    <span className="font-semibold text-slate-300 uppercase">
                      {flow.category} NET
                    </span>
                    <span
                      className={`font-bold ${
                        isBuy ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isBuy ? `+₹${formattedNet} Cr` : `-₹${formattedNet} Cr`}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://rupeemap.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[10px] font-medium hover:bg-emerald-900/80 transition-colors"
          >
            <span className="font-bold">rupeemap.in</span>
            <span className="text-emerald-500">•</span>
            <span className="text-emerald-200">By Sandesh Rathi</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>

          <span className="text-slate-700">|</span>

          <span className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                apiOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className={apiOnline ? "text-emerald-400 font-semibold" : "text-amber-400"}>
              {apiOnline ? "FastAPI Live" : "Connecting..."}
            </span>
          </span>
        </div>
      </div>

      {/* Main Navigation & Omni Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Title (Click to return to main page) */}
        <button
          type="button"
          onClick={handleBrandClick}
          className="flex items-center gap-3 shrink-0 text-left group hover:opacity-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl cursor-pointer"
          title="InvestDeskPro - Return to Main Page"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 p-0.5 shadow-lg shadow-cyan-950 group-hover:scale-105 transition-transform">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                InvestDeskPro
              </h1>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 rounded-full tracking-wide">
                by rupeemap.in
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Indian Equities & AMFI Mutual Funds Research Terminal
            </p>
          </div>
        </button>

        {/* Global Omni Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-auto md:mx-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search Stocks or Mutual Funds (e.g. Tata Motors, Piccadily, 122639)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-16 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-sm">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950/98 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 max-h-72 overflow-y-auto divide-y divide-slate-800/60 backdrop-blur-xl">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 flex items-center justify-between">
                <span>Quick Results ({searchResults.length})</span>
                <span className="font-mono text-[9px] text-slate-600">Use ↑ ↓ ↵</span>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                    selectedIndex === idx
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                      : "hover:bg-slate-900 text-slate-200"
                  }`}
                >
                  <div className="truncate pr-3">
                    <span className="font-semibold text-slate-100">{item.name}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {item.symbol_or_code} • {item.sector_or_category}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        item.type === "stock"
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {item.type}
                    </span>
                    {item.price_or_nav && (
                      <span className="block text-[11px] font-mono text-slate-300 mt-0.5">
                        ₹{item.price_or_nav.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Company 360°</span>
          </button>

          <button
            onClick={() => setActiveTab("funds")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "funds"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Mutual Funds & Rolling Alpha</span>
          </button>

          <button
            onClick={() => setActiveTab("quant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "quant"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Quant Desk</span>
          </button>
        </div>
      </div>
    </header>
  );
};
