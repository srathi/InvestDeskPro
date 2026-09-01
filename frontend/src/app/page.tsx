"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { StockScorecardView } from "../components/StockScorecardView";
import { FundAnalyzerView } from "../components/FundAnalyzerView";
import { PortfolioOptimizerView } from "../components/PortfolioOptimizerView";
import { checkApiHealth } from "../lib/api";
import { Activity, ShieldAlert, Cpu } from "lucide-react";

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
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-500" />
            <span className="font-semibold text-slate-300">InvestDeskPro Engine v1.0.0</span>
            <span>•</span>
            <span>FastAPI + Next.js 15 Quant Core</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Data Sources: AMFI India & NSE/BSE</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldAlert className="h-3 w-3 text-amber-400" />
              <span>For institutional analytical purposes only</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
