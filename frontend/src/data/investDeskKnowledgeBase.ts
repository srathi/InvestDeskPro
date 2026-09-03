// investDeskKnowledgeBase.ts - Comprehensive Financial Jargon Dictionary & Page Playbooks for InvestDeskPro
// Institutional Equity Research, DCF Valuation, Forensic Accounting & Mutual Fund Rolling Alpha Intelligence

export interface JargonTerm {
  term: string;
  acronym?: string;
  category: "Stock Diagnostic (DVM)" | "Valuation & DCF" | "Forensics & Safety" | "Mutual Funds & Alpha" | "Portfolio Math" | "Investment Strategies";
  short_def: string;
  formula?: string;
  importance: string;
  playbook: string;
  example?: string;
  thresholds?: {
    good: string;
    moderate: string;
    bad: string;
  };
}

export interface StrategyBlueprint {
  id: string;
  name: string;
  tagline: string;
  targetProfile: string;
  pillarRules: string[];
  riskReturnProfile: string;
  idealHoldingPeriod: string;
  exampleEquities: string[];
}

export interface PageGuideSection {
  heading: string;
  description?: string;
  bullets?: string[];
  tips?: string;
}

export interface PageGuide {
  title: string;
  summary: string;
  operationalBlueprint: string;
  sections: PageGuideSection[];
  example?: {
    title: string;
    text: string;
  };
}

