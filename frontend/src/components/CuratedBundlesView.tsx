"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  ShieldCheck,
  Coins,
  Crown,
  Rocket,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Sparkles,
  ChevronRight,
  Target,
} from "lucide-react";
import { fetchBundles, InvestmentBundleItem } from "../lib/api";
import { JargonTooltip } from "./JargonTooltip";

interface CuratedBundlesViewProps {
  onSelectStock: (ticker: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
  Coins: <Coins className="h-5 w-5 text-amber-400" />,
  Crown: <Crown className="h-5 w-5 text-yellow-400" />,
  Rocket: <Rocket className="h-5 w-5 text-purple-400" />,
  Building2: <Building2 className="h-5 w-5 text-cyan-400" />,
};

const BUNDLE_STRATEGY_MAP: Record<string, string> = {
  debt_free: "debt_free_roce",
  high_roce: "high_growth_compounder",
  bluechip: "high_growth_compounder",
  midcap_growth: "high_growth_compounder",
  value_bargains: "deep_value_moat",
  dividend_yield: "dividend_aristocrats",
};

export const CuratedBundlesView: React.FC<CuratedBundlesViewProps> = ({ onSelectStock }) => {
  const [bundles, setBundles] = useState<InvestmentBundleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles()
      .then((res) => setBundles(res))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            <JargonTooltip termKey="high_growth_compounder" title="Curated Thematic Investment Bundles">
              Curated Investment Bundles
            </JargonTooltip>
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded-full uppercase font-mono">
            Thematic Baskets
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Pre-constructed institutional equity collections filtered across profitability, balance sheet strength, competitive moat, and momentum metrics. Click any constituent to open its full 360° financial dossier.
        </p>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading curated investment baskets...</p>
        </div>
      )}

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle) => {
          const stratKey = BUNDLE_STRATEGY_MAP[bundle.id] || "high_growth_compounder";
          return (
            <div
              key={bundle.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
            >
              <div className="space-y-3">
                {/* Header & Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      {ICON_MAP[bundle.icon] || <Layers className="h-5 w-5 text-amber-400" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        <JargonTooltip termKey={stratKey} title={bundle.name}>
                          {bundle.name}
                        </JargonTooltip>
                      </h3>
                      <span className="text-[11px] text-slate-400 block">{bundle.tagline}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Level Badge */}
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Risk: {bundle.risk_level}
                  </span>
                </div>

                {/* Core Basket Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-center">
                  <div>
                    <JargonTooltip termKey="pe_corridor" title="Average P/E Multiple">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Avg P/E</span>
                    </JargonTooltip>
                    <span className="text-xs font-bold text-cyan-400 mt-0.5 block">{bundle.avg_pe}x</span>
                  </div>
                  <div>
                    <JargonTooltip termKey="roe" title="Average Return on Equity">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Avg ROE</span>
                    </JargonTooltip>
                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{bundle.avg_roe}%</span>
                  </div>
                  <div>
                    <JargonTooltip termKey="momentum_multibaggers" title="1-Year Trailing Basket Return">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">1Y Return</span>
                    </JargonTooltip>
                    <span className="text-xs font-bold text-amber-400 mt-0.5 block">+{bundle.avg_1y_return}%</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed">{bundle.description}</p>
              </div>

              {/* Constituents */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block font-mono">
                  Constituents ({bundle.tickers.length} Stocks):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bundle.tickers.map((t) => (
                    <button
                      key={t}
                      onClick={() => onSelectStock(t)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-700 hover:text-cyan-300 text-slate-300 text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t}</span>
                      <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
