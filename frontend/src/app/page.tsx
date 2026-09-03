"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Company360View } from "../components/Company360View";
import { StockScreenerView } from "../components/StockScreenerView";
import { CuratedBundlesView } from "../components/CuratedBundlesView";
import { QuantDeskView } from "../components/QuantDeskView";
import { PageGuideDrawer } from "../components/PageGuideDrawer";
import { checkApiHealth } from "../lib/api";
import { ExternalLink, ShieldAlert, Sparkles, Cpu, Layers, BookOpen } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"company" | "quant">("company");
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>("");
  const [selectedFundCode, setSelectedFundCode] = useState<string | undefined>(undefined);
  const [apiOnline, setApiOnline] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideInitialTerm, setGuideInitialTerm] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const isOnline = await checkApiHealth();
      setApiOnline(isOnline);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEntity = (id: string, type: "stock" | "fund") => {
    if (type === "stock") {
      setSelectedStockTicker(id);
      setActiveTab("company");
    } else {
      setSelectedFundCode(id);
      setActiveTab("quant");
    }
  };

  const handleNavigateToQuant = (ticker: string) => {
    setSelectedStockTicker(ticker);
    setActiveTab("quant");
  };

  const handleResetHome = () => {
    setSelectedStockTicker("");
    setSelectedFundCode(undefined);
    setActiveTab("company");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOpenGuide = (term?: string) => {
    setGuideInitialTerm(term || null);
    setIsGuideOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Top Navbar with Omni Search & Market Ribbon */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiOnline={apiOnline}
        onSelectEntity={handleSelectEntity}
        onResetHome={handleResetHome}
        onOpenGuide={() => handleOpenGuide()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "company" && (
          <Company360View
            initialTicker={selectedStockTicker}
            onNavigateToQuant={handleNavigateToQuant}
            onSelectEntity={handleSelectEntity}
          />
        )}

        {activeTab === "quant" && (
          <QuantDeskView
            initialStockTicker={selectedStockTicker}
            initialFundCode={selectedFundCode}
          />
        )}
      </main>

      {/* Contextual Page Guide & Financial Jargon Playbook Drawer */}
      <PageGuideDrawer
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          setGuideInitialTerm(null);
        }}
        activeView={activeTab}
        initialTerm={guideInitialTerm}
      />

      {/* 🌟 Floating Action Badge (FAB) - Page Guide & Strategy Playbook */}
      <button
        type="button"
        onClick={() => handleOpenGuide()}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
        title="Open Page Guide, Strategy Blueprints & Financial Dictionary (press '?')"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
        <BookOpen className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xs font-bold text-white tracking-wide font-sans">
          Page Guide
        </span>
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-md shadow-inner">
          ?
        </span>
      </button>

      {/* Rupeemap Ecosystem Institutional Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left Badging: Rupeemap Ecosystem Links */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                Rupeemap Suite:
              </span>
              <a
                href="https://rupeemap.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-semibold hover:bg-emerald-900 transition-colors"
                title="Rupeemap Main Investment Platform"
              >
                <span>rupeemap.in (Main)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://swingtradedeskpro.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700 text-indigo-300 font-semibold hover:bg-indigo-900 transition-colors"
                title="SwingTradeDeskPro - Technical & Swing Engine"
              >
                <span>⚡ SwingTradeDeskPro</span>
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
              <span>Quantitative Financial Intelligence & Diagnostics • Institutional Research Only</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