export const UNIVERSAL_GLOSSARY: Record<string, JargonTerm> = {
  // ==========================================
  // 1. STOCK DIAGNOSTIC & DVM FACTOR ENGINE
  // ==========================================
  dvm: {
    term: "DVM Factor Scorecard (Durability • Valuation • Momentum)",
    acronym: "DVM",
    category: "Stock Diagnostic (DVM)",
    short_def: "An institutional multi-factor composite rating (0–100) evaluating a business across Durability (Quality), Valuation Attractiveness, and Price/Earnings Momentum.",
    formula: "DVM Score = (Durability × 40%) + (Valuation × 30%) + (Momentum × 30%)",
    importance: "Prevents common investor mistakes: buying cheap but deteriorating businesses (Value Traps) or buying high-quality businesses at bubble valuations.",
    playbook: "• High DVM (≥ 70): High-Conviction Quality Compounders.\n• High Durability + Low Valuation: Safe Value Opportunities.\n• Low Durability + High Momentum: Speculative momentum traps.\n• Low DVM (< 45): Caution/Avoid zone.",
    example: "TCS scoring Durability=92, Valuation=55, Momentum=68 achieves a Total DVM of 74 (High-Grade Compounder).",
    thresholds: {
      good: "Score ≥ 70 (Strong Compounder)",
      moderate: "Score 50–69 (Neutral / Average)",
      bad: "Score < 50 (Underperformer / Risk)"
    }
  },
  roce: {
    term: "Return on Capital Employed (ROCE)",
    acronym: "ROCE",
    category: "Stock Diagnostic (DVM)",
    short_def: "Measures how efficiently a company generates operating profits from all capital employed (Equity + Long-Term Debt).",
    formula: "ROCE (%) = [ EBIT / (Total Assets - Current Liabilities) ] × 100",
    importance: "Warren Buffett & Charlie Munger's favorite metric. Over the long run, a stock's annual return almost always converges to its business ROCE.",
    playbook: "• ROCE > 22%: Elite economic moat and pricing power.\n• ROCE 15–22%: Good sustainable business.\n• ROCE < 12%: Fails to beat the cost of capital (Value Destroyer).",
    example: "Page Industries or TCS generating 35%+ ROCE requires minimal incremental capital to grow earnings by 15% annually.",
    thresholds: {
      good: "> 20% (Elite Capital Efficiency)",
      moderate: "12% – 20% (Acceptable)",
      bad: "< 12% (Capital Destruction)"
    }
  },
  roe: {
    term: "Return on Equity (ROE)",
    acronym: "ROE",
    category: "Stock Diagnostic (DVM)",
    short_def: "Measures the net profitability generated strictly on shareholder equity capital.",
    formula: "ROE (%) = (Net Profit / Average Shareholder Equity) × 100",
    importance: "Shows how well management compounds shareholders' net book equity. Always cross-verify with Debt/Equity to ensure high ROE is not artificially inflated by debt leverage.",
    playbook: "Look for high ROE (> 18%) coupled with low Debt-to-Equity (< 0.5x). If ROE is 30% but Debt/Equity is 3.0x, the company carries high bankruptcy risk.",
    example: "Nestle India produces 80%+ ROE virtually debt-free through rapid inventory turnover and strong brand loyalty.",
    thresholds: {
      good: "> 18% with low leverage",
      moderate: "12% – 18%",
      bad: "< 10% (Sub-par return on equity)"
    }
  },
  dupont_roe: {
    term: "DuPont 3-Stage ROE Decomposition",
    acronym: "DuPont 3-Stage",
    category: "Stock Diagnostic (DVM)",
    short_def: "Deconstructs Return on Equity into three operational drivers: Net Profit Margin, Asset Turnover, and Financial Leverage.",
    formula: "ROE = Net Profit Margin (%) × Asset Turnover (x) × Equity Multiplier (x)",
    importance: "Exposes the exact engine of business growth: Operational Excellence (Margin Expansion), Capital Velocity (Asset Turnover), or Financial Engineering (Debt).",
    playbook: "• High Margin + High Turnover: Pure Compounder (Elite).\n• High Turnover + Low Margin: High volume retailer (e.g. DMart).\n• High Leverage + Low Margin: High-risk cyclical (Avoid).",
    example: "Company A with 20% ROE = 15% Margin × 1.1 Turnover × 1.2 Leverage (Healthy). Company B with 20% ROE = 3% Margin × 0.8 Turnover × 8.3 Leverage (Dangerous debt bomb).",
    thresholds: {
      good: "ROE driven by Margin & Turnover (Leverage < 2.0x)",
      moderate: "Leverage 2.0x – 3.5x",
      bad: "ROE solely driven by Leverage (> 4.0x)"
    }
  },
  piotroski_score: {
    term: "Piotroski F-Score",
    acronym: "Piotroski",
    category: "Stock Diagnostic (DVM)",
    short_def: "A 9-point fundamental scoring system developed by Stanford Prof. Joseph Piotroski assessing profitability, leverage, liquidity, and operational efficiency.",
    formula: "F-Score = Σ(9 Binary Fundamental Tests: ROA>0, CFO>0, ΔROA>0, CFO>NetProfit, ΔLeverage<0, ΔLiquidity>0, No Equity Dilution, ΔGrossMargin>0, ΔAssetTurnover>0)",
    importance: "Statistically proven to separate genuine value turnarounds from value traps and impending corporate failures.",
    playbook: "• Score 8–9: Pristine financial health (Strong Buy candidate).\n• Score 5–7: Stable / Neutral company.\n• Score 0–4: Weak fundamentals and deteriorating balance sheet (High Risk).",
    example: "A deep value stock with P/E of 8x and Piotroski Score of 8 is a high-probability value turnaround.",
    thresholds: {
      good: "8 – 9 (Pristine Health)",
      moderate: "5 – 7 (Stable)",
      bad: "0 – 4 (Deteriorating Fundamentals)"
    }
  },
  peg_ratio: {
    term: "PEG Ratio (Price/Earnings to Growth)",
    acronym: "PEG",
    category: "Stock Diagnostic (DVM)",
    short_def: "Standardizes the P/E valuation multiple against the company's expected earnings growth rate (Peter Lynch's primary metric).",
    formula: "PEG = Trailing P/E / Expected Earnings Growth Rate (%)",
    importance: "Helps investors evaluate whether a high P/E ratio is justified by extraordinary earnings growth.",
    playbook: "• PEG < 1.0: Undervalued relative to growth (Margin of Safety).\n• PEG 1.0–1.5: Fairly valued growth compounder.\n• PEG > 2.0: Expensive; high vulnerability to growth disappointments.",
    example: "A company trading at 30x P/E growing earnings at 30% has PEG = 1.0 (Fair Value). A company trading at 40x P/E growing at 10% has PEG = 4.0 (Overpriced).",
    thresholds: {
      good: "< 1.0 (Attractively Priced Growth)",
      moderate: "1.0 – 1.8 (Fair Value)",
      bad: "> 2.5 (Stretched Valuation)"
    }
  },
  pe_corridor: {
    term: "Historical P/E Valuation Bands Corridor (±1σ)",
    acronym: "P/E Bands",
    category: "Stock Diagnostic (DVM)",
    short_def: "Statistical valuation corridor plotting the historical P/E ratio alongside the 3Y/5Y Median P/E and ±1 Standard Deviation (σ) envelopes.",
    formula: "Bands = Median_PE ± 1.0 × StdDev(Historical_PE)",
    importance: "Reveals whether current valuation is statistically stretched (+1σ) or in a historical accumulation discount zone (-1σ).",
    playbook: "• Price touching -1σ Band: Historical bargain zone for quality stocks.\n• Price near Median: Fair value accumulation.\n• Price exceeding +1σ Band: Statistically overextended; trim or wait for pullbacks.",
    example: "If HDFC Bank trades at 18x P/E with a 5Y Median of 24x and -1σ at 19x, it is trading in a deep statistical discount zone.",
    thresholds: {
      good: "Trading below Median or near -1σ band",
      moderate: "Trading between Median and +0.5σ",
      bad: "Trading above +1.0σ (Historical Multiple Extreme)"
    }
  },
  dma_regime: {
    term: "50-Day & 200-Day DMA Moving Average Regime",
    acronym: "DMA Regime",
    category: "Stock Diagnostic (DVM)",
    short_def: "Institutional trend classification based on the relationship between daily price, 50 DMA (intermediate momentum), and 200 DMA (long-term structural trend).",
    formula: "Golden Cross: 50 DMA > 200 DMA (Bullish Regime) | Death Cross: 50 DMA < 200 DMA (Bearish Regime)",
    importance: "Institutions and mutual funds manage allocations around 200 DMA. Stocks trading above rising 200 DMA experience institutional inflows.",
    playbook: "• Price > 50 DMA > 200 DMA: Stage-2 Bullish Expansion (Optimal buy environment).\n• Pullback to 50 DMA in rising trend: Asymmetric swing entry.\n• Price < 200 DMA: Structural downtrend; avoid fresh long-term buys.",
    example: "Reliance breaking out with 50 DMA crossing above 200 DMA confirms a transition into an institutional markup regime.",
    thresholds: {
      good: "Price > 50 DMA > 200 DMA (Golden Regime)",
      moderate: "Price consolidating between 50 and 200 DMA",
      bad: "Price < 50 DMA < 200 DMA (Bearish Regime)"
    }
  },
  factor_trajectory: {
    term: "5-Year Factor Score Trajectory",
    acronym: "Factor 5Y",
    category: "Stock Diagnostic (DVM)",
    short_def: "Tracks the multi-year migration of a company's Quality, Valuation, and Momentum scores across 5 fiscal periods.",
    formula: "Trajectory = [ Score_Quality(t), Score_Valuation(t), Score_Momentum(t) ] for t in 1..5",
    importance: "Reveals whether a high composite score is improving sustainably or deteriorating from past peak glory.",
    playbook: "Look for stocks with rising Quality lines and stabilizing Valuation scores—classic hallmarks of durable compounders.",
    example: "A company whose Quality score expanded from 55 to 88 over 4 years while valuation normalized is entering prime institutional accumulation.",
    thresholds: {
      good: "Quality line upward trending (> 75)",
      moderate: "Stable scores across all 3 pillars",
      bad: "Sharp downward slope in Quality or Momentum"
    }
  },
  peer_quadrant: {
    term: "2D Peer Valuation vs. Quality Quadrant",
    acronym: "Peer Quadrant",
    category: "Stock Diagnostic (DVM)",
    short_def: "A 2D scatter matrix mapping companies against sector peers along Quality (X-axis) and Valuation Attractiveness (Y-axis).",
    formula: "Quadrant X = Quality / Durability (0-100), Quadrant Y = Valuation Discount (0-100)",
    importance: "Instantly categorizes sector peers into 4 distinct investment archetypes: Pure Compounders, Expensive Growth, Deep Value, and High Risk / Value Traps.",
    playbook: "• Top-Right (Compounders): High Quality + Fair/Cheap Valuation (Prime Buys).\n• Top-Left (Deep Value): Low Quality + Cheap Valuation (Tactical Turnarounds).\n• Bottom-Right (Expensive Growth): High Quality + Expensive (Wait for dips).\n• Bottom-Left (High Risk): Low Quality + Expensive (Avoid).",
    example: "Positioning TCS against Infosys, Wipro, and LTIMindtree reveals which IT bluechip offers the highest quality-per-rupee-spent.",
    thresholds: {
      good: "Compounder Zone (Top-Right)",
      moderate: "Expensive Growth (Bottom-Right)",
      bad: "High Risk / Trap (Bottom-Left)"
    }
  },

  // ==========================================
  // 2. INTRINSIC VALUATION & DCF SENSITIVITY
  // ==========================================
  dcf: {
    term: "Discounted Cash Flow (DCF Intrinsic Valuation)",
    acronym: "DCF",
    category: "Valuation & DCF",
    short_def: "The gold-standard fundamental valuation method estimating intrinsic business value based on the present value of all future Free Cash Flows discounted at WACC.",
    formula: "Enterprise Value = Σ [ FCF_t / (1 + WACC)^t ] + [ Terminal_Value / (1 + WACC)^N ]",
    importance: "Removes market sentiment and multiple hype by grounding valuation purely in cash-generative power.",
    playbook: "Compare current market price to DCF Fair Value. Only buy when there is a minimum 15%–25% Margin of Safety.",
    example: "If DCF models intrinsic value at ₹1,450 and current market price is ₹1,120, the stock offers a 22.8% Margin of Safety.",
    thresholds: {
      good: "Current Price < DCF Fair Value by ≥ 20% (Deep Discount)",
      moderate: "Current Price within ±10% of DCF Fair Value",
      bad: "Current Price > DCF Fair Value by > 30% (Severe Overvaluation)"
    }
  },
  wacc: {
    term: "Weighted Average Cost of Capital (WACC)",
    acronym: "WACC",
    category: "Valuation & DCF",
    short_def: "The overall required rate of return that a company must earn on its existing asset base to satisfy both equity holders and debt providers.",
    formula: "WACC = (E/V × Cost_of_Equity) + (D/V × Cost_of_Debt × (1 - Tax_Rate))",
    importance: "Acts as the hurdle rate in DCF models. Higher WACC discounts future cash flows heavier, lowering fair value.",
    playbook: "For Indian large-caps, standard WACC is typically 11.0%–12.5%. For volatile small-caps, WACC should be 13.5%–15.5% to account for risk premium.",
    example: "A debt-free Indian bluechip with beta=0.85 and 10Y G-Sec yield at 7.0% has a WACC near 11.5%.",
    thresholds: {
      good: "ROCE > WACC by at least 6% (Strong Value Creator)",
      moderate: "ROCE exceeds WACC by 1% – 5%",
      bad: "ROCE < WACC (Economic Value Destruction)"
    }
  },
  terminal_growth: {
    term: "Terminal Growth Rate (g)",
    acronym: "Terminal g",
    category: "Valuation & DCF",
    short_def: "The constant rate at which the company's free cash flow is assumed to compound forever after the detailed forecast period.",
    formula: "Terminal Value = [ FCF_{N+1} / (WACC - g) ]",
    importance: "Mathematically, a company cannot grow faster than the overall GDP of the country indefinitely. Setting g too high creates absurdly inflated valuations.",
    playbook: "In India, conservative terminal growth rates are 4.0%–6.0% (in line with long-term real GDP growth + inflation).",
    example: "Using g = 5.0% and WACC = 12.0%, the terminal capitalization multiple is 1 / (0.12 - 0.05) = 14.3x.",
    thresholds: {
      good: "Conservative assumption: 4.5% – 5.5%",
      moderate: "6.0%",
      bad: "> 6.5% (Unrealistic economic assumption)"
    }
  },
  margin_of_safety: {
    term: "Margin of Safety (MoS)",
    acronym: "MoS",
    category: "Valuation & DCF",
    short_def: "The discount percentage between the market price and the calculated intrinsic DCF fair value (Benjamin Graham's central investment rule).",
    formula: "Margin of Safety (%) = [ (DCF Fair Value - Current Market Price) / DCF Fair Value ] × 100",
    importance: "Protects investors against human estimation errors in future cash flows, competitive disruption, or macro shocks.",
    playbook: "• MoS ≥ 25%: High-conviction buying territory.\n• MoS 10%–24%: Accumulate on dips.\n• MoS < 0%: Overvalued; zero buffer for errors.",
    example: "Buying a stock at ₹750 with a DCF fair value of ₹1,000 gives you a 25% Margin of Safety.",
    thresholds: {
      good: "≥ 20% (Substantial Protection)",
      moderate: "5% – 19%",
      bad: "< 0% (Trading at Premium to Fair Value)"
    }
  },
  reverse_dcf: {
    term: "Reverse DCF Market Implied Growth Rate",
    acronym: "Reverse DCF",
    category: "Valuation & DCF",
    short_def: "Inverts the DCF formula to calculate what annual earnings growth rate the current stock market price is baking in.",
    formula: "Solve for g in: CMP = DCF(g_implied, WACC, Terminal_g)",
    importance: "Tells you if market expectations are realistic (e.g., pricing 12% growth for a steady company) or absurd (e.g., pricing 45% CAGR for 10 years).",
    playbook: "If market price implies 28% growth but company historical CAGR is 14%, stock is priced for perfection with massive downside risk.",
    example: "A consumer stock at 70x P/E implies 32% annual profit growth for 10 years straight.",
    thresholds: {
      good: "Implied Growth < Historical Realized CAGR (Low Bar)",
      moderate: "Implied Growth ≈ Historical CAGR",
      bad: "Implied Growth > 2.5x Historical CAGR (Priced for Perfection)"
    }
  },
  ev_ebitda: {
    term: "Enterprise Value to EBITDA (EV/EBITDA)",
    acronym: "EV/EBITDA",
    category: "Valuation & DCF",
    short_def: "Capital-structure-neutral valuation multiple comparing total enterprise value (Equity + Net Debt) to operating cash generation before non-cash depreciation.",
    formula: "EV/EBITDA = (Market Cap + Total Debt - Cash & Equivalents) / Operating Profit before D&A",
    importance: "Superior to P/E when evaluating capital-intensive businesses (Steel, Cement, Telecom) with heavy debt loads or large depreciation schedules.",
    playbook: "Compare EV/EBITDA against 5-year historical median and industry peers. Low EV/EBITDA with expanding margins signals an operational re-rating candidate.",
    example: "A manufacturing company with high debt may appear cheap on P/E (10x), but EV/EBITDA of 16x reveals true debt drag.",
    thresholds: {
      good: "< 10x with stable margins",
      moderate: "10x – 16x",
      bad: "> 22x (Rich valuation unless 25%+ growth)"
    }
  },

  // ==========================================
  // 3. FORENSIC ACCOUNTING & RED FLAGS
  // ==========================================
  beneish_m_score: {
    term: "Beneish M-Score (Earnings Manipulation Scanner)",
    acronym: "Beneish M-Score",
    category: "Forensics & Safety",
    short_def: "A mathematical model created by Prof. Messod Beneish using 8 financial statement ratios to detect if a company is cooking its books or manipulating earnings.",
    formula: "M-Score = -4.84 + 0.920×DSRI + 0.528×GMI + 0.404×AQI + 0.892×SGI + 0.115×DEPI - 0.172×SGAI + 4.037×TATA + 0.0327×LVGI",
    importance: "Famously flagged Enron and Satyam before their collapses. Uncovers aggressive revenue recognition, capitalized expenses, and asset inflation.",
    playbook: "• M-Score < -1.78: Unlikely Manipulator (Pristine accounting integrity ✅).\n• M-Score > -1.78: High Probability of Earnings Manipulation (Severe Red Flag ⚠️).",
    example: "If a company reports 25% profit growth but receivables surge 70% and CFO is negative, M-Score climbs to -1.20 (Red Flag).",
    thresholds: {
      good: "< -2.22 (Pristine Integrity)",
      moderate: "-2.22 to -1.78 (Standard)",
      bad: "> -1.78 (High Manipulation Risk ⚠️)"
    }
  },
  altman_z_score: {
    term: "Altman Z-Score (Bankruptcy & Solvency Predictor)",
    acronym: "Altman Z-Score",
    category: "Forensics & Safety",
    short_def: "A credit-strength metric developed by NYU Prof. Edward Altman that predicts corporate insolvency and distress within 2 years with 85%+ accuracy.",
    formula: "Z-Score = 1.2×(Working Cap/Assets) + 1.4×(Retained Earnings/Assets) + 3.3×(EBIT/Assets) + 0.6×(Market Cap/Total Debt) + 0.999×(Sales/Assets)",
    importance: "Protects investors from catastrophic permanent capital loss by auditing balance sheet liquidity and leverage safety.",
    playbook: "• Z-Score > 2.99: Safe Zone (Financially Robust 🛡️).\n• Z-Score 1.81–2.99: Grey Zone (Moderate risk; monitor debt maturities).\n• Z-Score < 1.81: Distress Zone (High probability of default/restructuring ❌).",
    example: "Tata Motors during heavy JLR capex dropped to 1.65 (Distress), then recovered to 3.20 as debt was paid down.",
    thresholds: {
      good: "> 2.99 (Safe Zone 🛡️)",
      moderate: "1.81 – 2.99 (Grey Zone ⚠️)",
      bad: "< 1.81 (Distress Zone ❌)"
    }
  },
  promoter_pledging: {
    term: "Promoter Share Pledging (%)",
    acronym: "Pledge %",
    category: "Forensics & Safety",
    short_def: "The percentage of promoter-held equity pledged as collateral to banks/NBFCs to raise loans for promoter entities.",
    formula: "Pledge (%) = (Pledged Shares / Total Promoter Shares) × 100",
    importance: "If stock price drops, lenders trigger margin calls. If promoters cannot provide cash, lenders dump pledged shares into open market, causing death spirals.",
    playbook: "• Pledge = 0.0%: Ideal.\n• Pledge < 10%: Acceptable.\n• Pledge > 20%: High Risk; avoid leveraged promoter companies.",
    example: "Zee Entertainment (ZEEL) collapsed in 2019 after lenders liquidated promoter pledged holdings following margin call defaults.",
    thresholds: {
      good: "0.0% (Zero Pledged Shares)",
      moderate: "0.1% – 10.0%",
      bad: "> 15.0% (Margin Call Danger Zone)"
    }
  },
  ocf_pat_ratio: {
    term: "Operating Cash Flow to Net Profit Ratio (OCF / PAT)",
    acronym: "OCF / PAT",
    category: "Forensics & Safety",
    short_def: "Compares cash generated from actual business operations to reported accounting net profit.",
    formula: "Cash Conversion Ratio = Operating Cash Flow (CFO) / Profit After Tax (PAT)",
    importance: "Profit is an accounting opinion; cash in the bank is a reality. A company with high profits but zero cash flow is accumulating uncollected debt.",
    playbook: "• OCF/PAT ≥ 1.0: Real, high-quality cash earnings (Elite).\n• OCF/PAT 0.70–0.99: Acceptable standard working capital cycle.\n• OCF/PAT < 0.60 for multiple years: Aggressive revenue accruals or uncollectible inventory.",
    example: "Infosys consistently converts 90%–105% of its net profit into hard operating cash flow every year.",
    thresholds: {
      good: "≥ 0.90x (High Cash Conversion)",
      moderate: "0.65x – 0.89x",
      bad: "< 0.60x (Low Earnings Quality)"
    }
  },

  // ==========================================
  // 4. MUTUAL FUND ROLLING ALPHA & FORM
  // ==========================================
  powerup_form_rating: {
    term: "PowerUp Mutual Fund Form Rating",
    acronym: "PowerUp Form",
    category: "Mutual Funds & Alpha",
    short_def: "An algorithmic momentum and form classification for active mutual funds based on rolling alpha persistence and downside protection.",
    formula: "Form = f(Rolling_Alpha_3Y, Downside_Capture_Ratio, Consistency_Index, Recent_Quarter_Momentum)",
    importance: "Prevents investors from buying past 1-year top performers who are currently losing their alpha generation edge.",
    playbook: "• In-Form 🔥: Active outperformance engine firing on all cylinders (Top SIP pick).\n• On-Track ✅: Consistently beating category benchmark with steady risk.\n• Off-Track ⚠️: Alpha fading or manager drift; pause fresh lump-sum.\n• Out-of-Form ❌: Consistent underperformance; consider switching to category peer.",
    example: "Parag Parikh Flexi Cap maintaining 6.8% active alpha with 68% downside capture is rated 'In-Form 🔥'.",
    thresholds: {
      good: "In-Form 🔥 / On-Track ✅",
      moderate: "Off-Track ⚠️ (Review SIP)",
      bad: "Out-of-Form ❌ (Switch Candidate)"
    }
  },
  rolling_returns: {
    term: "Rolling Returns (vs Point-to-Point)",
    acronym: "Rolling Alpha",
    category: "Mutual Funds & Alpha",
    short_def: "Returns calculated across rolling continuous intervals (e.g. 1Y, 3Y, 5Y windows every day) across the entire multi-year history of the fund.",
    formula: "Rolling_Return_3Y(t) = [ (NAV_t / NAV_{t - 756_days})^(1/3) - 1 ] × 100",
    importance: "Eliminates endpoint bias and entry-date luck. Shows what return an investor would have earned regardless of which day they invested.",
    playbook: "Look for funds where > 80% of 3-year rolling periods delivered > 12% CAGR, and 0% of 5-year rolling periods were negative.",
    example: "A fund with 15% 1-year trailing return might have negative rolling returns in 30% of periods. Rolling distributions reveal true consistency.",
    thresholds: {
      good: "P(Negative Return) = 0% over 5Y; Mean Alpha > +3.0%",
      moderate: "Mean Alpha 0% – 2.5%",
      bad: "Mean Alpha < 0% (Fails to beat index)"
    }
  },
  downside_capture: {
    term: "Downside Capture Ratio (DCR)",
    acronym: "DCR",
    category: "Mutual Funds & Alpha",
    short_def: "Measures what percentage of the benchmark index's losses the mutual fund captures during months when the benchmark declines.",
    formula: "Downside Capture (%) = [ Fund Return during Down Markets / Benchmark Return during Down Markets ] × 100",
    importance: "The single most critical metric for long-term compounding. If a fund captures only 70% of index drops, it requires far less gain to hit new all-time highs.",
    playbook: "• DCR < 75%: Elite defensive cushion (Compounding champion).\n• DCR 75%–90%: Good downside protection.\n• DCR > 105%: Fund falls harder than the index (High volatility; requires extreme bull market to recover).",
    example: "When Nifty drops -10%, a fund with DCR = 65% only falls -6.5%, giving investors significant capital preservation.",
    thresholds: {
      good: "< 75% (Elite Capital Protection)",
      moderate: "75% – 90%",
      bad: "> 100% (Amplifies Market Crashes)"
    }
  },
  calmar_ratio: {
    term: "Calmar Ratio (Risk-Adjusted Compounding)",
    acronym: "Calmar",
    category: "Mutual Funds & Alpha",
    short_def: "Measures annualized return generated per unit of historical Maximum Drawdown over a 3-year lookback period.",
    formula: "Calmar Ratio = 3-Year Annualized Return (CAGR) / Absolute Maximum Peak-to-Trough Drawdown (%)",
    importance: "Superior to Sharpe Ratio when assessing whether a fund or strategy generates high returns without subjecting investors to sickening drawdown pain.",
    playbook: "• Calmar > 1.2: Excellent risk-adjusted compounding.\n• Calmar 0.7–1.2: Standard acceptable equity risk.\n• Calmar < 0.4: Fund took massive drawdowns for mediocre returns.",
    example: "Fund A with 18% CAGR and 12% Max Drawdown has Calmar = 1.50 (Smooth compounding). Fund B with 18% CAGR and 36% Drawdown has Calmar = 0.50.",
    thresholds: {
      good: "> 1.0 (Superior Resilience)",
      moderate: "0.6 – 1.0",
      bad: "< 0.5 (Severe Drawdown Drag)"
    }
  },
  underwater_drawdown: {
    term: "Underwater Drawdown & Recovery Cycle",
    acronym: "Drawdown",
    category: "Mutual Funds & Alpha",
    short_def: "Visualizes the percentage decline from the previous all-time peak NAV to the lowest trough, and the duration required to recover to break-even.",
    formula: "Drawdown_t (%) = [ (NAV_t - Peak_NAV_prior) / Peak_NAV_prior ] × 100",
    importance: "Measures emotional staying power. 90% of retail investors panic-sell during prolonged drawdowns (> 18 months). Fast recovery funds keep investors invested.",
    playbook: "Examine maximum drawdown during major market crises (2020 COVID, 2022 Fed rate hikes). Prioritize funds that recovered to new ATH in under 6 months.",
    example: "A quality fund with -14% Max Drawdown during a -25% market crash recovered to new highs in 4 months.",
    thresholds: {
      good: "Max Drawdown < 18% (Fast Recovery)",
      moderate: "Max Drawdown 18% – 28%",
      bad: "Max Drawdown > 35% (Deep Capital Impairment)"
    }
  },

  // ==========================================
  // 5. RISK-PARITY & PORTFOLIO MATHEMATICS
  // ==========================================
  erc: {
    term: "Equal Risk Contribution (Risk-Parity ERC)",
    acronym: "ERC",
    category: "Portfolio Math",
    short_def: "An advanced portfolio construction framework where capital is weighted so that every asset contributes exactly the same marginal percentage of total portfolio risk.",
    formula: "Target: RC_i = w_i × (Σ w)_i / σ_p = (1 / N) × σ_p  for all assets i",
    importance: "Solves the traditional 60/40 failure where equities contribute 90% of portfolio risk. Creates all-weather resilience across bull, bear, and inflationary cycles.",
    playbook: "Low-volatility defensive assets receive higher capital weights, while volatile assets receive smaller weights, maximizing risk-adjusted Sharpe.",
    example: "In a 4-asset basket (Gold, Large-Cap, Debt, Mid-Cap), ERC assigns weights (35%, 25%, 30%, 10%) so each contributes exactly 25% of total portfolio variance.",
    thresholds: {
      good: "Equalized Risk Contribution (Balanced)",
      moderate: "Inverse Volatility approximation",
      bad: "Single asset contributing > 60% of total risk"
    }
  },
  volatility_drag: {
    term: "Volatility Drag (Geometric Decay)",
    acronym: "Vol Drag",
    category: "Portfolio Math",
    short_def: "The mathematical penalty that volatility imposes on compound geometric growth compared to simple arithmetic average returns.",
    formula: "Geometric Return ≈ Arithmetic Return - (Variance / 2) = r - (σ^2 / 2)",
    importance: "A portfolio that gains 50% and loses 50% ends with -25% total capital. Minimizing portfolio volatility directly boosts compounded wealth over 20 years.",
    playbook: "By combining uncorrelated assets with Risk-Parity, you compress portfolio σ, reducing volatility drag and accelerating geometric compounding.",
    example: "A fund with 20% average return and 30% volatility yields geometric CAGR of 15.5%. A portfolio with 18% return and 10% volatility yields geometric CAGR of 17.5%.",
    thresholds: {
      good: "Vol Drag < 1.0% (Smooth Compounding)",
      moderate: "Vol Drag 1.0% – 2.5%",
      bad: "Vol Drag > 4.0% (Severe Geometric Wealth Decay)"
    }
  },
  diversification_ratio: {
    term: "Diversification Ratio (DR)",
    acronym: "DR",
    category: "Portfolio Math",
    short_def: "The ratio of the weighted average asset volatilities to the total diversified portfolio volatility.",
    formula: "Diversification Ratio = [ Σ (w_i × σ_i) ] / σ_portfolio",
    importance: "Measures the 'free lunch' of diversification. A higher ratio indicates that non-correlated assets are effectively canceling each other's downside shocks.",
    playbook: "• DR > 1.4: Excellent non-correlated diversification.\n• DR 1.1–1.3: Moderate diversification.\n• DR ≈ 1.0: Zero diversification benefit (all assets move together).",
    example: "Combining Gold and Indian Equities produces a DR of 1.45, reducing overall basket drawdown by 35% compared to holding either asset alone.",
    thresholds: {
      good: "> 1.35 (Strong Non-Correlated Benefit)",
      moderate: "1.15 – 1.35",
      bad: "< 1.10 (Poor Diversification)"
    }
  },

  // ==========================================
  // 6. INSTITUTIONAL INVESTMENT STRATEGIES
  // ==========================================
  high_growth_compounder: {
    term: "High-Growth Compounder Strategy",
    acronym: "Compounder",
    category: "Investment Strategies",
    short_def: "Identifies dominant market leaders with massive pricing power, ROCE > 22%, 3Y Sales CAGR > 15%, and virtually zero debt (Debt/Equity < 0.3x).",
    formula: "Filters: ROCE ≥ 22% AND Sales_CAGR_3Y ≥ 15% AND D/E ≤ 0.3x AND OCF/PAT ≥ 0.85x",
    importance: "The core wealth-creation strategy of Warren Buffett and Saurabh Mukherjea (Coffee Can Investing). Delivers compounding independent of macro cycles.",
    playbook: "Buy on 10%–15% market pullbacks; hold for 5–10 years without trying to time short-term cyclical peaks.",
    example: "Titan, Astral Pipes, Page Industries, and TCS historically compounded capital at 20%+ CAGR for decades.",
    thresholds: {
      good: "ROCE > 25%, Sales CAGR > 18%, D/E < 0.1x",
      moderate: "ROCE 18%–22%, Sales CAGR 12%–15%",
      bad: "ROCE < 15% or Debt > 0.8x"
    }
  },
  deep_value_moat: {
    term: "Deep Value & Margin of Safety Strategy",
    acronym: "Deep Value",
    category: "Investment Strategies",
    short_def: "Screens for fundamentally sound, cash-generating companies trading at steep historical discounts (P/E < 18x, PEG < 1.0, Piotroski Score ≥ 7).",
    formula: "Filters: P/E ≤ 18x AND PEG ≤ 1.0 AND Piotroski_Score ≥ 7 AND MoS ≥ 20%",
    importance: "Minimizes permanent loss of capital by demanding a large discount buffer before entry (Benjamin Graham methodology).",
    playbook: "Accumulate when market pessimism is peak; re-rate to fair value typically delivers 30%–60% asymmetric upside in 18–24 months.",
    example: "Buying Coal India or PSU Banks when trading at 6x P/E with 8%+ dividend yield and rising cash flows.",
    thresholds: {
      good: "P/E < 12x, PEG < 0.8, Piotroski 8-9",
      moderate: "P/E 12x–18x, PEG 0.8–1.2",
      bad: "P/E > 25x or Piotroski < 5"
    }
  },
  debt_free_roce: {
    term: "Debt-Free High ROCE Cash Generator Strategy",
    acronym: "Cash Generator",
    category: "Investment Strategies",
    short_def: "Focuses exclusively on zero-debt companies converting >90% of profits into hard operating cash flow with ROCE > 25%.",
    formula: "Filters: Total Debt / Equity ≤ 0.1x AND ROCE ≥ 25% AND CFO / PAT ≥ 0.90x",
    importance: "Impervious to interest rate hikes and banking credit freezes. Can fund high-ROE expansion entirely from internal accruals.",
    playbook: "Perfect defensive core allocation during tightening monetary policies and volatile market environments.",
    example: "Infosys, TCS, Divi's Labs, and Supreme Industries.",
    thresholds: {
      good: "Debt = ₹0, ROCE > 30%, OCF/PAT > 1.0x",
      moderate: "D/E < 0.2x, ROCE 20%–25%",
      bad: "D/E > 0.5x"
    }
  },
  dividend_aristocrats: {
    term: "Dividend Aristocrats & Cash Moat Strategy",
    acronym: "Dividend Moat",
    category: "Investment Strategies",
    short_def: "Companies with consistent 5+ year dividend payout histories, dividend yield > 2.0%, and strong balance sheet cash reserves.",
    formula: "Filters: Dividend Yield ≥ 2.0% AND Payout Ratio 30%–65% AND Debt/Equity ≤ 0.5x",
    importance: "Provides inflation-beating passive cash flow with downside protection, as dividend yield acts as a hard valuation floor.",
    playbook: "Reinvest dividend cash flows during market corrections to accelerate geometric compounding.",
    example: "ITC, Power Grid, Sanofi India, and TCS.",
    thresholds: {
      good: "Div Yield > 3.0% with growing earnings",
      moderate: "Div Yield 1.5% – 3.0%",
      bad: "Payout > 90% (Unsustainable dividend)"
    }
  },
  momentum_multibaggers: {
    term: "Momentum Multibagger Breakout Strategy",
    acronym: "Momentum",
    category: "Investment Strategies",
    short_def: "Identifies Stage-2 growth breakouts with rising 1-Year relative price strength (>50%), 50 DMA above 200 DMA, and institutional volume buildup.",
    formula: "Filters: 1Y Price Return ≥ 50% AND Price > 50 DMA > 200 DMA AND Volatility < 40%",
    importance: "Captures rapid institutional markup phases in high-velocity sectors and market leadership themes.",
    playbook: "Enter on 20/50 DMA pullbacks with trailing stop-loss below 50 DMA to let winners run while cutting laggards.",
    example: "Trent or Bharat Electronics breaking out of multi-month base consolidation with 2x volume.",
    thresholds: {
      good: "1Y Return > 60%, 50 DMA > 200 DMA (Expansion)",
      moderate: "1Y Return 25% – 50%",
      bad: "Price < 200 DMA (Downtrend)"
    }
  },
  rolling_alpha_sip: {
    term: "Rolling Alpha SIP Compounding Strategy",
    acronym: "Alpha SIP",
    category: "Investment Strategies",
    short_def: "Systematic investment in 'In-Form 🔥' mutual funds exhibiting >80% Rolling Alpha hit rate and Downside Capture < 75%.",
    formula: "Filters: PowerUp Form = In-Form AND Downside Capture ≤ 75% AND 5Y P(Neg) = 0.0%",
    importance: "Automates wealth creation while guaranteeing that money flows only into managers with persistent risk-adjusted alpha.",
    playbook: "Set up monthly SIP; review PowerUp Form rating once a year; only switch if fund status drops to 'Out-of-Form ❌' for 2 consecutive quarters.",
    example: "Parag Parikh Flexi Cap Fund SIP delivering 18%+ CAGR across 10 years by avoiding severe crash drawdowns.",
    thresholds: {
      good: "In-Form 🔥 with DCR < 75%",
      moderate: "On-Track ✅",
      bad: "Out-of-Form ❌"
    }
  },
  risk_parity_all_weather: {
    term: "All-Weather Risk-Parity Allocation Strategy",
    acronym: "All-Weather",
    category: "Investment Strategies",
    short_def: "Equal Risk Contribution (ERC) allocation across Indian Equities, US Tech, Gold ETF, and Government Sovereign Bonds.",
    formula: "Weights: Inverse Variance / Equal Marginal Risk Contribution (RC_i = 1/N × σ_p)",
    importance: "Survives all 4 economic seasons: Growth, Recession, Inflation, and Deflation with smooth upward equity curves.",
    playbook: "Rebalance semi-annually when asset weights deviate by ±5% to harvest the volatility rebalancing premium.",
    example: "Ray Dalio All-Weather portfolio tailored to Indian markets (Equities 35%, Gold 25%, Long Debt 30%, Dynamic Cash 10%).",
    thresholds: {
      good: "Sharpe > 1.2, Max Drawdown < 10%",
      moderate: "Sharpe 0.8 – 1.2",
      bad: "Drawdown > 20%"
    }
  }
};

