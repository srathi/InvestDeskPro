"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Activity, PieChart } from "lucide-react";
import { StockScorecardView } from "./StockScorecardView";
import { PortfolioOptimizerView } from "./PortfolioOptimizerView";

interface QuantDeskViewProps {
  initialStockTicker?: string;
  initialFundCode?: string;
}

export const QuantDeskView: React.FC<QuantDeskViewProps> = ({
  initialStockTicker,
}) => {
  const [quantSubTab, setQuantSubTab] = useState<"stocks" | "portfolio">("stocks");

  useEffect(() => {
    if (initialStockTicker) {
      setQuantSubTab("stocks");
    }
  }, [initialStockTicker]);

  return (
    <div className="space-y-6">
      {/* Quant Desk Sub-Navigation */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 px-2">
          <Cpu className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Institutional Quant Desk</h2>
            <p className="text-[11px] text-slate-400">
              Factor Diagnostic Scorecards & Multi-Asset Risk-Parity Stress-Tester
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
          <button
            onClick={() => setQuantSubTab("stocks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              quantSubTab === "stocks"
                ? "bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>0–100 Stock Diagnostic</span>
          </button>

          <button
            onClick={() => setQuantSubTab("portfolio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              quantSubTab === "portfolio"
                ? "bg-purple-950 text-purple-300 border border-purple-700 shadow-md shadow-purple-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Portfolio Stress-Tester & Risk Parity</span>
          </button>
        </div>
      </div>

      {/* Active Quant View */}
      {quantSubTab === "stocks" && <StockScorecardView initialTicker={initialStockTicker} />}
      {quantSubTab === "portfolio" && <PortfolioOptimizerView />}
    </div>
  );
};
