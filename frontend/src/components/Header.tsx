"use client";

import React from "react";
import { Activity, BarChart3, LineChart, PieChart, ShieldCheck, Sparkles } from "lucide-react";

interface HeaderProps {
  activeTab: "stocks" | "funds" | "portfolio";
  setActiveTab: (tab: "stocks" | "funds" | "portfolio") => void;
  apiOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, apiOnline }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      {/* Top Market Ticker Ribbon */}
      <div className="border-b border-slate-800/50 px-4 py-1 text-[11px] font-mono text-slate-400 flex items-center justify-between overflow-x-auto gap-6 whitespace-nowrap bg-slate-900/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">NIFTY 50</span>
            <span className="text-emerald-400">+0.68%</span>
            <span className="text-slate-500 font-tabular">24,823.15</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">SENSEX</span>
            <span className="text-emerald-400">+0.55%</span>
            <span className="text-slate-500 font-tabular">81,332.72</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">NIFTY BANK</span>
            <span className="text-emerald-400">+0.82%</span>
            <span className="text-slate-500 font-tabular">51,290.40</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">INDIA VIX</span>
            <span className="text-cyan-400">-3.15%</span>
            <span className="text-slate-500 font-tabular">13.42</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                apiOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className={apiOnline ? "text-emerald-400" : "text-amber-400"}>
              {apiOnline ? "FastAPI Live" : "Connecting..."}
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">AMFI / NSE-BSE Live Feed</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 p-0.5 shadow-lg shadow-cyan-950">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">InvestDeskPro</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-full">
                INSTITUTIONAL QUANT
              </span>
            </div>
            <p className="text-xs text-slate-400">Indian Equities & Mutual Funds Intelligence Engine</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("stocks")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "stocks"
                ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Stock Scorecard</span>
          </button>

          <button
            onClick={() => setActiveTab("funds")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "funds"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            <span>Mutual Fund Rolling Alpha</span>
          </button>

          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "portfolio"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Risk-Parity Optimizer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
