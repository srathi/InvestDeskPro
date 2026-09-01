"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { StockScorecardView } from "../components/StockScorecardView";
import { FundAnalyzerView } from "../components/FundAnalyzerView";
import { PortfolioOptimizerView } from "../components/PortfolioOptimizerView";
import { checkApiHealth } from "../lib/api";
import { Activity, ShieldAlert, Cpu, ExternalLink, Heart } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"stocks" | "funds" | "portfolio">("stocks");
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    const ping = async () => {
      const ok = await checkApiHealth();
      setApiOnline(ok);
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Institutional Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} apiOnline={apiOnline} />

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "stocks" && <StockScorecardView />}
        {activeTab === "funds" && <FundAnalyzerView />}
        {activeTab === "portfolio" && <PortfolioOptimizerView />}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left Brand info */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-slate-200">InvestDeskPro</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-300 rounded font-mono">v1.0.0</span>
              </div>
              <span className="text-slate-600">•</span>
              <a
                href="https://rupeemap.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-semibold hover:bg-emerald-900 transition-colors"
              >
                <span>rupeemap.in</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                Created & Engineered by <strong className="text-white font-bold">Sandesh Rathi</strong>
              </span>
            </div>

            {/* Right Disclaimer */}
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>AMFI & NSE/BSE Quantitative Analytics • Institutional Research Only</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
