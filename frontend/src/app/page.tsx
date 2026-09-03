"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Company360View } from "../components/Company360View";
import { StockScreenerView } from "../components/StockScreenerView";
import { CuratedBundlesView } from "../components/CuratedBundlesView";
import { QuantDeskView } from "../components/QuantDeskView";
import { FundAnalyzerView } from "../components/FundAnalyzerView";
import { PageGuideDrawer } from "../components/PageGuideDrawer";
import { AlphaChanakyaDrawer } from "../components/AlphaChanakyaDrawer";
import { FloatingChatButton } from "../components/FloatingChatButton";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { checkApiHealth } from "../lib/api";
import { ExternalLink, ShieldAlert, Sparkles, Cpu, Layers, BookOpen, TrendingUp } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"company" | "funds" | "quant">("company");
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>("");
  const [selectedFundCode, setSelectedFundCode] = useState<string | undefined>(undefined);
  const [apiOnline, setApiOnline] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [guideInitialTerm, setGuideInitialTerm] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const codeParam = params.get("code");
      const tickerParam = params.get("ticker");
      if (tabParam === "funds" || tabParam === "quant" || tabParam === "company") {
        setActiveTab(tabParam);
      }
      if (codeParam) {
        setSelectedFundCode(codeParam);
        if (!tabParam) setActiveTab("funds");
      }
      if (tickerParam) {
        setSelectedStockTicker(tickerParam);
      }
    }
  }, []);

  // Global Cmd+J / Ctrl+J hotkey to toggle AlphaChanakya AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      setActiveTab("funds");
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

  const handleOpenCopilot = () => {
    setIsCopilotOpen(true);
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
        onOpenCopilot={() => handleOpenCopilot()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {activeTab === "company" && (
          <Company360View
            initialTicker={selectedStockTicker}
            onNavigateToQuant={handleNavigateToQuant}
            onSelectEntity={handleSelectEntity}
          />
        )}

        {activeTab === "funds" && (
          <FundAnalyzerView
            initialSchemeCode={selectedFundCode}
          />
        )}

        {activeTab === "quant" && (
          <QuantDeskView
            initialStockTicker={selectedStockTicker}
            initialFundCode={selectedFundCode}
            onSelectStockTicker={(sym) => {
              setSelectedStockTicker(sym);
              setActiveTab("company");
            }}
          />
        )}
      </main>

      {/* 📱 Mobile Fixed Bottom Navigation Bar (md:hidden) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 🏛️ AlphaChanakya AI Copilot Slide-Over Drawer */}
      <AlphaChanakyaDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activeTab={activeTab}
        selectedTicker={selectedStockTicker}
        selectedFundCode={selectedFundCode}
        onSelectEntity={handleSelectEntity}
      />

      {/* ⚡ Floating Action Badge (FAB) - AlphaChanakya AI */}
      <FloatingChatButton
        isOpen={isCopilotOpen}
        onClick={() => handleOpenCopilot()}
      />

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
