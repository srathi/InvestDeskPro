import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Building2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Sliders,
  DollarSign,
  PieChart as PieChartIcon,
  Globe,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Sparkles,
  Table,
  Target,
  Calculator,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  fetchCompany360,
  fetchStockHistory,
  searchStocks,
  fetchOmniSearch,
  OmniSearchResult,
  Company360Response,
  StockHistoryResponse,
  HistoricalValuationSummary,
  StockPricePoint,
  StockSearchResult,
  ForwardGrowthEstimates,
  ForwardScenario,
  ForwardYearProjection,
} from "../lib/api";
import { useDebounce } from "../hooks/useDebounce";

interface QuickSearchChip {
  id: string;
  name: string;
  type: "stock" | "fund";
  badge: string;
}

const QUICK_SEARCH_CHIPS: QuickSearchChip[] = [
  { id: "RELIANCE", name: "Reliance Industries", type: "stock", badge: "RELIANCE" },
  { id: "TCS", name: "Tata Consultancy Services", type: "stock", badge: "TCS" },
  { id: "HDFCBANK", name: "HDFC Bank Ltd", type: "stock", badge: "HDFCBANK" },
  { id: "122639", name: "Parag Parikh Flexi Cap Fund", type: "fund", badge: "PARAG PARIKH FLEXI CAP" },
  { id: "INFY", name: "Infosys Ltd", type: "stock", badge: "INFY" },
  { id: "TATAMOTORS", name: "Tata Motors Ltd", type: "stock", badge: "TATAMOTORS" },
];

