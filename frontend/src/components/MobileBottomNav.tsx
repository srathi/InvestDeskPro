"use client";

import React from "react";
import { Building2, TrendingUp, Cpu } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: "company" | "funds" | "quant";
  setActiveTab: (tab: "company" | "funds" | "quant") => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-3 h-16 items-center max-w-md mx-auto px-2">
        {/* Tab 1: Stock Intelligence */}
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-xl transition-all cursor-pointer relative ${
            activeTab === "company"
              ? "text-cyan-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "company" && (
            <span className="absolute top-1.5 w-8 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          )}
          <Building2 className={`w-5 h-5 transition-transform ${activeTab === "company" ? "scale-110" : ""}`} />
          <span className="text-[10px] font-mono tracking-tight leading-none">Stocks</span>
        </button>

        {/* Tab 2: Fund Alpha Engine */}
        <button
          type="button"
          onClick={() => setActiveTab("funds")}
          className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-xl transition-all cursor-pointer relative ${
            activeTab === "funds"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "funds" && (
            <span className="absolute top-1.5 w-8 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          )}
          <TrendingUp className={`w-5 h-5 transition-transform ${activeTab === "funds" ? "scale-110" : ""}`} />
          <span className="text-[10px] font-mono tracking-tight leading-none">Funds</span>
        </button>

        {/* Tab 3: Quant Lab */}
        <button
          type="button"
          onClick={() => setActiveTab("quant")}
          className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-xl transition-all cursor-pointer relative ${
            activeTab === "quant"
              ? "text-indigo-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "quant" && (
            <span className="absolute top-1.5 w-8 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          )}
          <Cpu className={`w-5 h-5 transition-transform ${activeTab === "quant" ? "scale-110" : ""}`} />
          <span className="text-[10px] font-mono tracking-tight leading-none">Quant Lab</span>
        </button>
      </div>
    </div>
  );
};
