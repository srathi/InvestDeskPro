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
} from "lucide-react";
import { fetchOmniSearch, OmniSearchResult } from "../lib/api";

interface HeaderProps {
  activeTab: "company" | "screener" | "bundles" | "quant";
  setActiveTab: (tab: "company" | "screener" | "bundles" | "quant") => void;
  apiOnline: boolean;
  onSelectEntity?: (id: string, type: "stock" | "fund") => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  apiOnline,
  onSelectEntity,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OmniSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const res = await fetchOmniSearch(searchQuery);
          setSearchResults(res);
          setShowDropdown(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 200);

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
    setShowDropdown(false);
    setSearchQuery("");
    if (onSelectEntity) {
      onSelectEntity(item.symbol_or_code || item.id, item.type);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Market Indices Ribbon */}
      <div className="border-b border-slate-800/60 px-4 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between overflow-x-auto gap-6 whitespace-nowrap bg-slate-900/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">NIFTY 50</span>
            <span className="text-emerald-400 font-bold">+0.68%</span>
            <span className="text-slate-400 font-tabular">24,823.15</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">SENSEX</span>
            <span className="text-emerald-400 font-bold">+0.55%</span>
            <span className="text-slate-400 font-tabular">81,332.72</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">NIFTY BANK</span>
            <span className="text-emerald-400 font-bold">+0.82%</span>
            <span className="text-slate-400 font-tabular">51,290.40</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">INDIA VIX</span>
            <span className="text-cyan-400 font-bold">-3.15%</span>
            <span className="text-slate-400 font-tabular">13.42</span>
          </div>
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
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 p-0.5 shadow-lg shadow-cyan-950">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">InvestDeskPro</h1>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full uppercase tracking-wider">
                FINOLOGY + TIJORI HYBRID
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Indian Equities & AMFI Mutual Funds Research Terminal
            </p>
          </div>
        </div>

        {/* Global Omni Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-auto md:mx-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Stocks or Mutual Funds (e.g. Tata Motors, Piccadily, 122639)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-400 animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto space-y-1 backdrop-blur-xl">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1">Quick Results:</div>
              {searchResults.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between transition-colors text-slate-200"
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

        {/* 4 Main Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "company"
                ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Company 360°</span>
          </button>

          <button
            onClick={() => setActiveTab("screener")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "screener"
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Screener</span>
          </button>

          <button
            onClick={() => setActiveTab("bundles")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "bundles"
                ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-md shadow-amber-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Bundles</span>
          </button>

          <button
            onClick={() => setActiveTab("quant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