export const STRATEGY_BLUEPRINTS: StrategyBlueprint[] = [
  {
    id: "high_growth_compounder",
    name: "High-Growth Compounder Strategy",
    tagline: "Warren Buffett & Coffee Can Moat Leaders",
    targetProfile: "Long-term wealth builders seeking 18%–25% annual compounded returns without taking balance-sheet leverage risks.",
    pillarRules: [
      "ROCE > 22% & ROE > 18% consistently for 5+ years",
      "Debt to Equity < 0.3x (Prudently financed growth)",
      "3-Year Revenue & Net Profit CAGR > 15%",
      "Operating Cash Flow conversion (OCF / PAT) > 0.85x"
    ],
    riskReturnProfile: "Moderate Risk / High Compounding Return (Alpha)",
    idealHoldingPeriod: "5 – 10 Years (Minimum 3 Years)",
    exampleEquities: ["TCS", "TITAN", "ASTRAL", "PAGEIND", "PIDILITIND"]
  },
  {
    id: "deep_value_moat",
    name: "Deep Value & Margin of Safety Strategy",
    tagline: "Benjamin Graham Intrinsic Value Bargains",
    targetProfile: "Value investors seeking asymmetric 30%–60% upside from multiple expansion with severe downside protection.",
    pillarRules: [
      "Trailing P/E < 18x or EV/EBITDA < 9x",
      "PEG Ratio < 1.0 (Attractively priced growth)",
      "Piotroski F-Score >= 7 (Confirmed balance-sheet health)",
      "DCF Margin of Safety >= 20% discount to fair value"
    ],
    riskReturnProfile: "Low-to-Moderate Risk / High Asymmetric Upside",
    idealHoldingPeriod: "18 – 36 Months (Until multiple re-rates)",
    exampleEquities: ["COALINDIA", "ITC", "HDFCBANK", "IOC", "BANKBARODA"]
  },
  {
    id: "debt_free_roce",
    name: "Debt-Free High ROCE Cash Generator",
    tagline: "Zero-Debt Cash Machines",
    targetProfile: "Defensive investors demanding supreme capital safety, zero bankruptcy risk, and high dividend yields.",
    pillarRules: [
      "Total Debt / Equity <= 0.1x (Virtually debt-free)",
      "ROCE >= 25% (Super-normal capital efficiency)",
      "Free Cash Flow positive in 5 out of 5 years",
      "Promoter Pledging = 0.0%"
    ],
    riskReturnProfile: "Low Risk / Steady High Quality Alpha",
    idealHoldingPeriod: "3 – 7 Years",
    exampleEquities: ["INFY", "TCS", "DIVISLAB", "SUPREMEIND", "LALPATHLAB"]
  },
  {
    id: "momentum_multibaggers",
    name: "Momentum Multibagger Breakout Strategy",
    tagline: "Stage-2 Trend & Institutional Flow Expansion",
    targetProfile: "Growth and swing investors seeking to capture explosive multi-quarter markup rallies in market-leading themes.",
    pillarRules: [
      "1-Year Relative Price Return >= 40%",
      "Stock Price > 50 DMA > 200 DMA (Golden Regime)",
      "Institutional shareholding (DII + FII) increasing over 2 quarters",
      "60-day realized volatility < 40%"
    ],
    riskReturnProfile: "Higher Volatility / Maximum Velocity Returns",
    idealHoldingPeriod: "6 – 18 Months (Trend following)",
    exampleEquities: ["TRENT", "BEL", "PICCADIL", "HAL", "COCHINSHIP"]
  },
  {
    id: "rolling_alpha_sip",
    name: "Rolling Alpha Mutual Fund SIP Strategy",
    tagline: "Automated Wealth Machine with Downside Shield",
    targetProfile: "Salaried and systematic investors compounding monthly savings into top-decile active mutual funds.",
    pillarRules: [
      "PowerUp Form Status: 'In-Form 🔥' or 'On-Track ✅'",
      "Downside Capture Ratio (DCR) < 75% (Superior crash protection)",
      "3-Year Mean Rolling Alpha > +3.0% over Nifty 500 benchmark",
      "5-Year Probability of Negative Return = 0.0%"
    ],
    riskReturnProfile: "Calibrated Equity Risk / Optimal Compounding",
    idealHoldingPeriod: "5 – 20 Years (SIP Mode)",
    exampleEquities: ["Parag Parikh Flexi Cap", "Nippon Small Cap", "Mirae Large Cap", "HDFC Flexi Cap"]
  }
];