const PRESET_COMPANIES = [
  { ticker: "RELIANCE", name: "Reliance Ind.", sector: "Oil & Gas / Retail", tag: "Large Cap 🏢" },
  { ticker: "TCS", name: "TCS", sector: "IT Services", tag: "High ROCE 💎" },
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Banking", tag: "Core Bank 🏦" },
  { ticker: "TATAMOTORS", name: "Tata Motors", sector: "Automotive", tag: "EV Leader 🚗" },
  { ticker: "INFY", name: "Infosys", sector: "IT & Cloud", tag: "Tech Bluechip 💻" },
  { ticker: "PICCADIL", name: "Piccadily Agro", sector: "Distilleries", tag: "Compounder 🚀" },
  { ticker: "CONFIPET", name: "Confidence Pet.", sector: "LPG Infrastructure", tag: "Small Cap ⚡" },
  { ticker: "ITC", name: "ITC Ltd.", sector: "FMCG / Cigarettes", tag: "High Dividend 💰" },
  { ticker: "LT", name: "Larsen & Toubro", sector: "Capital Goods", tag: "Infra Giant 🏗️" },
  { ticker: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC / Lending", tag: "Retail Credit 💳" },
  { ticker: "SUNPHARMA", name: "Sun Pharma", sector: "Healthcare", tag: "Pharma Leader 💊" },
  { ticker: "TRENT", name: "Trent", sector: "Retail / Apparel", tag: "Retail Alpha ⭐" },
];

interface Company360ViewProps {
  initialTicker?: string;
  onNavigateToQuant?: (ticker: string) => void;
  onSelectEntity?: (id: string, type: "stock" | "fund") => void;
}

export const Company360View: React.FC<Company360ViewProps> = ({
  initialTicker = "",
  onNavigateToQuant,
  onSelectEntity,
}) => {
  const [tickerInput, setTickerInput] = useState(initialTicker || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Company360Response | null>(null);
  const [copied, setCopied] = useState(false);

  // Dedicated Hero Instant Search State
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [heroSearchResults, setHeroSearchResults] = useState<OmniSearchResult[]>([]);
  const [heroIsSearching, setHeroIsSearching] = useState(false);
  const [heroShowDropdown, setHeroShowDropdown] = useState(false);
  const [heroSelectedIndex, setHeroSelectedIndex] = useState(-1);
  const heroSearchRef = useRef<HTMLDivElement>(null);

  // Debounced search for hero search bar
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (heroSearchQuery.trim().length >= 1) {
        setHeroIsSearching(true);
        try {
          const res = await fetchOmniSearch(heroSearchQuery);
          setHeroSearchResults(res);
          setHeroShowDropdown(true);
          setHeroSelectedIndex(-1);
        } catch {
          setHeroSearchResults([]);
        } finally {
          setHeroIsSearching(false);
        }
      } else {
        setHeroSearchResults([]);
        setHeroShowDropdown(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [heroSearchQuery]);

  // Click outside to close hero search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(event.target as Node)) {
        setHeroShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleHeroSelect = (item: { id: string; type: "stock" | "fund" }) => {
    setHeroShowDropdown(false);
    setHeroSearchQuery("");
    if (item.type === "stock") {
      setTickerInput(item.id);
      loadCompanyData(item.id);
    } else {
      if (onSelectEntity) {
        onSelectEntity(item.id, "fund");
      }
    }
  };

  const handleHeroKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (heroSearchResults.length > 0) {
        setHeroSelectedIndex((prev) => (prev < heroSearchResults.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (heroSearchResults.length > 0) {
        setHeroSelectedIndex((prev) => (prev > 0 ? prev - 1 : heroSearchResults.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (heroSelectedIndex >= 0 && heroSelectedIndex < heroSearchResults.length) {
        const item = heroSearchResults[heroSelectedIndex];
        handleHeroSelect({ id: item.id, type: item.type as "stock" | "fund" });
      } else if (heroSearchResults.length > 0) {
        const item = heroSearchResults[0];
        handleHeroSelect({ id: item.id, type: item.type as "stock" | "fund" });
      } else if (heroSearchQuery.trim()) {
        handleHeroSelect({ id: heroSearchQuery.trim().toUpperCase(), type: "stock" });
      }
    } else if (e.key === "Escape") {
      setHeroShowDropdown(false);
    }
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSelectedIndex >= 0 && heroSelectedIndex < heroSearchResults.length) {
      const selected = heroSearchResults[heroSelectedIndex];
      handleHeroSelect({ id: selected.id, type: selected.type as "stock" | "fund" });
    } else if (heroSearchResults.length > 0) {
      const first = heroSearchResults[0];
      handleHeroSelect({ id: first.id, type: first.type as "stock" | "fund" });
    } else if (heroSearchQuery.trim()) {
      handleHeroSelect({ id: heroSearchQuery.trim().toUpperCase(), type: "stock" });
    }
  };

  // Sub-tabs for financial statements and charts
  const [financialTab, setFinancialTab] = useState<"pl" | "bs" | "cf">("pl");
  const [chartView, setChartView] = useState<"price" | "pe" | "pb">("price");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1m" | "6m" | "1y" | "3y" | "5y" | "max">("1y");
  const [showDma, setShowDma] = useState(true);
  const [historyCache, setHistoryCache] = useState<Record<string, StockHistoryResponse>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  // Forward Growth Projections Interactive State
  const [selectedScenario, setSelectedScenario] = useState<"base" | "bull" | "bear" | "custom">("base");
  const [customRevGrowth, setCustomRevGrowth] = useState<number>(15.0);
  const [customNetMargin, setCustomNetMargin] = useState<number>(12.0);
  const [customExitPe, setCustomExitPe] = useState<number>(22.0);

  // DCF Interactive State
  const [dcfWacc, setDcfWacc] = useState(12.0);
  const [dcfGrowth5y, setDcfGrowth5y] = useState(15.0);
  const [dcfTerminalGrowth, setDcfTerminalGrowth] = useState(4.0);

  // Reverse DCF Interactive State
  const [discountRate, setDiscountRate] = useState(12.0);
  const [terminalGrowth, setTerminalGrowth] = useState(4.0);

  // Diagnostic Alerts Interactive State
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csv = `Company 360 Financial Dossier: ${data.company_name} (${data.ticker})\n`;
    csv += `Market Cap (Cr): ₹${data.essentials.market_cap_cr}, CMP: ₹${data.essentials.current_price}, P/E: ${data.essentials.pe || "N/A"}x\n\n`;

    if (data.quarterly_financials) {
      csv += `--- 8-QUARTER FINANCIAL TRENDS (₹ Cr) ---\n`;
      csv += `Metric,` + data.quarterly_financials.quarters.join(",") + `\n`;
      data.quarterly_financials.rows.forEach((r) => {
        csv += `"${r.metric_name}",` + data.quarterly_financials!.quarters.map((q) => r.values[q] ?? "").join(",") + `\n`;
      });
      csv += `\n`;
    }

    csv += `--- 5-YEAR INCOME STATEMENT (₹ Cr) ---\n`;
    csv += `Metric,` + data.financials.income_statement.years.join(",") + `\n`;
    data.financials.income_statement.rows.forEach((r) => {
      csv += `"${r.metric_name}",` + data.financials.income_statement.years.map((y) => r.values[y] ?? "").join(",") + `\n`;
    });
    csv += `\n`;

    csv += `--- 5-YEAR BALANCE SHEET (₹ Cr) ---\n`;
    csv += `Metric,` + data.financials.balance_sheet.years.join(",") + `\n`;
    data.financials.balance_sheet.rows.forEach((r) => {
      csv += `"${r.metric_name}",` + data.financials.balance_sheet.years.map((y) => r.values[y] ?? "").join(",") + `\n`;
    });
    csv += `\n`;

    csv += `--- 5-YEAR CASH FLOW STATEMENT (₹ Cr) ---\n`;
    csv += `Metric,` + data.financials.cash_flows.years.join(",") + `\n`;
    data.financials.cash_flows.rows.forEach((r) => {
      csv += `"${r.metric_name}",` + data.financials.cash_flows.years.map((y) => r.values[y] ?? "").join(",") + `\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${data.ticker}_Financial_360.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    if (!data) return;
    const summary = `# ${data.company_name} (${data.ticker}) - 360° Financial Dossier
- **Sector / Industry**: ${data.sector} • ${data.industry}
- **Market Cap**: ₹${data.essentials.market_cap_cr.toLocaleString("en-IN")} Cr (${data.market_cap_category})
- **Current Market Price**: ₹${data.essentials.current_price} (${data.essentials.day_change >= 0 ? "+" : ""}${data.essentials.day_change_pct}%)
- **52-Week Range**: ₹${data.essentials.low_52w} - ₹${data.essentials.high_52w}
- **Stock P/E / Industry P/E**: ${data.essentials.pe || "N/A"}x / ${data.essentials.industry_pe || "N/A"}x (PEG: ${data.essentials.peg_ratio || "1.25"}x)
- **ROCE / ROE**: ${data.essentials.roce || "N/A"}% / ${data.essentials.roe || "N/A"}%
- **Debt to Equity**: ${data.essentials.debt_to_equity ?? "0.00"}x
- **2-Stage DCF Fair Value**: ₹${data.dcf_sensitivity_matrix?.base_fair_value || "N/A"} (Margin of Safety: ${data.dcf_sensitivity_matrix?.margin_of_safety_pct || "N/A"}%)
- **Valuation Status**: ${data.dcf_sensitivity_matrix?.valuation_status || data.reverse_dcf.interpretation}
- **Institutional Sentiment**: ${data.institutional_delta?.net_institutional_sentiment || "Stable"}
- **Promoter Holding**: ${data.essentials.promoter_holding_pct || 54.2}% (0% Pledged)
`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const calculateDynamic2StageFairValue = (eps: number, growth5y: number, wacc: number, termGrowth: number) => {
    if (eps <= 0 || wacc <= termGrowth) return 0;
    const r = wacc / 100.0;
    const g = growth5y / 100.0;
    const tg = termGrowth / 100.0;

    let pv = 0.0;
    let curE = eps;
    for (let t = 1; t <= 5; t++) {
      curE *= 1.0 + g;
      pv += curE / Math.pow(1.0 + r, t);
    }
    for (let t = 6; t <= 10; t++) {
      curE *= 1.0 + (g * 0.6 + tg * 0.4);
      pv += curE / Math.pow(1.0 + r, t);
    }
    const tv = (curE * (1.0 + tg)) / Math.max(0.005, r - tg);
    const pvTv = tv / Math.pow(1.0 + r, 10);
    return Math.max(1, Math.round((pv + pvTv) * 100) / 100);
  };

  const loadCompanyData = async (symbol: string) => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setHeroShowDropdown(false);
    try {
      const res = await fetchCompany360(symbol);
      setData(res);
    } catch (err: any) {
      setError(err.message || `Failed to fetch 360 overview for ${symbol}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicker && initialTicker.trim()) {
      setTickerInput(initialTicker);
      loadCompanyData(initialTicker);
    } else {
      setData(null);
    }
  }, [initialTicker]);

  // 52-Week Progress Pin Calculation
  const calculate52WPosition = (cmp: number, low: number, high: number) => {
    if (high <= low) return 50;
    const pct = ((cmp - low) / (high - low)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // Reverse DCF Implied 5Y Growth Calculation
  const calculateDynamicImpliedGrowth = (price: number, eps: number, r: number, g: number) => {
    if (eps <= 0 || price <= 0) return 15.0;
    let low = -0.10;
    let high = 0.60;
    let implied = 0.15;
    const r_dec = r / 100.0;
    const g_dec = g / 100.0;

    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2.0;
      let pv = 0.0;
      let cur = eps;
      for (let t = 1; t <= 5; t++) {
        cur *= (1.0 + mid);
        pv += cur / Math.pow(1.0 + r_dec, t);
      }
      for (let t = 6; t <= 10; t++) {
        cur *= (1.0 + (mid * 0.6 + g_dec * 0.4));
        pv += cur / Math.pow(1.0 + r_dec, t);
      }
      const tv = (cur * (1.0 + g_dec)) / Math.max(0.01, (r_dec - g_dec));
      const pv_tv = tv / Math.pow(1.0 + r_dec, 10);
      const total = pv + pv_tv;

      if (Math.abs(total - price) < 0.5) {
        implied = mid;
        break;
      }
      if (total < price) {
        low = mid;
      } else {
        high = mid;
      }
      implied = mid;
    }
    return Math.round(implied * 1000) / 10.0;
  };

  // Handle multi-timeframe switching (1M, 6M, 1Y, 3Y, 5Y, MAX)
  const handleTimeframeChange = async (tf: "1m" | "6m" | "1y" | "3y" | "5y" | "max") => {
    setSelectedTimeframe(tf);
    if (!data) return;
    const cacheKey = `${data.ticker}-${tf}`;
    if (historyCache[cacheKey]) return;

    setHistoryLoading(true);
    try {
      const res = await fetchStockHistory(data.ticker, tf);
      setHistoryCache((prev) => ({ ...prev, [cacheKey]: res }));
    } catch {
      // Keep existing data on error
    } finally {
      setHistoryLoading(false);
    }
  };

  // Prime 1Y history in cache when data loads
  useEffect(() => {
    if (data?.ticker && data?.price_history && data?.price_history.length > 0) {
      const defaultValSum: HistoricalValuationSummary = data.historical_valuation_summary || {
        timeframe: "1y",
        current_pe: data.essentials?.pe,
        median_pe: data.essentials?.pe || 24.5,
        valuation_verdict: "Fair Value (Near Historical Median)",
      };
      setHistoryCache((prev) => ({
        ...prev,
        [`${data.ticker}-1y`]: {
          ticker: data.ticker,
          timeframe: "1y",
          history: data.price_history,
          valuation_summary: defaultValSum,
        },
      }));
    }
  }, [data]);

  // Active multi-timeframe dataset & valuation summary
  const activeHistory = useMemo(() => {
    if (!data) return null;
    const cacheKey = `${data.ticker}-${selectedTimeframe}`;
    if (historyCache[cacheKey]) return historyCache[cacheKey];
    if (selectedTimeframe === "1y" && data.price_history && data.price_history.length > 0) {
      return {
        ticker: data.ticker,
        timeframe: "1y",
        history: data.price_history,
        valuation_summary: data.historical_valuation_summary || {
          timeframe: "1y",
          current_pe: data.essentials?.pe,
          median_pe: data.essentials?.pe || 24.5,
          valuation_verdict: "Fair Value (Near Historical Median)",
        },
      };
    }
    return null;
  }, [data, selectedTimeframe, historyCache]);

  const activePoints = activeHistory?.history || data?.price_history || [];
  const valSummary = activeHistory?.valuation_summary || data?.historical_valuation_summary;

  // Sync custom scenario defaults when company data loads
  useEffect(() => {
    if (data?.forward_estimates) {
      setCustomRevGrowth(data.forward_estimates.base_case.assumed_revenue_growth_pct);
      setCustomNetMargin(data.forward_estimates.base_case.assumed_net_margin_pct);
      setCustomExitPe(data.forward_estimates.base_case.assumed_exit_pe);
    }
  }, [data]);

  // Active Forecast Scenario & Projections
  const activeForecastScenario = useMemo<ForwardScenario | null>(() => {
    if (!data?.forward_estimates) return null;
    if (selectedScenario === "bull") return data.forward_estimates.bull_case;
    if (selectedScenario === "bear") return data.forward_estimates.bear_case;
    if (selectedScenario === "base") return data.forward_estimates.base_case;

    // Custom Scenario Calculation
    const est = data.forward_estimates;
    const baseRev = est.base_revenue_cr;
    const basePat = est.base_pat_cr;
    const baseEps = est.base_eps;
    const cmp = est.base_cmp;
    const gDec = customRevGrowth / 100.0;
    const mDec = customNetMargin / 100.0;

    let baseYrInt = 26;
    try {
      baseYrInt = parseInt(est.base_year_label.slice(2, 4)) || 26;
    } catch {
      baseYrInt = 26;
    }

    const customProjections: ForwardYearProjection[] = [1, 2, 3].map((h) => {
      const yrLabel = `FY${baseYrInt + h} (${h}Y Forward)`;
      const projRev = Math.round(baseRev * Math.pow(1 + gDec, h) * 10) / 10;
      const projPat = Math.round(projRev * mDec * 10) / 10;
      const patMult = projPat / Math.max(1.0, basePat);
      const projEps = Math.round(baseEps * patMult * 100) / 100;
      const targetPrice = Math.round(projEps * customExitPe * 100) / 100;
      const impliedReturn = Math.round(((targetPrice - cmp) / cmp) * 10000) / 100;
      const impliedCagr =
        targetPrice > 0 && cmp > 0
          ? Math.round((Math.pow(targetPrice / cmp, 1.0 / h) - 1.0) * 10000) / 100
          : Math.round((impliedReturn / h) * 100) / 100;

      return {
        horizon_years: h,
        year_label: yrLabel,
        revenue_cr: projRev,
        pat_cr: projPat,
        eps: projEps,
        net_margin_pct: customNetMargin,
        target_price: targetPrice,
        implied_return_pct: impliedReturn,
        implied_cagr_pct: impliedCagr,
      };
    });

    return {
      scenario_name: "Custom User Scenario",
      scenario_description: `User-defined assumptions: ${customRevGrowth}% Annual Top-Line Growth, ${customNetMargin}% Net Margin, and ${customExitPe}x Exit Valuation Multiple.`,
      assumed_revenue_growth_pct: customRevGrowth,
      assumed_net_margin_pct: customNetMargin,
      assumed_exit_pe: customExitPe,
      projections: customProjections,
    };
  }, [data, selectedScenario, customRevGrowth, customNetMargin, customExitPe]);

  // Combined 5Y Historical + 3Y Forward Trajectory Chart Data
  const forecastChartData = useMemo(() => {
    if (!data?.financials?.income_statement || !activeForecastScenario) return [];
    const years = data.financials.income_statement.years || [];
    const revRow = data.financials.income_statement.rows.find(
      (r) =>
        r.metric_name.toLowerCase().includes("revenue") ||
        r.metric_name.toLowerCase().includes("sales")
    );
    const patRow = data.financials.income_statement.rows.find(
      (r) =>
        r.metric_name.toLowerCase().includes("net profit") ||
        r.metric_name.toLowerCase().includes("pat")
    );

    const histPoints = years.map((y) => ({
      year: y,
      revenue_hist: revRow?.values[y] ?? null,
      pat_hist: patRow?.values[y] ?? null,
      revenue_proj: null as number | null,
      pat_proj: null as number | null,
      is_projection: false,
    }));

    // Bridge historical last point to projection start
    if (histPoints.length > 0) {
      const lastPoint = histPoints[histPoints.length - 1];
      lastPoint.revenue_proj = lastPoint.revenue_hist;
      lastPoint.pat_proj = lastPoint.pat_hist;
    }

    const projPoints = activeForecastScenario.projections.map((p) => ({
      year: p.year_label.split(" ")[0],
      revenue_hist: null as number | null,
      pat_hist: null as number | null,
      revenue_proj: p.revenue_cr,
      pat_proj: p.pat_cr,
      is_projection: true,
      eps: p.eps,
      target_price: p.target_price,
    }));

    return [...histPoints, ...projPoints];
  }, [data, activeForecastScenario]);

  // Quantitative Diagnostic Scorecard Alerts & Warning Signals
  const diagnosticAlerts = useMemo(() => {
    if (!data) return [];
    const alerts: {
      id: string;
      title: string;
      metric: string;
      description: string;
      severity: "critical" | "warning";
      threshold: string;
    }[] = [];

    // 1. Debt-to-Equity Warning (Threshold > 1.5x Critical, > 1.0x Moderate)
    const de = data.essentials.debt_to_equity;
    if (de !== undefined && de !== null) {
      if (de > 1.5) {
        alerts.push({
          id: "de-critical",
          title: "High Balance Sheet Leverage",
          metric: `D/E: ${de}x`,
          description: `Debt-to-Equity of ${de}x breaches the conservative threshold of 1.5x, exposing company earnings to heightened debt-servicing and interest rate risk.`,
          severity: "critical",
          threshold: "Threshold: > 1.5x",
        });
      } else if (de > 1.0) {
        alerts.push({
          id: "de-warning",
          title: "Moderate Leverage",
          metric: `D/E: ${de}x`,
          description: `Debt-to-Equity is ${de}x (above 1.0x), warranting close monitoring of cash flows and interest coverage.`,
          severity: "warning",
          threshold: "Threshold: > 1.0x",
        });
      }
    }

    // 2. Promoter Pledged Shares Warning (Threshold > 0%)
    const pledged =
      data.institutional_delta?.pledged_shares_pct ??
      data.shareholding?.[0]?.pledged_pct ??
      0;
    if (pledged > 0) {
      alerts.push({
        id: "pledged-shares",
        title: "Promoter Pledged Shares Alert",
        metric: `Pledged: ${pledged}%`,
        description: `Promoters have pledged ${pledged}% of their equity stake as loan collateral, creating potential margin call / distress selling risk.`,
        severity: pledged > 15 ? "critical" : "warning",
        threshold: "Threshold: > 0.0%",
      });
    }

    // 3. Operating Cash Flow (OCF) Trajectory & Cash Conversion
    if (data.financials?.cash_flows?.rows) {
      const ocfRow = data.financials.cash_flows.rows.find(
        (r) =>
          r.metric_name.toLowerCase().includes("operating cash") ||
          r.metric_name.toLowerCase().includes("cash from operations") ||
          r.metric_name.toLowerCase().includes("cash from operating")
      );
      const patRow = data.financials.income_statement?.rows.find(
        (r) =>
          r.metric_name.toLowerCase().includes("net profit") ||
          r.metric_name.toLowerCase().includes("pat")
      );

      const years = data.financials.cash_flows.years || [];
      if (ocfRow && years.length >= 2) {
        const latestYr = years[years.length - 1];
        const prevYr = years[years.length - 2];
        const latestOcf = ocfRow.values[latestYr];
        const prevOcf = ocfRow.values[prevYr];

        if (latestOcf !== null && latestOcf !== undefined) {
          if (latestOcf < 0) {
            alerts.push({
              id: "ocf-negative",
              title: "Negative Operating Cash Flow",
              metric: `OCF: -₹${Math.abs(latestOcf).toLocaleString("en-IN")} Cr`,
              description: `Latest audited Cash from Operations is negative, indicating operational cash burn.`,
              severity: "critical",
              threshold: "Threshold: OCF < 0",
            });
          } else if (prevOcf !== null && prevOcf !== undefined && latestOcf < prevOcf * 0.85) {
            const declinePct = Math.round(((prevOcf - latestOcf) / prevOcf) * 100);
            alerts.push({
              id: "ocf-declining",
              title: "Declining Operating Cash Flow",
              metric: `OCF: -${declinePct}% YoY`,
              description: `Operating Cash Flow contracted from ₹${prevOcf.toLocaleString("en-IN")} Cr (${prevYr}) to ₹${latestOcf.toLocaleString("en-IN")} Cr (${latestYr}).`,
              severity: "warning",
              threshold: "YoY Decline > 15%",
            });
          }

          // Check OCF to PAT conversion
          if (patRow && latestOcf > 0) {
            const latestPat = patRow.values[latestYr];
            if (latestPat && latestPat > 0 && latestOcf < latestPat * 0.7) {
              const ratio = (latestOcf / latestPat).toFixed(2);
              alerts.push({
                id: "ocf-pat-divergence",
                title: "Weak Cash Conversion (OCF < PAT)",
                metric: `OCF/PAT: ${ratio}x`,
                description: `Operating Cash Flow (₹${latestOcf} Cr) is significantly below accounting PAT (₹${latestPat} Cr), signaling potential revenue realization delays.`,
                severity: "warning",
                threshold: "OCF / PAT < 0.70x",
              });
            }
          }
        }
      }
    }

    // 4. Valuation Stretch vs Historical 5Y Median Benchmark
    const pe = data.essentials.pe;
    const medianPe = data.historical_valuation_summary?.median_pe ?? data.forward_estimates?.median_pe_benchmark;
    if (pe && medianPe && pe > medianPe * 1.45 && pe > 35) {
      alerts.push({
        id: "pe-stretch",
        title: "Extended Valuation Multiple",
        metric: `P/E: ${pe}x vs 5Y Med: ${medianPe}x`,
        description: `Current P/E of ${pe}x trades at a ${Math.round(((pe - medianPe) / medianPe) * 100)}% premium above historical 5-year median (${medianPe}x).`,
        severity: "warning",
        threshold: "> 45% Premium vs Median",
      });
    }

    // 5. Forensic Probe Red-Flags
    if (data.forensics) {
      const redFlags = data.forensics.filter((f) => f.status === "flag");
      if (redFlags.length > 0) {
        alerts.push({
          id: "forensic-red-flags",
          title: "Forensic Accounting Probe Flag",
          metric: `${redFlags.length} Red Flag${redFlags.length > 1 ? "s" : ""}`,
          description: redFlags.map((rf) => `${rf.title}: ${rf.description}`).join(" • "),
          severity: "critical",
          threshold: "Forensic Probe Verdict",
        });
      }
    }

    return alerts;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* 🌟 Top Hero Search & Multiline Suggestions Panel */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-800 space-y-4 relative z-30 shadow-2xl backdrop-blur-xl">
        {/* Full-Width Search Input Bar */}
        <div ref={heroSearchRef} className="relative w-full">
          <form onSubmit={handleHeroSearchSubmit} className="relative w-full flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400 pointer-events-none" />
            <input
              type="text"
              value={heroSearchQuery}
              onChange={(e) => {
                setHeroSearchQuery(e.target.value);
                setHeroShowDropdown(true);
              }}
              onFocus={() => {
                if (heroSearchResults.length > 0) setHeroShowDropdown(true);
              }}
              onKeyDown={handleHeroKeyDown}
              placeholder="Search any Indian Stock or Mutual Fund (e.g. RELIANCE, TCS, PICCADIL, TATAMOTORS, PARAG PARIKH)..."
              className="w-full bg-slate-950/90 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 rounded-2xl pl-12 pr-36 py-3.5 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all shadow-inner font-mono uppercase"
            />
            {heroIsSearching && (
              <Loader2 className="absolute right-32 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 animate-spin" />
            )}
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-md shadow-cyan-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>360° Audit</span>
            </button>
          </form>

          {/* Debounced Autocomplete Dropdown */}
          {heroShowDropdown && heroSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto divide-y divide-slate-800/60 z-50">
              <div className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/80 flex items-center justify-between">
                <span>Direct Search Matches ({heroSearchResults.length})</span>
                <span className="text-[9px] font-mono lowercase">↑↓ navigate • ↵ select • esc close</span>
              </div>
              {heroSearchResults.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => {
                    setHeroShowDropdown(false);
                    setHeroSearchQuery("");
                    handleHeroSelect({ id: item.id, type: item.type as "stock" | "fund" });
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs md:text-sm transition-colors ${
                    idx === heroSelectedIndex ? "bg-cyan-950/70 text-cyan-200" : "hover:bg-slate-900/80 text-slate-200"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-sm">{item.symbol_or_code || item.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        item.type === "stock" ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}>
                        {item.type === "stock" ? "NSE/BSE Equity" : "Mutual Fund"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Multi-line Quick Presets Panel Below Input */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Institutional 360° Watchlist (Instant 1-Click Deep Audit):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal lowercase hidden sm:inline">click to audit company</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {PRESET_COMPANIES.map((item) => (
              <button
                key={item.ticker}
                onClick={() => {
                  setTickerInput(item.ticker);
                  loadCompanyData(item.ticker);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  data?.ticker === item.ticker || tickerInput.toUpperCase().includes(item.ticker)
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-md shadow-cyan-950 font-semibold"
                    : "bg-slate-900/70 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <span className="font-mono font-bold text-white">{item.ticker}</span>
                <span className="text-slate-400">({item.name})</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/80">
                  {item.sector}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">
                  {item.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="space-y-6 animate-pulse py-4">
          <div className="glass-panel p-8 rounded-3xl border border-cyan-800/40 text-center space-y-5 my-2 relative overflow-hidden bg-gradient-to-b from-cyan-950/20 to-slate-950/80">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white tracking-tight">
                Running Institutional Deep Audit for <span className="text-cyan-400 font-mono uppercase">{tickerInput || "Selected Stock"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Fetching 12-Factor Fundamental Essentials, Multi-Timeframe Valuation Bands, 1-3Y Forward Growth Forecasts & Forensic Probes...
              </p>
            </div>
            {/* Animated Loading Bar */}
            <div className="max-w-xs mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 animate-pulse w-full" />
            </div>
          </div>

          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800/60 p-4 space-y-2">
                <div className="h-3 w-16 bg-slate-800 rounded" />
                <div className="h-6 w-24 bg-slate-800/80 rounded" />
              </div>
            ))}
          </div>

          {/* Skeleton Chart */}
          <div className="h-72 rounded-2xl bg-slate-900/30 border border-slate-800/60 p-6 flex items-center justify-center">
            <div className="text-xs font-mono text-slate-600 flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Synthesizing Multi-Timeframe Valuation Bands & Factor Scores...</span>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="glass-panel p-8 sm:p-14 rounded-3xl border border-slate-800 text-center space-y-8 my-4 relative overflow-hidden">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Hero Header & Value Proposition */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Instant Institutional Equity & Fund Audit</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Institutional Stock & Mutual Fund Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Run an instant 360° audit on any NSE/BSE company or AMFI mutual fund. Explore 1Y–3Y forward earnings forecasts, DuPont margin trajectories, forensic probe checks, and factor attribution.
            </p>
          </div>

          {/* Prominent Central Search Bar */}
          <div ref={heroSearchRef} className="max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                onFocus={() => {
                  if (heroSearchResults.length > 0) setHeroShowDropdown(true);
                }}
                onKeyDown={handleHeroKeyDown}
                placeholder="Enter any NSE/BSE Stock or Mutual Fund to run an Instant Institutional Audit..."
                className="w-full bg-slate-950/90 border-2 border-cyan-800/60 focus:border-cyan-400 text-white placeholder-slate-500 text-xs sm:text-sm rounded-2xl pl-12 pr-28 py-4 outline-none transition-all shadow-xl shadow-cyan-950/30"
              />
              <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none">
                {heroIsSearching ? (
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                ) : (
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-1 rounded-lg">
                    Instant Audit ↵
                  </span>
                )}
              </div>
            </div>

            {/* Live Autocomplete Results Dropdown */}
            {heroShowDropdown && heroSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/98 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto divide-y divide-slate-800/70 backdrop-blur-xl text-left">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 flex items-center justify-between">
                  <span>Direct Matches ({heroSearchResults.length})</span>
                  <span className="font-mono text-[9px] text-slate-600">Use ↑ ↓ ↵</span>
                </div>
                {heroSearchResults.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      setHeroShowDropdown(false);
                      setHeroSearchQuery("");
                      handleHeroSelect({ id: item.id, type: item.type as "stock" | "fund" });
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                      heroSelectedIndex === idx
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        : "hover:bg-slate-900/90 text-slate-200"
                    }`}
                  >
                    <div className="truncate pr-3">
                      <div className="font-semibold text-slate-100 text-xs sm:text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {item.symbol_or_code} • {item.sector_or_category}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          item.type === "stock"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {item.type === "stock" ? "Stock" : "Fund"}
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

          {/* Dynamic Quick-Search Guidance Chips */}
          <div className="max-w-2xl mx-auto pt-2 space-y-2.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
              Quick Instant Search Chips:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_SEARCH_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleHeroSelect(chip)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                    chip.type === "fund"
                      ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60 hover:border-emerald-600 shadow-sm"
                      : "bg-slate-950 text-cyan-300 border-slate-800 hover:border-cyan-700 hover:bg-cyan-950/40 shadow-sm"
                  }`}
                >
                  {chip.type === "fund" ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Building2 className="h-3 w-3 text-cyan-400" />
                  )}
                  <span>{chip.badge}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase font-bold">
                    {chip.type === "fund" ? "Fund" : "Stock"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Highlights Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left pt-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">1Y - 3Y Forecasts</span>
              <span className="text-xs font-semibold text-slate-200">Forward Projections</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Forensic Checks</span>
              <span className="text-xs font-semibold text-slate-200">5 Red-Flag Probes</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Valuation Models</span>
              <span className="text-xs font-semibold text-slate-200">Reverse DCF Matrix</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-purple-400 font-bold uppercase block">Audited Filings</span>
              <span className="text-xs font-semibold text-slate-200">5Y P&L, BS & CF</span>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Sticky Quick-Jump Anchor Ribbon & Export Actions */}
          <div className="sticky top-2 z-20 glass-panel p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
                {/* Anchor Jump Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    onClick={() => scrollToSection("sec-overview")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all shrink-0"
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-forecast")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 transition-all shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <Target className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Forecast (1Y-3Y)</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-quarterly")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-cyan-300 hover:bg-cyan-950/80 border border-cyan-900/50 transition-all shrink-0 flex items-center gap-1"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>8Q Trends</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-annual")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-emerald-300 hover:bg-emerald-950/80 border border-emerald-900/50 transition-all shrink-0 flex items-center gap-1"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>5Y Financials</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-segments")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all shrink-0"
                  >
                    Segments
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-forensics")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-amber-300 hover:bg-amber-950/80 border border-amber-900/50 transition-all shrink-0 flex items-center gap-1"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Forensics</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-dcf")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-purple-300 hover:bg-purple-950/80 border border-purple-900/50 transition-all shrink-0 flex items-center gap-1"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>DCF Sensitivity Matrix</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-shareholding")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all shrink-0"
                  >
                    Insiders & FIIs
                  </button>
                  <button
                    onClick={() => scrollToSection("sec-peers")}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all shrink-0"
                  >
                    Peers
                  </button>
                </div>

                {/* Direct Export & Sharing Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-800 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Download 5Y & 8Q Financial Statements as CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                  <button
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950 text-cyan-200 border border-cyan-800 hover:bg-cyan-900 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Copy 360° Executive Dossier to Clipboard"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-300" />}
                    <span>{copied ? "Copied!" : "Copy Summary"}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Top Header Card & Essentials Overview */}
              <div id="sec-overview" className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left Company Title & Details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-white tracking-tight">{data.company_name}</h2>
                        <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-md">
                          {data.ticker}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                          {data.market_cap_category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>Sector: <strong className="text-slate-200">{data.sector}</strong></span>
                        <span>•</span>
                        <span>Industry: <strong className="text-slate-200">{data.industry}</strong></span>
                        {data.website && (
                          <>
                            <span>•</span>
                            <a
                              href={data.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Official Website</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Price & Day Change */}
                    <div className="flex items-center gap-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Market Price</span>
                        <div className="text-2xl font-black text-white font-mono font-tabular mt-0.5">
                          ₹{data.essentials.current_price.toLocaleString("en-IN")}
                        </div>
                        <div className={`text-xs font-semibold font-mono flex items-center gap-1 mt-0.5 ${
                          data.essentials.day_change >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {data.essentials.day_change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          <span>{data.essentials.day_change >= 0 ? `+₹${data.essentials.day_change}` : `-₹${Math.abs(data.essentials.day_change)}`}</span>
                          <span>({data.essentials.day_change_pct >= 0 ? `+${data.essentials.day_change_pct}%` : `${data.essentials.day_change_pct}%`})</span>
                        </div>
                      </div>

                      {onNavigateToQuant && (
                        <button
                          onClick={() => onNavigateToQuant(data.ticker)}
                          className="px-3 py-2 rounded-xl bg-indigo-950/80 border border-indigo-700 text-indigo-300 text-xs font-semibold hover:bg-indigo-900 transition-colors flex items-center gap-1.5"
                        >
                          <span>Quant Scorecard</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 52-Week Range Slider Bar */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">
                        52W Low: <strong className="text-slate-200">₹{data.essentials.low_52w.toFixed(2)}</strong>
                      </span>
                      <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">52-Week Range Slider</span>
                      <span className="text-slate-400">
                        52W High: <strong className="text-slate-200">₹{data.essentials.high_52w.toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="relative h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 rounded-full opacity-80"
                        style={{ width: "100%" }}
                      />
                      {/* Pin position */}
                      <div
                        className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md shadow-white"
                        style={{
                          left: `${calculate52WPosition(data.essentials.current_price, data.essentials.low_52w, data.essentials.high_52w)}%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Diagnostic Scorecard Health Check & Warning Signals Ribbon */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${diagnosticAlerts.length > 0 ? "text-amber-400" : "text-emerald-400"}`} />
                        <span className="text-xs font-bold text-slate-200">
                          Diagnostic Health Scorecard:
                        </span>
                        {diagnosticAlerts.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            {diagnosticAlerts.length} Risk Signal{diagnosticAlerts.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            ✓ Clean Balance Sheet & Cash Flows
                          </span>
                        )}
                      </div>

                      {diagnosticAlerts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllAlerts(!showAllAlerts)}
                          className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                        >
                          {showAllAlerts ? "Hide Details ▴" : "View Diagnostic Breakdown ▾"}
                        </button>
                      )}
                    </div>

                    {/* Warning Badges Strip */}
                    {diagnosticAlerts.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {diagnosticAlerts.map((alert) => (
                            <button
                              key={alert.id}
                              type="button"
                              onClick={() => setShowAllAlerts(true)}
                              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm text-left ${
                                alert.severity === "critical"
                                  ? "bg-rose-950/80 text-rose-200 border-rose-800 hover:bg-rose-900/90"
                                  : "bg-amber-950/80 text-amber-200 border-amber-800 hover:bg-amber-900/90"
                              }`}
                              title={alert.description}
                            >
                              {alert.severity === "critical" ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                              ) : (
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              )}
                              <span>{alert.title}</span>
                              <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-bold">
                                {alert.metric}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Expanded Breakdown Drawer */}
                        {showAllAlerts && (
                          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 mt-2 divide-y divide-slate-800/70">
                            {diagnosticAlerts.map((alert) => (
                              <div key={alert.id} className="pt-2 first:pt-0 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className={`font-bold flex items-center gap-1.5 ${
                                    alert.severity === "critical" ? "text-rose-300" : "text-amber-300"
                                  }`}>
                                    {alert.title} ({alert.metric})
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                    {alert.threshold}
                                  </span>
                                </div>
                                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                                  {alert.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300 font-mono flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Passed conservative diagnostic checks: D/E &lt; 1.0x, 0% Promoter Pledged Equity, and Positive Cash Flow Compounding.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 12-Factor Fundamental Essentials Grid with Diagnostic Enhancements */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Market Cap</span>
                    <div className="text-sm font-bold text-slate-100 font-mono font-tabular">
                      ₹{data.essentials.market_cap_cr.toLocaleString("en-IN")} Cr
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Stock P/E</span>
                      {data.essentials.pe && (data.historical_valuation_summary?.median_pe || data.forward_estimates?.median_pe_benchmark) && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                          data.essentials.pe > (data.historical_valuation_summary?.median_pe || data.forward_estimates?.median_pe_benchmark || 25) * 1.35
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        }`}>
                          {data.essentials.pe > (data.historical_valuation_summary?.median_pe || data.forward_estimates?.median_pe_benchmark || 25) * 1.35 ? "Premium" : "In-Line"}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-cyan-400 font-mono font-tabular">
                      {data.essentials.pe ? `${data.essentials.pe}x` : "N/A"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Industry P/E</span>
                    <div className="text-sm font-bold text-slate-300 font-mono font-tabular">
                      {data.essentials.industry_pe ? `${data.essentials.industry_pe}x` : "N/A"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Price to Book</span>
                    <div className="text-sm font-bold text-slate-100 font-mono font-tabular">
                      {data.essentials.pb ? `${data.essentials.pb}x` : "N/A"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">ROCE</span>
                      {data.essentials.roce && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                          data.essentials.roce >= 20
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : data.essentials.roce < 12
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {data.essentials.roce >= 20 ? "Elite" : data.essentials.roce < 12 ? "Sub-12%" : "Healthy"}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono font-tabular">
                      {data.essentials.roce ? `${data.essentials.roce}%` : "N/A"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">ROE</span>
                      {data.essentials.roe && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                          data.essentials.roe >= 20
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : data.essentials.roe < 12
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {data.essentials.roe >= 20 ? "Elite" : data.essentials.roe < 12 ? "Sub-12%" : "Healthy"}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono font-tabular">
                      {data.essentials.roe ? `${data.essentials.roe}%` : "N/A"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Dividend Yield</span>
                    <div className="text-sm font-bold text-amber-300 font-mono font-tabular">
                      {data.essentials.dividend_yield ? `${data.essentials.dividend_yield}%` : "0.00%"}
                    </div>
                  </div>

                  <div className={`glass-panel p-3.5 rounded-xl border space-y-1 transition-all ${
                    data.essentials.debt_to_equity !== null && data.essentials.debt_to_equity !== undefined && data.essentials.debt_to_equity > 1.5
                      ? "border-rose-700/80 bg-rose-950/25 shadow-md shadow-rose-950/30"
                      : data.essentials.debt_to_equity !== null && data.essentials.debt_to_equity !== undefined && data.essentials.debt_to_equity > 1.0
                      ? "border-amber-700/80 bg-amber-950/20"
                      : "border-slate-800"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Debt to Equity</span>
                      {data.essentials.debt_to_equity !== null && data.essentials.debt_to_equity !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                          data.essentials.debt_to_equity > 1.5
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : data.essentials.debt_to_equity > 1.0
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}>
                          {data.essentials.debt_to_equity > 1.5 ? "High (>1.5x)" : data.essentials.debt_to_equity > 1.0 ? "Moderate" : "Low Debt"}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm font-bold font-mono font-tabular ${
                      data.essentials.debt_to_equity !== null && data.essentials.debt_to_equity !== undefined && data.essentials.debt_to_equity > 1.5
                        ? "text-rose-400"
                        : data.essentials.debt_to_equity !== null && data.essentials.debt_to_equity !== undefined && data.essentials.debt_to_equity > 1.0
                        ? "text-amber-300"
                        : "text-slate-200"
                    }`}>
                      {data.essentials.debt_to_equity !== null && data.essentials.debt_to_equity !== undefined ? `${data.essentials.debt_to_equity}x` : "0.00 (Cash Rich)"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">EPS (TTM)</span>
                    <div className="text-sm font-bold text-slate-100 font-mono font-tabular">
                      {data.essentials.eps_ttm ? `₹${data.essentials.eps_ttm}` : "N/A"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">PEG Ratio</span>
                      {data.essentials.peg_ratio !== null && data.essentials.peg_ratio !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                          data.essentials.peg_ratio < 1.0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : data.essentials.peg_ratio > 2.0
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        }`}>
                          {data.essentials.peg_ratio < 1.0 ? "Attractive" : data.essentials.peg_ratio > 2.0 ? "Premium" : "Fair"}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-cyan-300 font-mono font-tabular">
                      {data.essentials.peg_ratio !== null && data.essentials.peg_ratio !== undefined ? `${data.essentials.peg_ratio}x` : "1.25x"}
                    </div>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Free Cash Flow</span>
                    <div className="text-sm font-bold text-cyan-300 font-mono font-tabular">
                      ₹{data.essentials.fcf_cr ? `${data.essentials.fcf_cr.toLocaleString("en-IN")} Cr` : "N/A"}
                    </div>
                  </div>

                  <div className={`glass-panel p-3.5 rounded-xl border space-y-1 transition-all ${
                    (data.institutional_delta?.pledged_shares_pct || data.shareholding?.[0]?.pledged_pct || 0) > 0
                      ? "border-amber-700/80 bg-amber-950/20"
                      : "border-slate-800"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Promoter Holding</span>
                      {(data.institutional_delta?.pledged_shares_pct || data.shareholding?.[0]?.pledged_pct || 0) > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800">
                          {data.institutional_delta?.pledged_shares_pct || data.shareholding?.[0]?.pledged_pct}% Pledged
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-100 font-mono font-tabular">
                      {data.essentials.promoter_holding_pct ? `${data.essentials.promoter_holding_pct}%` : "54.2%"}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                  {/* Header & Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">
                          Historical Price & Valuation Performance
                        </h3>
                        {historyLoading && <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Daily closes on National Stock Exchange of India (NSE) / BSE with multi-year valuation multiples
                      </p>
                    </div>

                    {/* Metric Switcher & DMA Toggle */}
                    <div className="flex flex-wrap items-center gap-2">
                      {chartView === "price" && (
                        <button
                          type="button"
                          onClick={() => setShowDma((prev) => !prev)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                            showDma
                              ? "bg-indigo-950 text-indigo-300 border-indigo-700 shadow-sm"
                              : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                          }`}
                          title="Toggle 50-DMA and 200-DMA technical trend lines"
                        >
                          {showDma ? "50/200 DMA: ON" : "50/200 DMA: OFF"}
                        </button>
                      )}

                      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                        <button
                          onClick={() => setChartView("price")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            chartView === "price"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800 shadow"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Price & Volume
                        </button>
                        <button
                          onClick={() => setChartView("pe")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            chartView === "pe"
                              ? "bg-amber-950 text-amber-300 border border-amber-800 shadow"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          P/E Multiple
                        </button>
                        <button
                          onClick={() => setChartView("pb")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            chartView === "pb"
                              ? "bg-purple-950 text-purple-300 border border-purple-800 shadow"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          P/B Multiple
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Timeframe Presets Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] uppercase font-bold text-slate-500 px-1 shrink-0">
                        Timeframe:
                      </span>
                      {(["1m", "6m", "1y", "3y", "5y", "max"] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => handleTimeframeChange(tf)}
                          disabled={historyLoading}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
                            selectedTimeframe === tf
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md shadow-cyan-950"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                          }`}
                        >
                          {tf === "max" ? "MAX (Stock Life)" : tf.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* Valuation Intelligence Pill */}
                    {valSummary && (
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            valSummary.valuation_verdict.toLowerCase().includes("undervalued")
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : valSummary.valuation_verdict.toLowerCase().includes("fair")
                              ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                              : "bg-amber-950 text-amber-300 border-amber-800"
                          }`}
                        >
                          {valSummary.valuation_verdict}
                        </span>
                        {valSummary.period_return_pct !== undefined && valSummary.period_return_pct !== null && (
                          <span
                            className={`font-semibold ${
                              valSummary.period_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {valSummary.period_return_pct >= 0 ? "+" : ""}
                            {valSummary.period_return_pct}% ({selectedTimeframe.toUpperCase()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Valuation Statistical Metrics Strip (when in PE mode) */}
                  {chartView === "pe" && valSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current P/E</span>
                        <span className="font-bold text-amber-300 text-sm">{valSummary.current_pe || data.essentials.pe || "N/A"}x</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-cyan-400 uppercase block font-semibold">{selectedTimeframe.toUpperCase()} Median P/E</span>
                        <span className="font-bold text-cyan-300 text-sm">{valSummary.median_pe || "N/A"}x</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 uppercase block font-semibold">-1σ Undervalued Band</span>
                        <span className="font-bold text-emerald-300 text-sm">{valSummary.pe_minus_1sigma || "N/A"}x</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-rose-400 uppercase block font-semibold">+1σ Elevated Band</span>
                        <span className="font-bold text-rose-300 text-sm">{valSummary.pe_plus_1sigma || "N/A"}x</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Historical Range</span>
                        <span className="text-slate-300 font-semibold">{valSummary.min_pe || "N/A"}x – {valSummary.max_pe || "N/A"}x</span>
                      </div>
                    </div>
                  )}

                  {/* Chart Container */}
                  <div className="h-72 w-full pt-2">
                    {activePoints && activePoints.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartView === "price" ? (
                          <ComposedChart data={activePoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="companyPriceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              stroke="#475569"
                              fontSize={10}
                              tickLine={false}
                              tickFormatter={(v) => v.slice(2)}
                            />
                            <YAxis
                              yAxisId="priceAxis"
                              stroke="#475569"
                              fontSize={10}
                              tickLine={false}
                              domain={["auto", "auto"]}
                              tickFormatter={(v) => `₹${v}`}
                            />
                            <YAxis
                              yAxisId="volumeAxis"
                              orientation="right"
                              stroke="#334155"
                              fontSize={9}
                              tickLine={false}
                              domain={[0, "dataMax * 3.5"]}
                              hide={true}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderColor: "#334155",
                                borderRadius: "0.75rem",
                                color: "#f8fafc",
                                fontSize: "12px",
                              }}
                              formatter={(val: any, name: any) => {
                                if (name === "close") return [`₹${Number(val).toFixed(2)}`, "Closing Price"];
                                if (name === "dma_50") return [`₹${Number(val).toFixed(2)}`, "50-DMA"];
                                if (name === "dma_200") return [`₹${Number(val).toFixed(2)}`, "200-DMA"];
                                if (name === "volume") return [Number(val).toLocaleString("en-IN"), "Volume"];
                                return [val, name];
                              }}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Bar
                              yAxisId="volumeAxis"
                              dataKey="volume"
                              fill="#0891b2"
                              opacity={0.25}
                              isAnimationActive={false}
                            />
                            <Area
                              yAxisId="priceAxis"
                              type="monotone"
                              dataKey="close"
                              stroke="#06b6d4"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#companyPriceGrad)"
                            />
                            {showDma && (
                              <>
                                <Line
                                  yAxisId="priceAxis"
                                  type="monotone"
                                  dataKey="dma_50"
                                  stroke="#f59e0b"
                                  strokeWidth={1.5}
                                  dot={false}
                                  strokeDasharray="3 3"
                                />
                                <Line
                                  yAxisId="priceAxis"
                                  type="monotone"
                                  dataKey="dma_200"
                                  stroke="#a855f7"
                                  strokeWidth={1.5}
                                  dot={false}
                                  strokeDasharray="4 4"
                                />
                              </>
                            )}
                          </ComposedChart>
                        ) : chartView === "pe" ? (
                          <AreaChart data={activePoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="companyPeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              stroke="#475569"
                              fontSize={10}
                              tickLine={false}
                              tickFormatter={(v) => v.slice(2)}
                            />
                            <YAxis
                              stroke="#475569"
                              fontSize={10}
                              tickLine={false}
                              domain={["auto", "auto"]}
                              tickFormatter={(v) => `${v}x`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderColor: "#334155",
                                borderRadius: "0.75rem",
                                color: "#f8fafc",
                                fontSize: "12px",
                              }}
                              formatter={(val: any) => [`${Number(val).toFixed(2)}x`, "P/E Multiple"]}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            {valSummary?.median_pe && valSummary.median_pe > 0 && (
                              <ReferenceLine
                                y={valSummary.median_pe}
                                stroke="#06b6d4"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                label={{
                                  value: `Median: ${valSummary.median_pe}x`,
                                  fill: "#06b6d4",
                                  fontSize: 10,
                                  position: "insideTopRight",
                                }}
                              />
                            )}
                            {valSummary?.pe_plus_1sigma && (
                              <ReferenceLine
                                y={valSummary.pe_plus_1sigma}
                                stroke="#f43f5e"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                                label={{
                                  value: `+1σ: ${valSummary.pe_plus_1sigma}x`,
                                  fill: "#f43f5e",
                                  fontSize: 9,
                                  position: "insideTopLeft",
                                }}
                              />
                            )}
                            {valSummary?.pe_minus_1sigma && (
                              <ReferenceLine
                                y={valSummary.pe_minus_1sigma}
                                stroke="#10b981"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                                label={{
                                  value: `-1σ: ${valSummary.pe_minus_1sigma}x`,
                                  fill: "#10b981",
                                  fontSize: 9,
                                  position: "insideBottomLeft",
                                }}
                              />
                            )}
                            <Area
                              type="monotone"
                              dataKey="pe"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#companyPeGrad)"
                            />
                          </AreaChart>
                        ) : (
                          <AreaChart data={activePoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="companyPbGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              stroke="#475569"
                              fontSize={10}
                              tickLine={false}
                              tickFormatter={(v) => v.slice(2)}
                            />
                            <YAxis
                              stroke="#475569"
                              fontSize={10}
                              tickLine={false}
                              domain={["auto", "auto"]}
                              tickFormatter={(v) => `${v}x`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderColor: "#334155",
                                borderRadius: "0.75rem",
                                color: "#f8fafc",
                                fontSize: "12px",
                              }}
                              formatter={(val: any) => [`${Number(val).toFixed(2)}x`, "P/B Multiple"]}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            {valSummary?.median_pb && valSummary.median_pb > 0 && (
                              <ReferenceLine
                                y={valSummary.median_pb}
                                stroke="#a855f7"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                label={{
                                  value: `Median P/B: ${valSummary.median_pb}x`,
                                  fill: "#c084fc",
                                  fontSize: 10,
                                  position: "insideTopRight",
                                }}
                              />
                            )}
                            <Area
                              type="monotone"
                              dataKey="pb"
                              stroke="#a855f7"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#companyPbGrad)"
                            />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                        Price & valuation trend data currently unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: 1-to-3 Year Forward Earnings & Growth Forecasting Suite */}
              {activeForecastScenario && data.forward_estimates && (
                <div id="sec-forecast" className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                  {/* Section Header & Scenario Switcher */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-base font-bold text-white tracking-tight">
                          1-to-3 Year Forward Earnings & Growth Forecasting Engine
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {data.forward_estimates.base_year_label} Base
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Forward fundamental CAGR compounding, DuPont net margin projections, and multi-scenario target price discovery.
                      </p>
                    </div>

                    {/* Scenario Mode Switcher */}
                    <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setSelectedScenario("base")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedScenario === "base"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Base Case (Most Likely)
                      </button>
                      <button
                        onClick={() => setSelectedScenario("bull")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedScenario === "bull"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Bull Case (Accelerated)
                      </button>
                      <button
                        onClick={() => setSelectedScenario("bear")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedScenario === "bear"
                            ? "bg-rose-950 text-rose-300 border border-rose-800 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Bear Case (Slowdown)
                      </button>
                      <button
                        onClick={() => setSelectedScenario("custom")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                          selectedScenario === "custom"
                            ? "bg-purple-950 text-purple-300 border border-purple-700 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Sliders className="h-3 w-3" />
                        <span>Custom Simulator</span>
                      </button>
                    </div>
                  </div>

                  {/* Historical Growth Anchors & Assumptions Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">3Y Historical Rev CAGR</span>
                      <span className="font-bold text-slate-200">
                        {data.forward_estimates.historical_cagr_3y_rev !== null && data.forward_estimates.historical_cagr_3y_rev !== undefined
                          ? `+${data.forward_estimates.historical_cagr_3y_rev}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">5Y Historical Rev CAGR</span>
                      <span className="font-bold text-slate-200">
                        {data.forward_estimates.historical_cagr_5y_rev !== null && data.forward_estimates.historical_cagr_5y_rev !== undefined
                          ? `+${data.forward_estimates.historical_cagr_5y_rev}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-emerald-400 uppercase block font-semibold">3Y Historical PAT CAGR</span>
                      <span className="font-bold text-emerald-300">
                        {data.forward_estimates.historical_cagr_3y_pat !== null && data.forward_estimates.historical_cagr_3y_pat !== undefined
                          ? `+${data.forward_estimates.historical_cagr_3y_pat}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-cyan-400 uppercase block font-semibold">Sustainable Growth (SGR)</span>
                      <span className="font-bold text-cyan-300">
                        {data.forward_estimates.sustainable_growth_rate !== null && data.forward_estimates.sustainable_growth_rate !== undefined
                          ? `+${data.forward_estimates.sustainable_growth_rate}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-amber-400 uppercase block font-semibold">5Y Median Benchmark P/E</span>
                      <span className="font-bold text-amber-300">{data.forward_estimates.median_pe_benchmark}x</span>
                    </div>
                  </div>

                  {/* Interactive Sliders (When Custom Simulator is Selected) */}
                  {selectedScenario === "custom" && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-purple-200 flex items-center gap-1.5 uppercase tracking-wide">
                          <Calculator className="h-4 w-4 text-purple-400" />
                          <span>Interactive Custom Scenario Parameters</span>
                        </h4>
                        <span className="text-[11px] text-purple-300 font-mono">Real-time dynamic recalculation</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Annual Revenue Growth:</span>
                            <span className="font-bold text-cyan-300">{customRevGrowth}% / yr</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="50"
                            step="0.5"
                            value={customRevGrowth}
                            onChange={(e) => setCustomRevGrowth(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Net Profit Margin (NPM):</span>
                            <span className="font-bold text-emerald-300">{customNetMargin}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="45"
                            step="0.5"
                            value={customNetMargin}
                            onChange={(e) => setCustomNetMargin(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Exit Target P/E Multiple:</span>
                            <span className="font-bold text-amber-300">{customExitPe}x</span>
                          </div>
                          <input
                            type="range"
                            min="8"
                            max="70"
                            step="0.5"
                            value={customExitPe}
                            onChange={(e) => setCustomExitPe(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scenario Description Pill */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{activeForecastScenario.scenario_name}:</span>
                      <span className="text-slate-400">{activeForecastScenario.scenario_description}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Growth: {activeForecastScenario.assumed_revenue_growth_pct}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        NPM: {activeForecastScenario.assumed_net_margin_pct}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        Exit P/E: {activeForecastScenario.assumed_exit_pe}x
                      </span>
                    </div>
                  </div>

                  {/* 3 Horizon Projection Cards (1Y, 2Y, 3Y) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeForecastScenario.projections.map((proj) => (
                      <div
                        key={proj.horizon_years}
                        className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                          proj.horizon_years === 3
                            ? "bg-gradient-to-b from-slate-900/90 to-cyan-950/30 border-cyan-700/80 shadow-lg shadow-cyan-950/30"
                            : "bg-slate-950/70 border-slate-800/90"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                          <div>
                            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                              {proj.horizon_years}-Year Forward Target
                            </span>
                            <h4 className="text-sm font-bold text-white font-mono">{proj.year_label}</h4>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                                proj.implied_return_pct >= 0
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-rose-950 text-rose-300 border-rose-800"
                              }`}
                            >
                              {proj.implied_return_pct >= 0 ? "+" : ""}
                              {proj.implied_return_pct}%
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 space-y-2.5 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Projected Revenue:</span>
                            <span className="font-bold text-slate-100">₹{proj.revenue_cr.toLocaleString("en-IN")} Cr</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Projected PAT:</span>
                            <span className="font-bold text-emerald-400">₹{proj.pat_cr.toLocaleString("en-IN")} Cr</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Projected EPS:</span>
                            <span className="font-bold text-amber-300">₹{proj.eps} / share</span>
                          </div>
                          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                            <span className="text-slate-300 font-semibold">Implied Target Price:</span>
                            <span className="font-extrabold text-cyan-300 text-sm">₹{proj.target_price.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500">Annualized Expected CAGR:</span>
                            <span
                              className={`font-bold ${
                                proj.implied_cagr_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {proj.implied_cagr_pct >= 0 ? "+" : ""}
                              {proj.implied_cagr_pct}% / yr
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Combined 5Y Historical + 3Y Forward Trajectory Chart */}
                  <div className="space-y-2 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <BarChart3 className="h-4 w-4 text-cyan-400" />
                        <span>Historical Financials & 3-Year Forward Trajectory (Revenue & PAT in ₹ Cr)</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600 inline-block"></span>
                          <span>Audited Revenue</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block border border-dashed border-cyan-200"></span>
                          <span>Projected Revenue</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"></span>
                          <span>Projected PAT</span>
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={forecastChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="forecastRevHistGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0891b2" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="forecastRevProjGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.4} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} />
                          <YAxis
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                            domain={[0, "auto"]}
                            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} Cr`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "0.75rem",
                              color: "#f8fafc",
                              fontSize: "12px",
                            }}
                            formatter={(val: any, name: any) => {
                              if (!val) return [null, null];
                              if (name === "revenue_hist") return [`₹${Number(val).toLocaleString("en-IN")} Cr`, "Audited Revenue"];
                              if (name === "revenue_proj") return [`₹${Number(val).toLocaleString("en-IN")} Cr`, "Projected Revenue"];
                              if (name === "pat_hist") return [`₹${Number(val).toLocaleString("en-IN")} Cr`, "Audited Net Profit (PAT)"];
                              if (name === "pat_proj") return [`₹${Number(val).toLocaleString("en-IN")} Cr`, "Projected Net Profit (PAT)"];
                              return [val, name];
                            }}
                            labelFormatter={(label) => `Fiscal Year: ${label}`}
                          />
                          <Bar dataKey="revenue_hist" fill="url(#forecastRevHistGrad)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                          <Bar dataKey="revenue_proj" fill="url(#forecastRevProjGrad)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                          <Line
                            type="monotone"
                            dataKey="pat_hist"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="pat_proj"
                            stroke="#34d399"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ fill: "#34d399", r: 4 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Driver Attribution Breakdown Callout */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-cyan-200">Return Driver Attribution:</span>
                      <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                        {data.forward_estimates.driver_attribution}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: 8-Quarter Financial Trends & Margin Trajectory */}
              {data.quarterly_financials && (
                <div id="sec-quarterly" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-400" />
                        <span>8-Quarter Financial Performance & Margin Trajectory</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Quarterly audited financial statements (₹ in Crores)</p>
                    </div>

                    {/* Growth Highlights */}
                    <div className="flex flex-wrap items-center gap-2">
                      {data.quarterly_financials.yoy_revenue_growth_pct !== null && data.quarterly_financials.yoy_revenue_growth_pct !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          YoY Sales: +{data.quarterly_financials.yoy_revenue_growth_pct}%
                        </span>
                      )}
                      {data.quarterly_financials.yoy_pat_growth_pct !== null && data.quarterly_financials.yoy_pat_growth_pct !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          YoY PAT: +{data.quarterly_financials.yoy_pat_growth_pct}%
                        </span>
                      )}
                      {data.quarterly_financials.latest_opm_pct !== null && data.quarterly_financials.latest_opm_pct !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          Latest OPM: {data.quarterly_financials.latest_opm_pct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 8-Quarter Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                          <th className="pb-2.5 min-w-[200px]">Quarterly Metric</th>
                          {data.quarterly_financials.quarters.map((q) => (
                            <th key={q} className="pb-2.5 text-right font-mono min-w-[80px]">{q}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {data.quarterly_financials.rows.map((row) => (
                          <tr
                            key={row.metric_name}
                            className={`hover:bg-slate-800/30 ${
                              row.is_bold ? "font-bold text-white bg-slate-900/30" : "text-slate-300"
                            }`}
                          >
                            <td className="py-2.5 flex items-center gap-1.5">
                              <span>{row.metric_name}</span>
                              {row.is_percentage && (
                                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1 rounded border border-cyan-800/40">Margin</span>
                              )}
                            </td>
                            {data.quarterly_financials!.quarters.map((q) => {
                              const val = row.values[q];
                              return (
                                <td
                                  key={q}
                                  className={`py-2.5 text-right font-tabular ${
                                    row.is_percentage
                                      ? "text-amber-300 font-semibold"
                                      : val !== null && val < 0
                                      ? "text-rose-400"
                                      : ""
                                  }`}
                                >
                                  {val !== null && val !== undefined
                                    ? row.is_percentage
                                      ? `${val}%`
                                      : val.toLocaleString("en-IN")
                                    : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 3: 5-Year Historical Financial Statements */}
              <div id="sec-annual" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      <span>5-Year Historical Audited Financial Statements</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Annual audited filings (₹ in Crores)</p>
                  </div>

                  {/* Statement Tabs */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setFinancialTab("pl")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        financialTab === "pl"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800 shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Profit & Loss (P&L)
                    </button>
                    <button
                      onClick={() => setFinancialTab("bs")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        financialTab === "bs"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800 shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Balance Sheet
                    </button>
                    <button
                      onClick={() => setFinancialTab("cf")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        financialTab === "cf"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800 shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Cash Flows
                    </button>
                  </div>
                </div>

                {/* Financial Statements Table */}
                <div className="overflow-x-auto">
                  {financialTab === "pl" && (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                          <th className="pb-2.5 min-w-[200px]">Financial Metric</th>
                          {data.financials.income_statement.years.map((y) => (
                            <th key={y} className="pb-2.5 text-right font-mono min-w-[80px]">{y}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {data.financials.income_statement.rows.map((row) => (
                          <tr key={row.metric_name} className={`hover:bg-slate-800/30 ${row.is_bold ? "font-bold text-white bg-slate-900/30" : "text-slate-300"}`}>
                            <td className="py-2.5">{row.metric_name}</td>
                            {data.financials.income_statement.years.map((y) => (
                              <td key={y} className="py-2.5 text-right font-tabular">
                                {row.values[y] !== null && row.values[y] !== undefined ? row.values[y]?.toLocaleString("en-IN") : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {financialTab === "bs" && (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                          <th className="pb-2.5 min-w-[200px]">Balance Sheet Line Item</th>
                          {data.financials.balance_sheet.years.map((y) => (
                            <th key={y} className="pb-2.5 text-right font-mono min-w-[80px]">{y}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {data.financials.balance_sheet.rows.map((row) => (
                          <tr key={row.metric_name} className={`hover:bg-slate-800/30 ${row.is_bold ? "font-bold text-white bg-slate-900/30" : "text-slate-300"}`}>
                            <td className="py-2.5">{row.metric_name}</td>
                            {data.financials.balance_sheet.years.map((y) => (
                              <td key={y} className="py-2.5 text-right font-tabular">
                                {row.values[y] !== null && row.values[y] !== undefined ? row.values[y]?.toLocaleString("en-IN") : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {financialTab === "cf" && (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                          <th className="pb-2.5 min-w-[200px]">Cash Flow Metric</th>
                          {data.financials.cash_flows.years.map((y) => (
                            <th key={y} className="pb-2.5 text-right font-mono min-w-[80px]">{y}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {data.financials.cash_flows.rows.map((row) => (
                          <tr key={row.metric_name} className={`hover:bg-slate-800/30 ${row.is_bold ? "font-bold text-white bg-slate-900/30" : "text-slate-300"}`}>
                            <td className="py-2.5">{row.metric_name}</td>
                            {data.financials.cash_flows.years.map((y) => (
                              <td key={y} className="py-2.5 text-right font-tabular">
                                {row.values[y] !== null && row.values[y] !== undefined ? row.values[y]?.toLocaleString("en-IN") : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Section 4: Revenue Mix & Forensic Health Probes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Revenue Segment Mix */}
                <div id="sec-segments" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-cyan-400" />
                      <span>Revenue & Product Segment Breakdown</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Segment Mix</span>
                  </div>

                  {/* Segment Bars */}
                  <div className="space-y-3">
                    {data.segments.map((seg) => (
                      <div key={seg.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-200">{seg.name}</span>
                          <div className="flex items-center gap-2 font-mono">
                            {seg.revenue_cr && <span className="text-slate-400">₹{seg.revenue_cr} Cr</span>}
                            <span className="font-bold text-cyan-400">{seg.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${seg.percentage}%`,
                              backgroundColor: seg.color || "#06b6d4",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Geographic Mix */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      <span>Geographic Distribution</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {data.geography.map((geo) => (
                        <div key={geo.region} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium">{geo.region}</span>
                          <span className="font-bold text-slate-100 font-mono">{geo.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Forensic Health Checks */}
                <div id="sec-forensics" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Forensic Health Probes (5 Red-Flag Checks)</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Forensic Probes</span>
                  </div>

                  <div className="space-y-2.5">
                    {data.forensics.map((f) => (
                      <div
                        key={f.title}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-2">
                            {f.status === "pass" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                            {f.status === "warning" && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                            {f.status === "flag" && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                            <span>{f.title}</span>
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-100">{f.value_str}</span>
                            <span className="text-[10px] text-slate-500">({f.benchmark_str})</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 5: 2-Stage DCF Valuation & 5x5 Sensitivity Matrix */}
              <div id="sec-dcf" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-purple-400" />
                      <span>2-Stage DCF Valuation & 5x5 Sensitivity Matrix</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      5-Year High Growth Stage + 5-Year Fade Stage + Gordon Growth Terminal Value
                    </p>
                  </div>

                  {/* Status Badge */}
                  {data.dcf_sensitivity_matrix && (
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      data.dcf_sensitivity_matrix.margin_of_safety_pct >= 15
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        : data.dcf_sensitivity_matrix.margin_of_safety_pct >= -15
                        ? "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                        : "bg-rose-950/80 text-rose-300 border-rose-800"
                    }`}>
                      {data.dcf_sensitivity_matrix.valuation_status}
                    </div>
                  )}
                </div>

                {/* Valuation Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Intrinsic Fair Value (Base Case)</span>
                    <div className="text-xl font-black text-purple-300 font-mono font-tabular">
                      ₹{data.dcf_sensitivity_matrix?.base_fair_value ? data.dcf_sensitivity_matrix.base_fair_value.toFixed(2) : "N/A"}
                    </div>
                    <span className="text-[11px] text-slate-400">At 15% 5Y CAGR, 12% WACC, 4% Terminal</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Market Price (CMP)</span>
                    <div className="text-xl font-black text-white font-mono font-tabular">
                      ₹{data.essentials.current_price.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-400">Live traded price on exchange</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Margin of Safety</span>
                    <div className={`text-xl font-black font-mono font-tabular ${
                      (data.dcf_sensitivity_matrix?.margin_of_safety_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {data.dcf_sensitivity_matrix?.margin_of_safety_pct !== undefined
                        ? `${data.dcf_sensitivity_matrix.margin_of_safety_pct > 0 ? "+" : ""}${data.dcf_sensitivity_matrix.margin_of_safety_pct}%`
                        : "N/A"}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {(data.dcf_sensitivity_matrix?.margin_of_safety_pct || 0) >= 0 ? "Discount to Fair Value" : "Premium over Fair Value"}
                    </span>
                  </div>
                </div>

                {/* Interactive Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Discount Rate (WACC):</span>
                      <span className="font-bold text-cyan-400 font-mono">{dcfWacc}%</span>
                    </div>
                    <input
                      type="range"
                      min="9"
                      max="16"
                      step="0.5"
                      value={dcfWacc}
                      onChange={(e) => setDcfWacc(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">5-Year Growth CAGR:</span>
                      <span className="font-bold text-emerald-400 font-mono">{dcfGrowth5y}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="1"
                      value={dcfGrowth5y}
                      onChange={(e) => setDcfGrowth5y(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Terminal Growth Rate:</span>
                      <span className="font-bold text-amber-400 font-mono">{dcfTerminalGrowth}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="6"
                      step="0.5"
                      value={dcfTerminalGrowth}
                      onChange={(e) => setDcfTerminalGrowth(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Dynamic Calculated Fair Value Result */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    Custom Scenario Intrinsic Value:{" "}
                    <strong className="text-white text-sm font-mono">
                      ₹{calculateDynamic2StageFairValue(data.essentials.eps_ttm || 20.0, dcfGrowth5y, dcfWacc, dcfTerminalGrowth)}
                    </strong>
                  </div>
                  <div className="text-xs font-mono">
                    {(() => {
                      const fv = calculateDynamic2StageFairValue(data.essentials.eps_ttm || 20.0, dcfGrowth5y, dcfWacc, dcfTerminalGrowth);
                      const mos = Math.round(((fv - data.essentials.current_price) / Math.max(1, fv)) * 1000) / 10;
                      return (
                        <span className={mos >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          Margin of Safety: {mos > 0 ? "+" : ""}{mos}%
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* 5x5 WACC vs Terminal Growth Sensitivity Matrix Table */}
                {data.dcf_sensitivity_matrix && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        5x5 Valuation Sensitivity Grid (WACC vs Terminal Growth)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Fair Value (₹) & Margin of Safety (%)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs border border-slate-800 rounded-xl overflow-hidden">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="py-2 px-3 text-left font-semibold">WACC \ Term. Growth</th>
                            {data.dcf_sensitivity_matrix.terminal_growth_rates.map((tg) => (
                              <th key={tg} className="py-2 px-3 font-mono font-bold text-amber-300">
                                {tg.toFixed(1)}%
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {data.dcf_sensitivity_matrix.grid.map((row, rIdx) => {
                            const wacc = data.dcf_sensitivity_matrix!.wacc_rates[rIdx];
                            return (
                              <tr key={wacc} className="hover:bg-slate-800/20">
                                <td className="py-2 px-3 text-left font-bold text-cyan-300 bg-slate-950/60">
                                  {wacc.toFixed(1)}%
                                </td>
                                {row.map((cell) => (
                                  <td
                                    key={`${cell.wacc_pct}-${cell.terminal_growth_pct}`}
                                    className={`py-2 px-3 transition-colors ${
                                      cell.is_base_case
                                        ? "bg-purple-950/40 border-2 border-purple-500/80 font-black text-white"
                                        : cell.margin_of_safety_pct >= 0
                                        ? "bg-emerald-950/10 text-emerald-300"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    <div className="text-xs font-bold font-tabular">₹{cell.fair_value.toFixed(0)}</div>
                                    <div className={`text-[10px] ${
                                      cell.margin_of_safety_pct >= 0 ? "text-emerald-400 font-semibold" : "text-slate-500"
                                    }`}>
                                      {cell.margin_of_safety_pct > 0 ? "+" : ""}{cell.margin_of_safety_pct}%
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reverse DCF Implied Growth Calculator */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold">Reverse DCF Implied 5Y Growth:</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {calculateDynamicImpliedGrowth(data.essentials.current_price, data.essentials.eps_ttm || 20.0, discountRate, terminalGrowth)}% CAGR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    At the current price of ₹{data.essentials.current_price}, the market assumes the company will compound earnings at <strong>{calculateDynamicImpliedGrowth(data.essentials.current_price, data.essentials.eps_ttm || 20.0, discountRate, terminalGrowth)}% per year</strong> over the next 5 years (at {discountRate}% discount rate and {terminalGrowth}% terminal growth).
                  </p>
                </div>
              </div>

              {/* Section 6: Shareholding Evolution & Institutional Flow Delta */}
              <div id="sec-shareholding" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span>Shareholding Pattern Evolution & Institutional Delta</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Quarterly ownership distribution and institutional flow shifts</p>
                  </div>

                  {/* Sentiment Badge */}
                  {data.institutional_delta && (
                    <div className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-950 text-cyan-300 border border-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{data.institutional_delta.net_institutional_sentiment}</span>
                    </div>
                  )}
                </div>

                {/* Institutional Delta Cards */}
                {data.institutional_delta && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Promoter QoQ Delta</span>
                      <div className={`text-sm font-bold font-mono font-tabular ${
                        data.institutional_delta.promoter_qoq_delta >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {data.institutional_delta.promoter_qoq_delta >= 0 ? `+${data.institutional_delta.promoter_qoq_delta}%` : `${data.institutional_delta.promoter_qoq_delta}%`}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">FII Net QoQ Delta</span>
                      <div className={`text-sm font-bold font-mono font-tabular ${
                        data.institutional_delta.fii_qoq_delta >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {data.institutional_delta.fii_qoq_delta >= 0 ? `+${data.institutional_delta.fii_qoq_delta}%` : `${data.institutional_delta.fii_qoq_delta}%`}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">DII Net QoQ Delta</span>
                      <div className={`text-sm font-bold font-mono font-tabular ${
                        data.institutional_delta.dii_qoq_delta >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {data.institutional_delta.dii_qoq_delta >= 0 ? `+${data.institutional_delta.dii_qoq_delta}%` : `${data.institutional_delta.dii_qoq_delta}%`}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Promoter Pledging</span>
                      <div className="text-sm font-bold text-emerald-400 font-mono font-tabular">
                        0.0% Pledged
                      </div>
                    </div>
                  </div>
                )}

                {/* 4-Quarter Shareholding Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="pb-2">Quarter</th>
                        <th className="pb-2 text-right">Promoters</th>
                        <th className="pb-2 text-right">FIIs</th>
                        <th className="pb-2 text-right">DIIs</th>
                        <th className="pb-2 text-right">Public / Retail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {data.shareholding.map((sh) => (
                        <tr key={sh.quarter} className="hover:bg-slate-800/30">
                          <td className="py-2.5 text-slate-200 font-semibold">{sh.quarter}</td>
                          <td className="py-2.5 text-right font-bold text-cyan-300 font-tabular">{sh.promoter_pct}%</td>
                          <td className="py-2.5 text-right text-emerald-400 font-tabular">{sh.fii_pct}%</td>
                          <td className="py-2.5 text-right text-amber-300 font-tabular">{sh.dii_pct}%</td>
                          <td className="py-2.5 text-right text-slate-400 font-tabular">{sh.public_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 7: Sector Peer Comparison Table */}
              <div id="sec-peers" className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <span>Sector Peer Comparison & Valuation Benchmarks</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="pb-2.5">Company Name</th>
                        <th className="pb-2.5 text-right">CMP (₹)</th>
                        <th className="pb-2.5 text-right">Market Cap (₹ Cr)</th>
                        <th className="pb-2.5 text-right">P/E</th>
                        <th className="pb-2.5 text-right">P/B</th>
                        <th className="pb-2.5 text-right">ROE (%)</th>
                        <th className="pb-2.5 text-right">ROCE (%)</th>
                        <th className="pb-2.5 text-right">OPM (%)</th>
                        <th className="pb-2.5 text-right">1Y Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {/* Current Company */}
                      <tr className="bg-cyan-950/20 font-bold text-cyan-300">
                        <td className="py-2.5">{data.company_name} (Current)</td>
                        <td className="py-2.5 text-right font-tabular">₹{data.essentials.current_price.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-tabular">₹{data.essentials.market_cap_cr.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 text-right font-tabular">{data.essentials.pe || "-"}x</td>
                        <td className="py-2.5 text-right font-tabular">{data.essentials.pb || "-"}x</td>
                        <td className="py-2.5 text-right font-tabular">{data.essentials.roe || "-"}%</td>
                        <td className="py-2.5 text-right font-tabular">{data.essentials.roce || "-"}%</td>
                        <td className="py-2.5 text-right font-tabular">22.4%</td>
                        <td className="py-2.5 text-right font-tabular text-emerald-400">+28.5%</td>
                      </tr>

                      {/* Peers */}
                      {data.peers.map((peer) => (
                        <tr
                          key={peer.ticker}
                          onClick={() => {
                            setTickerInput(peer.name);
                            loadCompanyData(peer.name);
                          }}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors text-slate-200"
                        >
                          <td className="py-2.5 flex items-center gap-1.5">
                            <span>{peer.name}</span>
                            <ArrowUpRight className="h-3 w-3 text-slate-500" />
                          </td>
                          <td className="py-2.5 text-right font-tabular">₹{peer.cmp.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-tabular text-slate-400">₹{peer.market_cap_cr.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 text-right font-tabular">{peer.pe ? `${peer.pe}x` : "-"}</td>
                          <td className="py-2.5 text-right font-tabular">{peer.pb ? `${peer.pb}x` : "-"}</td>
                          <td className="py-2.5 text-right font-tabular text-emerald-400">{peer.roe ? `${peer.roe}%` : "-"}</td>
                          <td className="py-2.5 text-right font-tabular text-emerald-400">{peer.roce ? `${peer.roce}%` : "-"}</td>
                          <td className="py-2.5 text-right font-tabular">{peer.opm_pct ? `${peer.opm_pct}%` : "-"}</td>
                          <td className={`py-2.5 text-right font-tabular ${(peer.return_1y || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {(peer.return_1y || 0) >= 0 ? `+${peer.return_1y}%` : `${peer.return_1y}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
