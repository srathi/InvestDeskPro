"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  TrendingUp,
  Activity,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  Sparkles,
  BarChart3,
  Factory,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  fetchSectorHeatmap,
  fetchSectorDetail,
  fetchCapexMatrix,
  SectorHeatmapItem,
  SectorHeatmapResponse,
  SectorDeepDiveResponse,
  CapexMatrixResponse,
  SectorConstituent,
} from "../lib/api";

interface SectorRadarViewProps {
  onSelectStockTicker?: (ticker: string) => void;
}

export const SectorRadarView: React.FC<SectorRadarViewProps> = ({
  onSelectStockTicker,
}) => {
  const [metric, setMetric] = useState<string>("pe");
  const [lookback, setLookback] = useState<string>("5y");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );

  const [heatmapData, setHeatmapData] = useState<SectorHeatmapResponse | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("nifty_auto");
  const [sectorDetail, setSectorDetail] = useState<SectorDeepDiveResponse | null>(null);
  const [capexMatrix, setCapexMatrix] = useState<CapexMatrixResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<"heatmap" | "capex_matrix">("heatmap");

  // Load heatmap data on filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchSectorHeatmap(metric, lookback, phaseFilter)
      .then((data) => {
        if (isMounted) {
          setHeatmapData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading sector heatmap:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [metric, lookback, phaseFilter]);

  // Load Capex matrix once
  useEffect(() => {
    fetchCapexMatrix()
      .then((data) => setCapexMatrix(data))
      .catch((err) => console.error("Error loading capex matrix:", err));
  }, []);

  // Multi-field robust search filter across sector names, categories, tickers, IDs, and constituent stocks
  const filteredSectors = useMemo(() => {
    if (!heatmapData?.sectors) return [];
    if (!searchQuery.trim()) return heatmapData.sectors;

    const q = searchQuery.toLowerCase().trim();
    return heatmapData.sectors.filter((s) => {
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesCategory = s.category.toLowerCase().includes(q);
      const matchesId = s.id.toLowerCase().includes(q) || s.id.replace(/_/g, " ").toLowerCase().includes(q);
      const matchesTicker = s.index_ticker.toLowerCase().includes(q);
      const matchesConstituentTicker = s.constituents_tickers?.some((t) => t.toLowerCase().includes(q));
      const matchesConstituentSummary = s.constituents_summary?.some((cs) => cs.toLowerCase().includes(q));

      return (
        matchesName ||
        matchesCategory ||
        matchesId ||
        matchesTicker ||
        matchesConstituentTicker ||
        matchesConstituentSummary
      );
    });
  }, [heatmapData, searchQuery]);

  // Keep selected sector in sync with filtered results
  useEffect(() => {
    if (filteredSectors.length > 0 && !filteredSectors.some((s) => s.id === selectedSectorId)) {
      setSelectedSectorId(filteredSectors[0].id);
    }
  }, [filteredSectors, selectedSectorId]);

  // Load sector deep dive when selected
  useEffect(() => {
    if (!selectedSectorId) return;
    let isMounted = true;
    setDetailLoading(true);

    fetchSectorDetail(selectedSectorId)
      .then((data) => {
        if (isMounted) {
          setSectorDetail(data);
          setDetailLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading sector detail:", err);
        if (isMounted) setDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSectorId]);

  return (
    <div className="space-y-6">
      {/* 🧭 Top Macro Overview Banner */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0c1322] to-slate-950 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/30 via-indigo-600/20 to-purple-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-950">
              <Compass className="w-6 h-6 animate-[spin_20s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Sector Valuation & Industry Radar
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 text-[10px] font-mono font-bold">
                  16 Major Sectors
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Valuation Percentile Heatmaps, Capex Reinvestment Phase Tracker & Constituent Stock Arbitrage
              </p>
            </div>
          </div>

          {/* Macro Metric Quick Pills */}
          {heatmapData?.macro_summary && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center gap-2">
                <span className="text-slate-400">Nifty 50 P/E:</span>
                <span className="text-white font-bold">{heatmapData.macro_summary.nifty50_pe}x</span>
                <span className="text-[10px] text-cyan-400">({heatmapData.macro_summary.nifty50_pe_percentile}%ile)</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold">{heatmapData.macro_summary.undervalued_count}</span>
                <span>Undervalued</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-bold">{heatmapData.macro_summary.fair_value_count}</span>
                <span>Fair Value</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="font-bold">{heatmapData.macro_summary.overvalued_count}</span>
                <span>Extended</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎛️ Interactive Filter & Switcher Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Sub-View Mode (Heatmap vs Capex Matrix) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab("heatmap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === "heatmap"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Valuation Heatmap</span>
          </button>

          <button
            onClick={() => setActiveSubTab("capex_matrix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === "capex_matrix"
                ? "bg-purple-950 text-purple-300 border border-purple-700 shadow-md shadow-purple-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Capex Cycle Matrix</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 font-bold">METRIC:</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="pe" className="bg-slate-950 text-slate-100">Trailing P/E Multiple</option>
              <option value="pb" className="bg-slate-950 text-slate-100">Price to Book (P/B)</option>
              <option value="ev_ebitda" className="bg-slate-950 text-slate-100">EV / EBITDA</option>
              <option value="div_yield" className="bg-slate-950 text-slate-100">Dividend Yield %</option>
            </select>
          </div>

          {/* Lookback Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 font-bold">LOOKBACK:</span>
            <select
              value={lookback}
              onChange={(e) => setLookback(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="3y" className="bg-slate-950 text-slate-100">3-Year Baseline</option>
              <option value="5y" className="bg-slate-950 text-slate-100">5-Year Baseline (Standard)</option>
              <option value="10y" className="bg-slate-950 text-slate-100">10-Year Long Cycle</option>
            </select>
          </div>

          {/* Capex Phase Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 font-bold">CAPEX PHASE:</span>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-100">All Phases (16)</option>
              <option value="phase_1" className="bg-slate-950 text-slate-100">Phase 1: Initiation</option>
              <option value="phase_2" className="bg-slate-950 text-slate-100">Phase 2: Execution</option>
              <option value="phase_3" className="bg-slate-950 text-slate-100">Phase 3: Operating Harvest</option>
            </select>
          </div>

          {/* Smart Multi-Field Instant Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sector, stock (e.g. Auto, TCS, Tata)..."
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl pl-8 pr-7 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono w-52 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Filter Status Pill */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Showing <strong>{filteredSectors.length}</strong> of <strong>{heatmapData?.sectors.length || 16}</strong> sectors matching &quot;{searchQuery}&quot;
            </span>
          </div>
          <button
            onClick={() => setSearchQuery("")}
            className="text-[11px] text-cyan-400 hover:text-white underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* 📊 VIEW 1: Valuation Heatmap Grid */}
      {activeSubTab === "heatmap" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Synthesizing sector valuation percentiles and historical cones...</span>
            </div>
          ) : filteredSectors.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                No sectors or constituent stocks found matching &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-slate-500">
                Try searching for sector names like <code className="text-cyan-400">Auto</code>, <code className="text-cyan-400">IT</code>, <code className="text-cyan-400">Bank</code>, or stocks like <code className="text-cyan-400">TCS</code>, <code className="text-cyan-400">Tata Motors</code>, <code className="text-cyan-400">Reliance</code>.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono font-semibold transition-all cursor-pointer inline-block"
              >
                Reset Search Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {filteredSectors.map((sector) => {
                const isSelected = selectedSectorId === sector.id;
                const isUndervalued = sector.zone_code === "UNDERVALUED";
                const isOvervalued = sector.zone_code === "OVERVALUED";

                return (
                  <button
                    key={sector.id}
                    onClick={() => setSelectedSectorId(sector.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-950/40"
                        : "bg-slate-950/90 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    {/* Header Row */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                            {sector.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {sector.category}
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isUndervalued
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : isOvervalued
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {sector.zone_badge}
                        </span>
                      </div>

                      {/* Primary Multiple Display */}
                      <div className="my-2.5 flex items-baseline justify-between">
                        <div>
                          <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                            {sector.current_multiple}
                            <span className="text-xs text-slate-400 font-normal">
                              {metric === "pe" ? "x" : metric === "pb" ? "x" : metric === "ev_ebitda" ? "x" : "%"}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            5Y Med: {sector.historical_median}x
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-mono font-bold flex items-center justify-end gap-0.5 ${
                              sector.divergence_pct < 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {sector.divergence_pct < 0 ? (
                              <ArrowDownRight className="w-3.5 h-3.5 inline" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 inline" />
                            )}
                            {Math.abs(sector.divergence_pct)}%
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">vs 5Y Median</span>
                        </div>
                      </div>

                      {/* Percentile Bar */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Percentile Cone:</span>
                          <span className="font-bold text-slate-200">{sector.percentile}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              isUndervalued
                                ? "bg-emerald-400"
                                : isOvervalued
                                ? "bg-rose-400"
                                : "bg-cyan-400"
                            }`}
                            style={{ width: `${sector.percentile}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Micro Metrics Strip */}
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">
                        {sector.capex_phase.split(":")[0]}
                      </span>
                      <span className={sector.rs_1y >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        1Y RS: {sector.rs_1y >= 0 ? "+" : ""}{sector.rs_1y}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🏭 VIEW 2: Capex Cycle 3-Phase Matrix */}
      {activeSubTab === "capex_matrix" && capexMatrix && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Phase 1 */}
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 to-slate-950 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">{capexMatrix.phase_1_initiation.title}</h3>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  {capexMatrix.phase_1_initiation.count} Sectors
                </span>
              </div>
              <div className="text-xs text-cyan-200/90 font-medium mb-2 font-sans">
                {capexMatrix.phase_1_initiation.theme}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {capexMatrix.phase_1_initiation.key_drivers}
              </p>

              <div className="space-y-2">
                {capexMatrix.phase_1_initiation.sectors.map((s) => {
                  const matchesSearch = !searchQuery.trim() || 
                    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                    s.id.toLowerCase().includes(searchQuery.toLowerCase().trim());

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSectorId(s.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        matchesSearch
                          ? "bg-slate-900/90 border-slate-800 hover:border-cyan-500/50"
                          : "bg-slate-950/40 border-slate-900 opacity-40 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-normal">
                          Gross Block: +{s.gross_block_growth_yoy}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">
                        {s.commentary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-slate-950 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">{capexMatrix.phase_2_execution.title}</h3>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {capexMatrix.phase_2_execution.count} Sectors
                </span>
              </div>
              <div className="text-xs text-amber-200/90 font-medium mb-2 font-sans">
                {capexMatrix.phase_2_execution.theme}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {capexMatrix.phase_2_execution.key_drivers}
              </p>

              <div className="space-y-2">
                {capexMatrix.phase_2_execution.sectors.map((s) => {
                  const matchesSearch = !searchQuery.trim() || 
                    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                    s.id.toLowerCase().includes(searchQuery.toLowerCase().trim());

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSectorId(s.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        matchesSearch
                          ? "bg-slate-900/90 border-slate-800 hover:border-amber-500/50"
                          : "bg-slate-950/40 border-slate-900 opacity-40 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono font-normal">
                          Capex/OCF: {s.capex_to_ocf_pct}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">
                        {s.commentary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-slate-950 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">{capexMatrix.phase_3_harvest.title}</h3>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {capexMatrix.phase_3_harvest.count} Sectors
                </span>
              </div>
              <div className="text-xs text-emerald-200/90 font-medium mb-2 font-sans">
                {capexMatrix.phase_3_harvest.theme}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {capexMatrix.phase_3_harvest.key_drivers}
              </p>

              <div className="space-y-2">
                {capexMatrix.phase_3_harvest.sectors.map((s) => {
                  const matchesSearch = !searchQuery.trim() || 
                    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                    s.id.toLowerCase().includes(searchQuery.toLowerCase().trim());

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSectorId(s.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        matchesSearch
                          ? "bg-slate-900/90 border-slate-800 hover:border-emerald-500/50"
                          : "bg-slate-950/40 border-slate-900 opacity-40 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-normal">
                          RoCE: {s.roce_pct}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">
                        {s.commentary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔬 SELECTED SECTOR DEEP DIVE DRILLDOWN & CONSTITUENTS */}
      {sectorDetail && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a1120] to-slate-950 space-y-4 shadow-2xl">
          {/* Deep Dive Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {sectorDetail.name} Deep Dive & Constituent Arbitrage
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  {sectorDetail.constituents.length} Key Stocks
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                  {sectorDetail.capex_phase}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                💡 <span className="font-semibold text-slate-300">Capex Strategy:</span> {sectorDetail.capex_commentary}
              </p>
            </div>

            {/* Relative Strength Badges */}
            <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
              <span className="text-slate-500 font-bold">RS vs Nifty:</span>
              <span className={sectorDetail.relative_strength.rs_1m >= 0 ? "text-emerald-400" : "text-rose-400"}>
                1M: {sectorDetail.relative_strength.rs_1m >= 0 ? "+" : ""}{sectorDetail.relative_strength.rs_1m}%
              </span>
              <span className="text-slate-700">|</span>
              <span className={sectorDetail.relative_strength.rs_3m >= 0 ? "text-emerald-400" : "text-rose-400"}>
                3M: {sectorDetail.relative_strength.rs_3m >= 0 ? "+" : ""}{sectorDetail.relative_strength.rs_3m}%
              </span>
              <span className="text-slate-700">|</span>
              <span className={sectorDetail.relative_strength.rs_1y >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                1Y: {sectorDetail.relative_strength.rs_1y >= 0 ? "+" : ""}{sectorDetail.relative_strength.rs_1y}%
              </span>
            </div>
          </div>

          {/* Constituent Stocks Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-cyan-300 font-mono text-[11px] border-b border-slate-800">
                  <th className="px-3.5 py-2.5 font-bold">Stock & Name</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">CMP (₹)</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">Stock P/E</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">vs Sector Med</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">3Y Sales CAGR</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">3Y PAT CAGR</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">RoCE %</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">Capex/OCF</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">D/E Ratio</th>
                  <th className="px-3.5 py-2.5 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-200 font-sans">
                {sectorDetail.constituents.map((c) => {
                  const isDiscount = c.divergence_vs_sector_pct < 0;

                  return (
                    <tr key={c.ticker} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-3.5 py-2.5 font-semibold">
                        <div className="text-white font-mono font-bold flex items-center gap-1.5">
                          <span>{c.ticker}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              isDiscount
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {c.valuation_status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">{c.name}</div>
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-white">
                        ₹{c.cmp.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-cyan-300">
                        {c.pe.toFixed(1)}x
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isDiscount ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {c.divergence_vs_sector_pct > 0 ? "+" : ""}
                          {c.divergence_vs_sector_pct.toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-300">
                        {c.sales_cagr_3y > 0 ? `+${c.sales_cagr_3y}%` : `${c.sales_cagr_3y}%`}
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-300">
                        {c.profit_cagr_3y > 0 ? `+${c.profit_cagr_3y}%` : `${c.profit_cagr_3y}%`}
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-300">
                        {c.roce_pct.toFixed(1)}%
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono text-purple-300">
                        {c.capex_to_ocf_pct.toFixed(0)}%
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-400">
                        {c.debt_to_equity.toFixed(2)}x
                      </td>

                      <td className="px-3.5 py-2.5 text-center">
                        <button
                          onClick={() => {
                            if (onSelectStockTicker) onSelectStockTicker(c.ticker);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/60 hover:border-cyan-400 text-[11px] font-mono font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                          title={`Audit ${c.ticker} in Stock Intelligence`}
                        >
                          <span>Audit</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