export const PAGE_GUIDES: Record<string, PageGuide> = {
  // ==========================================
  // 1. QUANT DESK: 0-100 STOCK DIAGNOSTIC
  // ==========================================
  quant_stocks: {
    title: "0–100 Stock Diagnostic & Multi-Factor Scorecard",
    summary: "Institutional multi-factor equity audit engine integrating Trendlyne DVM, Simply Wall St 6-Axis Radar, DuPont 3-Stage decomposition, Piotroski health, and P/E valuation bands.",
    operationalBlueprint: "Evaluates companies across Durability (Quality 40 pts), Valuation (30 pts), and Momentum (30 pts) to filter compounders from value traps.",
    sections: [
      {
        heading: "1. The 0–100 Composite Score & DVM Breakdown",
        description: "The top gauge synthesizes 18 fundamental metrics into a clean 0–100 rating:",
        bullets: [
          "Durability / Quality (40 pts): ROCE/ROE consistency, Debt-to-Equity safety, and operating cash conversion.",
          "Valuation (30 pts): Historical P/E percentiles, PEG ratio, and Price-to-Book margin of safety.",
          "Financial Trend & Momentum (30 pts): 6M/1Y relative price strength, volume expansion, and 60-day realized volatility."
        ],
        tips: "Stocks scoring ≥ 70 with Durability ≥ 28 are institutional-grade compounders."
      },
      {
        heading: "2. 6-Axis Factor Radar & Forensic Red Flags",
        description: "Audits business health across 6 independent pillars (ROCE/ROE, Solvency, PEG & Value, Relative Valuation, Momentum, and Forensic Integrity).",
        bullets: [
          "Promoter Pledging > 15%: High margin call liquidation risk.",
          "Operating Cash Flow < Net Profit (OCF/PAT < 0.6x): Warning for aggressive revenue accruals.",
          "Piotroski Score ≥ 7: Confirms solid balance sheet and operational efficiency."
        ],
        tips: "Always check the Forensic Warnings card before committing capital."
      },
      {
        heading: "3. 5-in-1 Quantitative Factor Intelligence Suite",
        description: "The bottom interactive container provides 5 deep quantitative lenses:",
        bullets: [
          "Factor Trajectory (5Y): Multi-year migration of Quality, Valuation, and Momentum scores.",
          "Peer Quadrant: 2D scatter matrix positioning the stock against industry peers in 4 distinct zones.",
          "P/E Valuation Bands & DMAs: Historical ±1σ P/E corridor and 50/200 DMA Golden/Death cross regimes.",
          "DuPont 3-Stage ROE: Breaks down ROE into Margin % × Asset Turnover × Leverage Multiplier.",
          "Rolling Active Alpha: Excess return over Nifty 50 and peak-to-trough underwater drawdown profile."
        ],
        tips: "Use DuPont ROE to verify that high returns on equity are powered by profit margins rather than dangerous balance-sheet debt leverage."
      }
    ],
    example: {
      title: "Diagnostic Walkthrough: TCS (Tata Consultancy Services)",
      text: "TCS scores 82/100 (High-Grade Compounder). Durability is 36/40 driven by zero debt and 48% ROCE. Valuation is 18/30 (fairly priced). DuPont analysis shows ROE is 90% driven by pure net margins (24%) and rapid asset turnover (1.8x) with zero debt leverage."
    }
  },

  // ==========================================
  // 2. QUANT DESK: AMFI FUND ROLLING ALPHA
  // ==========================================
  quant_funds: {
    title: "AMFI Mutual Fund Rolling Alpha & PowerUp Analytics",
    summary: "Institutional mutual fund diagnostic platform evaluating funds across multi-year Rolling Alpha distributions, PowerUp Form ratings, Downside Capture (DCR), and 5-Pillar Scorecards.",
    operationalBlueprint: "Replaces misleading point-to-point trailing returns with continuous rolling distributions across ~40,000+ AMFI mutual fund schemes.",
    sections: [
      {
        heading: "1. PowerUp Form Rating Engine",
        description: "Classifies fund momentum and manager alpha consistency into 4 institutional form states:",
        bullets: [
          "In-Form 🔥: Active outperformance engine firing across 1Y, 3Y, and 5Y horizons (Top SIP choice).",
          "On-Track ✅: Consistently beating category benchmark with controlled volatility.",
          "Off-Track ⚠️: Alpha fading or style drift; pause fresh lump-sum allocations.",
          "Out-of-Form ❌: Persistent underperformance; evaluate switching to suggested benchmark peers."
        ],
        tips: "Never buy a mutual fund based purely on 1-year trailing return; check its PowerUp Form rating first."
      },
      {
        heading: "2. 5-Pillar Holistic Scorecard & Downside Capture (DCR)",
        description: "Audits the fund across Alpha Generation (25), Downside Protection (25), Consistency (20), Rolling Alpha Hit Rate (15), and Risk Efficiency (15).",
        bullets: [
          "Downside Capture Ratio (DCR < 80%): Crucial metric indicating the fund shields capital during market crashes.",
          "Calmar Ratio > 1.0: Excellent risk-adjusted returns relative to maximum drawdown pain.",
          "Rolling Alpha Hit Rate > 75%: High probability of outperforming the benchmark index."
        ],
        tips: "Funds with DCR < 75% compound wealth dramatically faster over 10+ years."
      },
      {
        heading: "3. Rolling Return Distribution Matrix",
        description: "Simulates thousands of historical entry points across 1Y, 3Y, and 5Y rolling investment horizons to compute the probability of earning > 12% CAGR vs. probability of negative returns.",
        bullets: [
          "5-Year P(Negative Return) = 0%: Demonstrates zero long-term loss history.",
          "P(Return > 15% CAGR): Highlights the fund's upper wealth-multiplier potential."
        ]
      }
    ],
    example: {
      title: "Fund Analysis Walkthrough: Parag Parikh Flexi Cap Fund",
      text: "Scheme #122639 achieves an AAA rating (91/100) and 'In-Form 🔥' status. 3-Year Mean Rolling Alpha is +6.8% over Nifty 500 with Downside Capture of 68.4%. Over 5-year rolling windows, probability of negative return is 0.0%, and 86% of periods generated > 15% CAGR."
    }
  },

  // ==========================================
  // 3. QUANT DESK: RISK-PARITY OPTIMIZER
  // ==========================================
  quant_portfolio: {
    title: "Risk-Parity Portfolio Optimizer (ERC)",
    summary: "Mathematical portfolio allocation engine utilizing Equal Risk Contribution (ERC), Inverse Volatility, and Mean-Variance Efficient Frontier models.",
    operationalBlueprint: "Equalizes the marginal risk contribution of each asset in the basket to eliminate concentration risk and minimize volatility drag.",
    sections: [
      {
        heading: "1. Equal Risk Contribution (ERC) vs Standard Market Cap Weighting",
        description: "Traditional portfolios are dangerously concentrated in high-volatility equities. ERC allocates capital inversely to risk:",
        bullets: [
          "Equal Risk Contribution: Ensures every asset accounts for exactly (1/N) of total portfolio volatility.",
          "Volatility Drag Compression: Lowers geometric decay (r - σ²/2), boosting 20-year compounded wealth.",
          "Diversification Ratio: Quantifies the non-correlation benefit of holding diversified asset classes."
        ],
        tips: "Rebalance Risk-Parity weights whenever drift exceeds ±5%."
      }
    ]
  },

  // ==========================================
  // 4. COMPANY 360 & DCF VALUATION
  // ==========================================
  company360: {
    title: "Company 360 & DCF Valuation Intelligence",
    summary: "Comprehensive fundamental equity research suite featuring multi-year financial statements, DCF Intrinsic Valuation matrices, Forensic Accounting scanners, and 3Y Forward Estimates.",
    operationalBlueprint: "Performs end-to-end institutional due diligence: Income Statement, Balance Sheet, Cash Flow, DCF sensitivity, and red flag audits.",
    sections: [
      {
        heading: "1. DCF Valuation & Sensitivity Matrix",
        description: "Projects 10-year Free Cash Flows discounted at WACC to calculate intrinsic per-share value.",
        bullets: [
          "Interactive WACC & Terminal Growth Matrix: Inspects fair value across 25 dynamic interest rate and growth scenarios.",
          "Margin of Safety: Identifies immediate discount or premium relative to current trading price."
        ],
        tips: "Look for stocks with ≥ 20% Margin of Safety under conservative WACC (12%) and Terminal Growth (5%)."
      },
      {
        heading: "2. Forensic Accounting Scanner (Beneish & Altman)",
        description: "Automated screening for financial statement manipulation and bankruptcy risk:",
        bullets: [
          "Beneish M-Score (Cutoff -1.78): Detects aggressive accounting and earnings inflation.",
          "Altman Z-Score (> 2.99 Safe): Audits 2-year balance sheet solvency and default probability.",
          "Contingent Liabilities & Promoter Pledging: Surfaces off-balance sheet landmines."
        ]
      },
      {
        heading: "3. 3-Year Forward Growth & Historical Multiples",
        description: "Consensus and trend-based 3Y forward revenue and EPS CAGR estimates paired with historical 10-year P/E, P/B, and EV/EBITDA valuation cycles."
      }
    ]
  },

  // ==========================================
  // 5. STOCK SCREENER
  // ==========================================
  screener: {
    title: "Institutional Multi-Factor Stock Screener",
    summary: "Screen across 2,000+ NSE/BSE listed equities using institutional filters across Quality, Valuation, Debt Safety, and Forward Growth.",
    operationalBlueprint: "Quick-launch preset screens or customize multi-variable filters to uncover undervalued compounders.",
    sections: [
      {
        heading: "1. Preset Strategy Screeners",
        bullets: [
          "High-Growth Compounders: High ROCE (> 20%), 3Y Sales CAGR > 15%, Debt/Equity < 0.5x.",
          "Undervalued Value Bargains: Low P/E (< 18x), PEG < 1.0, Piotroski Score ≥ 7.",
          "Debt-Free Cash Generators: Zero Debt, OCF/PAT > 0.9x, Dividend Yield > 2%."
        ]
      }
    ]
  }
};
