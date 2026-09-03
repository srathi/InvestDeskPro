# InvestDeskPro 📈

**InvestDeskPro** is an institutional-grade quantitative equity research terminal, forensic diagnostic engine, and multi-asset portfolio stress-testing platform engineered specifically for the **Indian Capital Markets (NSE/BSE & AMFI)**.

Powered by [rupeemap.in](https://rupeemap.in) and engineered by **Sandesh Rathi**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Render](https://img.shields.io/badge/Deploy-Render_Blueprint-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Pytest](https://img.shields.io/badge/Tests-46_Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org)

---

## 📑 Table of Contents

- [Overview & System Philosophy](#-overview--system-philosophy)
- [Institutional Research Modules](#-institutional-research-modules)
  - [1. Stock Intelligence (360° Forensics)](#1-stock-intelligence-360-forensics)
  - [2. Fund Alpha Engine (AMFI Analytics)](#2-fund-alpha-engine-amfi-analytics)
  - [3. Quant & Stress Lab (Risk Parity & Historical Crash Replays)](#3-quant--stress-lab-risk-parity--historical-crash-replays)
  - [4. AlphaChanakya AI Quantitative Copilot (Tool Calling & Macro Intelligence)](#4-alphachanakya-ai-quantitative-copilot)
  - [5. Universal OmniSearch & Real-Time Market Ribbon](#5-universal-omnisearch--real-time-market-ribbon)
  - [6. Contextual Page Guide & Financial Jargon Playbook](#6-contextual-page-guide--financial-jargon-playbook)
- [🏛️ System Architecture & Data Flow](#-system-architecture--data-flow)
- [🧠 Quantitative & Mathematical Formulations](#-quantitative--mathematical-formulations)
  - [A. Active Share & Closet Indexing Detection](#a-active-share--closet-indexing-detection)
  - [B. Compound Monthly Up/Down Capture Ratios](#b-compound-monthly-updown-capture-ratios)
  - [C. Cross-Fund Portfolio Overlap Matrix](#c-cross-fund-portfolio-overlap-matrix)
  - [D. Rolling Return Outperformance Consistency & Capital Preservation](#d-rolling-return-outperformance-consistency--capital-preservation)
  - [E. Inverse-Volatility Risk-Parity & Marginal Risk Contributions (MRC)](#e-inverse-volatility-risk-parity--marginal-risk-contributions-mrc)
  - [F. Forward Growth & Target Price Compounding ($FY+1$ to $FY+3$)](#f-forward-growth--target-price-compounding-fy1-to-fy3)
  - [G. 0–100 Multi-Factor Scoring Model (Quality, Value, Momentum)](#g-0100-multi-factor-scoring-model-quality-value-momentum)
- [🛠️ Tech Stack & Technical Specifications](#-tech-stack--technical-specifications)
- [📁 Repository Structure](#-repository-structure)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [📡 REST API Reference](#-rest-api-reference)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🐳 Production Deployment (Render & Docker)](#-production-deployment-render--docker)
- [⚖️ Attribution & Disclaimer](#-attribution--disclaimer)

---

## 🌟 Overview & System Philosophy

**InvestDeskPro** bridges the gap between fragmented financial data feeds and institutional-grade decision intelligence for Indian investors, wealth managers, and family offices.

Traditional retail platforms often suffer from structural flaws:
- **Trailing point-to-point CAGR distortion**: Arbitrary start/end dates mask true manager consistency (endpoint bias).
- **Closet Indexing**: Active fund managers charging high TER ($0.7\%–1.5\%$) while simply hugging the Nifty 50 or Nifty 100 benchmark.
- **Hidden Portfolio Overlap**: Investors buying 4–6 mutual funds unaware that $40\%–55\%$ of their capital sits in the same 12 stocks.
- **Static Model Portfolios**: Toy equal-weighted baskets that ignore asset covariance, concentration risk, and historical crisis drawdowns.
- **Surface-level P/E multiples**: Multiple evaluation without historical $+1\sigma / -1\sigma$ standard deviation valuation bands.

**InvestDeskPro** addresses these challenges through a unified quantitative terminal built with orthogonal factor scorecards, dynamic reverse DCF models, rolling alpha distributions, active share detection, cross-fund overlap matrices, and interactive risk-parity stress-testing.

---

## ⚡ Institutional Research Modules

### 1. Stock Intelligence (360° Forensics)
- **12-Factor Fundamental Essentials Grid**: CMP, Market Cap (₹ Cr), Trailing P/E, P/B, EV/EBITDA, Dividend Yield, ROCE %, ROE %, Debt-to-Equity, Promoter Holding %, Pledged Shares %, and 1Y Return %.
- **Dual-Engine Forensic Probe System**:
  - *Non-BFSI Models*: Beneish M-Score (earnings manipulation), Altman Z-Score (bankruptcy distress), and Piotroski F-Score (financial trend quality).
  - *BFSI Specific Models*: Net NPA %, Gross NPA %, Provision Coverage Ratio (PCR), and Capital Adequacy Ratio (CAR / CRAR) for banks and NBFCs.
- **Automated Institutional Red-Flag Badges**:
  - 🚨 High Financial Leverage ($D/E > 1.50\text{x}$)
  - 🚨 Promoter Share Pledging ($> 0\%$, Critical if $> 15\%$)
  - 🚨 Cash Flow Divergence ($OCF < 0.70 \times \text{PAT}$ or negative OCF)
  - 🚨 Valuation Stretch (P/E at $>45\%$ premium over 5Y Historical Median)
- **Multi-Timeframe Valuation Bands (`1M`, `6M`, `1Y`, `3Y`, `5Y`, `MAX`)**:
  - *Price & Volume*: Daily closes with 50-DMA and 200-DMA moving average overlays and volume bars.
  - *Valuation Bands*: Historical daily P/E multiple plotted against the **5-Year Historical Median**, $+1\sigma$ (Upper Bound), and $-1\sigma$ (Lower Bound) standard deviation valuation bands.
- **1-to-3 Year Forward Earnings Forecasting Engine ($FY+1$, $FY+2$, $FY+3$)**:
  - Projects Revenue, PAT, Diluted EPS, Target Share Price, and Implied CAGR across **Base Case (Most Likely)**, **Bull Case (Accelerated Expansion)**, and **Bear Case (Slowdown)**.
  - **Interactive What-If Custom Simulator**: Live sliders for custom Revenue Growth % p.a., Net Margin %, and Exit P/E Multiple with real-time recalculation.
  - **Return Driver Attribution Breakdown**: Mathematical decomposition into *Fundamental Earnings Growth %* vs *Valuation Multiple Expansion/Contraction %*.
- **Reverse DCF & Valuation Sensitivity Matrix**:
  - Implied 5Y & 10Y PAT growth rate baked into the current stock price.
  - 2D Sensitivity Grid varying Discount Rates ($10.0\% - 15.0\%$) and Terminal Growth Rates ($3.0\% - 5.0\%$).
- **Authentic Sector-Specific Peer Benchmarking**:
  - Real, verified fundamental metrics across 16 deep industry sector peer groups (Oil & Gas/LPG, IT & SaaS, Banking, NBFC/Exchanges, Auto, FMCG, Distilleries, Retail, Pharma, Capital Goods/Cables, Power, Chemicals, Metals, Cement, Defence, Railways).

---

### 2. Fund Alpha Engine (AMFI Analytics)
- **In-Memory Instant Search**: Fuzzy lookup across all **37,851 AMFI mutual fund schemes** with instant response times, direct numeric scheme codes (e.g. `122639`), and colloquial aliases (e.g., `PPFAS`, `HDFC TOP 100`, `QUANT SMALL`, `SBI CONTRA`).
- **Dynamic Category Benchmarks**: Automatically pairs schemes with their official SEBI-mandated category index:
  - Small Cap $\rightarrow$ **Nifty Smallcap 250 TRI**
  - Mid Cap $\rightarrow$ **Nifty Midcap 150 TRI**
  - Large Cap $\rightarrow$ **Nifty 50 TRI / Nifty 100 TRI**
  - Flexi Cap / Multi Cap $\rightarrow$ **Nifty 500 TRI**
  - Sectoral / Thematic $\rightarrow$ **Nifty Bank, Nifty IT, Nifty Pharma, Nifty Auto**
- **Active Share & Closet Indexing Detection**:
  - Computes the portfolio divergence score: $\text{Active Share} = \frac{1}{2} \sum |w_{\text{fund}} - w_{\text{bench}}|$.
  - Highlights **Truly Active High-Conviction ($\ge 60\%$)**, **Moderate Tilt ($40\% - 60\%$)**, and flags **Closet Indexers ($< 40\%$)** with warning alerts when paying active management fees for index replication.
- **Compound Monthly Up/Down Capture Ratios (UCR / DCR)**:
  - Evaluates geometric compound returns across positive and negative market months.
  - Asymmetric classification: *Asymmetric Alpha Compounder* ($UCR > 95\%, DCR < 75\%$), *High-Beta Passenger*, or *Downside Bleeder*.
- **Rolling Return Outperformance Consistency Matrix**:
  - Evaluates daily rolling windows across 1Y, 3Y, and 5Y horizons.
  - **Capital Preservation Rate**: Percentage of historical windows with zero negative return (e.g., $100\%$ capital preservation over 5Y).
  - **Manager Skill vs. Luck Diagnostic**: Identifies whether a 3Y CAGR is backed by repeatable rolling alpha ($\ge 65\%$) or driven by an isolated lucky quarter (endpoint bias).
  - **Return Quartile Box**: Min, 25th percentile, Median, 75th percentile, and Max CAGR.
- **Cross-Fund Portfolio Overlap Matrix**:
  - Interactive multi-fund selector comparing 2 schemes side-by-side.
  - Computes **Total Overlap %** ($\sum \min(w_A, w_B)$), **Unique Allocation %**, and displays the **Common Duplicated Stock Holdings Table** with combined weights and sector tags.
  - Provides a **Diversification Synergy Rating** (*High Diversification* vs *Redundant Fee Drag*).
- **Institutional Risk Scorecard**:
  - **Information Ratio (IR)** ($\frac{\alpha}{\text{Tracking Error}}$) with $\ge 0.50$ talent indicator.
  - **Sortino Ratio** (downside semi-variance penalty against risk-free rate $6.5\%$).
  - **Annualized Tracking Error** and Volatility Comparison.
- **AUM Bloat & Style Drift Diagnostics**:
  - Flags small-cap schemes exceeding $₹25,000\text{ Cr}$ AUM with cash cushions $> 10\%$.
  - Flags style drift (e.g. Mid Cap Fund holding $> 35\%$ Large Cap equities for liquidity).

---

### 3. Quant & Stress Lab (Risk Parity & Historical Crash Replays)
- **0–100 Multi-Factor Stock Diagnostic Scorecard**:
  - Evaluates single stocks across 5 orthogonal pillars: **Quality (40 pts)**, **Value (30 pts)**, and **Momentum / Low-Vol (30 pts)**.
- **Interactive Portfolio Stress-Tester & Risk-Parity Optimizer**:
  - **Empty Default State**: Build custom portfolios from scratch or start from curated presets (*Nifty Core 6*, *Financials + Tech*, *Defensive All-Weather*, *High-Growth Leaders*).
  - **Unrestricted Portfolio Size**: Add 2 to 30+ stocks with no arbitrary caps.
  - **CSV & Excel (`.xlsx`, `.xls`) Portfolio Importer**: Client-side parser with multi-sheet scanning (`Tradewise-Equity`, `Equity`, `Holdings`) supporting tax P&L exports from **Zerodha, Groww, Upstox, Angel One, and ICICI Direct**.
  - **Collapsible / Expandable Allocation Manager**:
    - Mode Switcher: **Auto Risk-Parity** (algorithmic inverse-volatility parity) vs **Custom Sliders**.
    - Dual input controls per stock: **Interactive Slider Bar ($0\%-100\%$)** + **Numeric Input Box**.
    - 1-Click Balancing Actions: **Normalize to 100%**, **Equal-Weight**, **Reset to Risk-Parity**, and per-row deletion.
  - **Dynamic Frontend Covariance Recalculation**: Instant real-time recalculation of portfolio volatility ($\sigma_p = \sqrt{w^T \Sigma w}$) and marginal risk contributions ($\text{PRC}_i$) on slider movement using the cached $N \times N$ covariance matrix.
- **Historical Market Crash Replays vs Nifty 50 TRI**:
  - Simulates custom portfolio performance during major historical stress regimes:
    1. 🦠 **COVID-19 Global Shock (Feb 2020 – Aug 2020)** vs Nifty 50 $-38.4\%$.
    2. 📈 **Global Rate Hike & Inflation Tightening (Oct 2021 – Jun 2022)**.
    3. 🚨 **Mid & Smallcap Liquidity Squeeze (Jan 2024 – Mar 2024)**.
  - Calculates Portfolio Max Drawdown, Downside Cushion Badge (+% cushion vs Nifty 50), and Peak-to-Peak Recovery Duration.
- **Interactive Correlation Matrix Filter & Pairwise Inspector**:
  - Interactive stock pill chips to filter and customize the visible $N \times N$ heatmap without horizontal scroll clutter.
  - Quick buttons: **Top 8 Holdings**, **Show All ({N})**, and **Clear**.
  - **1-on-1 Pairwise Correlation Inspector**: Select any two portfolio stocks to display exact Pearson correlation $r$ and co-movement status (*High Co-Movement*, *Moderate*, *High Diversification*).

---

### 4. AlphaChanakya AI Quantitative Copilot
- **Witty, Disciplined Institutional Persona**: Combines Chanakya's ancient strategic wisdom with modern factor modeling and valuation discipline.
- **Strict Financial Guardrails**: Automatically detects and wittily deflects non-financial inquiries, keeping the user focused on high-expectancy capital allocation.
- **8 Native Function Calling Tools**:
  1. `tool_audit_stock`: 360° Forensics, CMP, P/E, ROCE, D/E, Reverse DCF Implied Growth, and Forensic Probes (*Altman Z, Beneish M, Piotroski F*).
  2. `tool_forecast_growth`: 1Y–3Y forward EPS, target prices, and return driver attribution.
  3. `tool_audit_mutual_fund`: 3Y Rolling Alpha, Active Share % & Closet Indexing alert, Compound Monthly UCR/DCR, and 5-Pillar Scorecard.
  4. `tool_cross_fund_overlap`: Common duplicated holdings, overlap %, unique exposures, and fee drag diagnosis.
  5. `tool_optimize_portfolio`: Inverse-volatility risk-parity weights and Marginal Risk Contribution (MRC).
  6. `tool_stress_test_portfolio`: Historical crash replays (COVID-19, Rate Hikes, Smallcap Liquidity Squeeze).
  7. `tool_get_market_overview`: Live benchmark quotes (Nifty 50, Sensex, Bank Nifty, India VIX, Crude) and FII/DII daily cash flows.
  8. `tool_explain_jargon`: Exact mathematical formulas and playbook interpretations from the Page Guide.
- **Dual-Engine LLM with Local Fallback**: Supports **Google Gemini 1.5/2.5 Flash** and **Groq Llama-3.3-70B** with an intelligent local quantitative fallback ensuring 100% platform uptime.
- **Slide-Over Terminal UI**: Features active viewport telemetry, animated tool execution badges, dynamic follow-up chips, and `Cmd+J` / `Ctrl+J` shortcut.

---

### 5. Universal OmniSearch & Real-Time Market Ribbon
- **Unified Global OmniSearch**: Searches NSE/BSE equities, tickers, ISINs, and AMFI mutual funds in a single input. Supports global shortcut keys (`Cmd+K`, `Ctrl+K`, `/`).
- **Live Market Ribbon**: Real-time tracking of NIFTY 50, SENSEX, NIFTY BANK, INDIA VIX, and BRENT CRUDE with live FII / DII institutional net flow updates.

---

### 6. Contextual Page Guide & Financial Jargon Playbook
- Accessible via the **Floating Action Badge (FAB)** or hotkey `?`.
- Provides definitions, mathematical formulas, and practical interpretation for all financial metrics (Active Share, Information Ratio, Capture Ratios, Reverse DCF, Risk Parity, Piotroski, Beneish, Altman Z).

---

## 🏛️ System Architecture & Data Flow

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           InvestDeskPro Frontend                             │
│                  (Next.js 15 App Router + TailwindCSS + Recharts)            │
│  ┌─────────────────────────┬─────────────────────────┬────────────────────┐  │
│  │   Stock Intelligence    │    Fund Alpha Engine    │ Quant & Stress Lab │  │
│  │  (360° & Forward Model) │  (Active Share & Overlap│ (Risk Parity & DD) │  │
│  └─────────────────────────┴─────────────────────────┴────────────────────┘  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ REST JSON (HTTP / CORS)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            InvestDeskPro Backend                             │
│                      (FastAPI + Pydantic v2 Architecture)                    │
│ ┌───────────────────────┬─────────────────────────────┬────────────────────┐ │
│ │  Company 360 Engine   │     AMFI Alpha Engine       │ Portfolio Engine   │ │
│ │  • Forensic Probes    │     • Active Share / Overlap│ • Inverse-Vol Wts  │ │
│ │  • Forward Projections│     • Monthly Capture UCR   │ • Covariance Σ     │ │
│ │  • DCF Sensitivity    │     • Rolling Consistency   │ • Crash Simulation │ │
│ └───────────┬───────────┴──────────────┬──────────────┴─────────┬──────────┘ │
└─────────────┼──────────────────────────┼────────────────────────┼────────────┘
              │                          │                        │
              ▼                          ▼                        ▼
  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐
  │  NSE / BSE Financials │  │  AMFI NAV Open API    │  │ Local Repositories   │
  │  & Live Price Engine  │  │  (37,851 Schemes)     │  │ (Holdings Master &   │
  │  (yfinance / Indices) │  │  (api.mfapi.in)       │  │  Benchmark Datasets) │
  └───────────────────────┘  └───────────────────────┘  └──────────────────────┘
```

---

## 🧠 Quantitative & Mathematical Formulations

### A. Active Share & Closet Indexing Detection
Measures the percentage of fund holdings that differ from the category benchmark index:
$$\text{Active Share} = \frac{1}{2} \sum_{i=1}^{N} |w_{\text{fund}, i} - w_{\text{benchmark}, i}|$$

- **Active Share $\ge 60\%$**: Truly Active High-Conviction Management.
- **Active Share $40\% - 60\%$**: Moderate Active Tilt.
- **Active Share $< 40\%$**: Closet Indexer (Charging active fees for passive market returns).

---

### B. Compound Monthly Up/Down Capture Ratios
Calculates geometric compound returns across positive and negative market months:
$$\text{UCR} = \frac{\prod_{m \in \mathcal{U}} (1 + R_{\text{fund}, m}) - 1}{\prod_{m \in \mathcal{U}} (1 + R_{\text{bench}, m}) - 1} \times 100\%, \quad \text{where } \mathcal{U} = \{ m \mid R_{\text{bench}, m} > 0 \}$$

$$\text{DCR} = \frac{\prod_{m \in \mathcal{D}} (1 + R_{\text{fund}, m}) - 1}{\prod_{m \in \mathcal{D}} (1 + R_{\text{bench}, m}) - 1} \times 100\%, \quad \text{where } \mathcal{D} = \{ m \mid R_{\text{bench}, m} < 0 \}$$

$$\text{Capture Spread} = \text{UCR} - \text{DCR}$$

---

### C. Cross-Fund Portfolio Overlap Matrix
Calculates the exact duplicate equity holding percentage between Fund A and Fund B:
$$\text{Overlap}(\text{Fund A}, \text{Fund B}) = \sum_{i} \min(w_{A, i}, w_{B, i})$$

$$\text{Unique Allocation}_A = \sum_{i} w_{A, i} - \text{Overlap}$$

---

### D. Rolling Return Outperformance Consistency & Capital Preservation
- **Outperformance Beat Rate %**:
  $$\text{Beat Rate} = \frac{\text{Count of Rolling Windows where } R_{\text{fund}} > R_{\text{bench}}}{\text{Total Rolling Windows}} \times 100\%$$
- **Capital Preservation Rate (Zero Loss)**:
  $$\text{Capital Preservation Rate} = 100\% - \left(\frac{\text{Count of Windows where } R_{\text{fund}} < 0\%}{\text{Total Windows}} \times 100\%\right)$$
- **Information Ratio (IR)**:
  $$\text{IR} = \frac{\bar{R}_{\text{active, ann}}}{\text{Tracking Error}_{\text{ann}}} = \frac{\text{Mean}(R_{\text{fund}} - R_{\text{bench}}) \times 252}{\text{StdDev}(R_{\text{fund}} - R_{\text{bench}}) \times \sqrt{252}}$$

---

### E. Inverse-Volatility Risk-Parity & Marginal Risk Contributions (MRC)
Allocates capital inversely proportional to realized 60-day annualized volatility:
$$w_i^{\text{raw}} = \frac{1 / \sigma_i}{\sum_{j=1}^N (1 / \sigma_j)}, \quad \text{where } \sigma_i = \sqrt{252} \cdot \text{StdDev}(r_i)$$

Subject to the iterative simplex weight cap constraint:
$$w_i \le c_{\text{max}} \quad (\text{e.g. } 15\% \text{ or } 25\%), \quad \sum_{i=1}^N w_i = 1$$

Portfolio Variance and Percent Risk Contribution:
$$\sigma_p = \sqrt{w^T \Sigma_{\text{ann}} w}, \qquad \text{MRC}_i = \frac{(\Sigma_{\text{ann}} w)_i}{\sigma_p}, \qquad \text{PRC}_i = \frac{w_i \cdot \text{MRC}_i}{\sigma_p} \times 100\%$$

---

### F. Forward Growth & Target Price Compounding ($FY+1$ to $FY+3$)
- **Top-Line Compounding Rate ($g$)**:
  $$g_{\text{base}} = 0.40 \times \text{CAGR}_{3Y}^{\text{Rev}} + 0.35 \times \text{CAGR}_{5Y}^{\text{Rev}} + 0.25 \times \text{SGR}, \quad \text{where } \text{SGR} = \text{ROE} \times (1 - \text{Payout})$$
- **Mean-Reverting Net Margin ($NPM$)**:
  $$NPM_{\text{base}} = 0.65 \times \text{NPM}_{\text{Latest}} + 0.35 \times \text{NPM}_{\text{5Y Avg}}$$
- **Forward Horizon Projections ($t \in \{1, 2, 3\}$)**:
  $$\text{Revenue}_t = \text{Revenue}_0 \times (1 + g)^t, \quad \text{PAT}_t = \text{Revenue}_t \times NPM, \quad \text{EPS}_t = \text{EPS}_0 \times \left(\frac{\text{PAT}_t}{\text{PAT}_0}\right)$$
  $$\text{Target Price}_t = \text{EPS}_t \times \text{Exit P/E}, \quad \text{Implied CAGR}_t = \left(\frac{\text{Target Price}_t}{\text{CMP}}\right)^{\frac{1}{t}} - 1$$

---

### G. 0–100 Multi-Factor Scoring Model (Quality, Value, Momentum)
$$S_{\text{total}} = S_{\text{Quality}} (40\text{ pts}) + S_{\text{Value}} (30\text{ pts}) + S_{\text{Momentum/Low-Vol}} (30\text{ pts})$$

---

## 🛠️ Tech Stack & Technical Specifications

| Layer | Technologies | Key Specifications |
| :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com) (Python 3.11) | Async ASGI REST engine with CORS middleware and auto-docs (`/docs`) |
| **Data Contracts** | [Pydantic v2](https://docs.pydantic.dev) | Strict typed validation models across all endpoints |
| **Numerical Engines** | NumPy, Pandas, SciPy | In-memory matrix covariance, rolling quantile statistics & simplex optimization |
| **Data Ingestion** | yfinance & AMFI Open Endpoints | Real-time quotes, multi-timeframe OHLCV, and 37,851+ mutual fund NAVs |
| **File Parsing** | SheetJS (`xlsx`) & Python openpyxl | Client/Server multi-sheet CSV/Excel broker statement ingestion |
| **Testing Suite** | [Pytest](https://pytest.org) | 37 automated unit/integration tests with 100% passing status |
| **Frontend Framework** | [Next.js 15](https://nextjs.org) (App Router) | React 19, TypeScript, Server & Client Components, Turbopack |
| **UI Styling** | [Tailwind CSS](https://tailwindcss.com) & Lucide | Institutional dark glassmorphic terminal aesthetics |
| **Charting Engine** | [Recharts](https://recharts.org) | Responsive synchronized area charts, valuation bands, and drawdown timelines |
| **Deployment** | Docker & Render Blueprint | Multi-stage containerization with IaC (`render.yaml`) |

---

## 📁 Repository Structure

```text
investdeskpro/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application, CORS, routes & /health
│   │   ├── schemas.py              # Pydantic v2 models for all data responses
│   │   ├── data/
│   │   │   ├── amfi-schemes.json   # 37,851 in-memory AMFI scheme master
│   │   │   └── mf_holdings.json    # Institutional portfolio holdings & index constituent weights
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── company_deep.py     # 360° overview, forensic checks & verified peers
│   │   │   ├── growth_forecast.py  # 1-3Y forward earnings & growth forecasting
│   │   │   ├── factors.py          # 0-100 Quality, Value, Momentum factor scoring
│   │   │   ├── mf_engine.py        # Active share, monthly capture, rolling consistency & overlap
│   │   │   ├── mf_benchmark.py     # Dynamic SEBI category-aware benchmark assigner
│   │   │   ├── portfolio.py        # MultiIndex historical prices, inverse-vol parity & crash replays
│   │   │   └── screener_engine.py  # Multi-factor equity screening & thematic baskets
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── company.py          # /company/{ticker}, /history, /forecast, /omni
│   │       ├── stocks.py           # /stocks/{ticker}, /stocks/indices, /stocks/{ticker}/price
│   │       ├── funds.py            # /funds/{scheme_code}, /funds/search, /funds/overlap
│   │       └── optimizer.py        # /portfolio/optimize
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_company.py         # Tests for Company 360, DCF, history & search
│   │   ├── test_forecast.py        # Tests for 1-3Y forward CAGR & math formulations
│   │   ├── test_factors.py         # Tests for factor scoring bounds & BFSI probes
│   │   ├── test_mf_engine.py       # Tests for active share, monthly capture & overlap API
│   │   └── test_portfolio.py       # Tests for risk parity, caps, crash replays & covariance
│   ├── Dockerfile                  # Multi-stage Python 3.11 deployment container
│   ├── pytest.ini                  # Pytest test discovery config
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Dark theme & glassmorphic utilities
│   │   │   ├── layout.tsx          # Root layout & metadata
│   │   │   └── page.tsx            # Dashboard shell, omni-search & tab switcher
│   │   ├── components/
│   │   │   ├── Header.tsx          # Institutional Terminal Header & Live Market Ribbon
│   │   │   ├── Company360View.tsx  # Stock Intelligence (360° Forensics, Forecast & DCF)
│   │   │   ├── FundAnalyzerView.tsx # Fund Alpha Engine (Active Share, Capture & Overlap)
│   │   │   ├── QuantDeskView.tsx   # Quant Desk Sub-Tab Shell
│   │   │   ├── StockScorecardView.tsx # 0-100 Multi-Factor Scorecard
│   │   │   ├── PortfolioOptimizerView.tsx # Portfolio Stress-Tester & Crash Replays
│   │   │   └── PageGuideDrawer.tsx # Contextual Playbook & Financial Dictionary
│   │   ├── hooks/
│   │   │   └── useDebounce.ts      # Input debouncing hook
│   │   └── lib/
│   │       └── api.ts              # Type-safe API client with error handling
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── .gitignore
├── render.yaml                     # Render Blueprint IaC deployment file
└── README.md                       # Complete Project Specification
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Python**: 3.10 or 3.11
- **Node.js**: 18.x or 20.x
- **npm** or **pnpm**
- **Git**

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
PYTHONPATH=. pytest -v

# Start FastAPI server on port 8005
uvicorn app.main:app --reload --port 8005
```

- **API Base URL**: `http://127.0.0.1:8005`
- **Swagger Documentation**: [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs)
- **Healthcheck Endpoint**: [http://127.0.0.1:8005/health](http://127.0.0.1:8005/health)

### 2. Frontend Setup

In a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

- **Frontend Terminal**: `http://localhost:3000` (or `http://localhost:3005`)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck returning backend status, version, and UTC timestamp. |
| `GET` | `/api/v1/search/omni?q={query}` | Global search across Indian stocks and AMFI mutual funds. |
| `GET` | `/api/v1/company/{ticker}` | Returns complete Company 360° overview, forensic checks, warning badges, and DCF. |
| `GET` | `/api/v1/company/{ticker}/history?timeframe={1y\|3y\|5y\|max}` | Daily price history, moving averages, and P/E valuation standard deviation bands. |
| `GET` | `/api/v1/company/{ticker}/forecast` | 1Y, 2Y, 3Y Forward Growth, EPS, Target Prices, and Driver Attribution. |
| `GET` | `/api/v1/stocks/{ticker}` | Orthogonal 0–100 Quality, Value, and Momentum factor score breakdown. |
| `GET` | `/api/v1/stocks/indices` | Live quotes for Nifty 50, Sensex, Bank Nifty, India VIX, Crude, and FII/DII flow. |
| `GET` | `/api/v1/stocks/{ticker}/price` | Live quote, day high/low, 52W range, and volume for a single stock. |
| `GET` | `/api/v1/funds/search?q={query}` | Searches 37,851 AMFI mutual fund schemes by name or code. |
| `GET` | `/api/v1/funds/{scheme_code}` | Computes Active Share, monthly UCR/DCR, 3Y rolling alpha, and Sortino ratio. |
| `POST` | `/api/v1/funds/overlap` | Calculates portfolio overlap %, common stock duplication, and fee drag for 2 schemes. |
| `GET` | `/api/v1/portfolio/optimize?tickers=...&max_weight=15` | Computes inverse-volatility weights, risk contributions, covariance matrix, and crash replays. |

---

## 🧪 Testing & Quality Assurance

InvestDeskPro maintains an automated Pytest test suite covering all quantitative engines, factor scoring bounds, DCF matrices, AMFI parsing, active share, capture ratios, overlap API, and portfolio optimization:

```bash
cd backend
PYTHONPATH=. pytest -v
```

```text
======================== 37 passed in 21.48s ========================
```

---

## 🐳 Production Deployment (Render & Docker)

This repository includes a native [`render.yaml`](./render.yaml) Blueprint:

1. Push your code to GitHub.
2. Log into [Render](https://render.com) and click **New +** $\rightarrow$ **Blueprint**.
3. Select your `InvestDeskPro` repository.
4. Render will deploy:
   - **`investdeskpro-api`**: FastAPI Web Service containerized with Docker and healthchecks.
   - **`investdeskpro-dashboard`**: Next.js 15 App Router Frontend connected to the backend service.

---

## ⚖️ Attribution & Disclaimer

- **Created & Engineered by**: **Sandesh Rathi**
- **Ecosystem Integration**: Powered by [rupeemap.in](https://rupeemap.in)
- **Data Sources**: Association of Mutual Funds in India (AMFI), National Stock Exchange of India (NSE), and Bombay Stock Exchange (BSE).
- **Disclaimer**: *InvestDeskPro is designed strictly for quantitative research, financial education, and diagnostic analysis. It does not constitute financial, investment, legal, or tax advice. Market investments are subject to market risks. Please read all scheme-related documents carefully and consult a SEBI-registered investment advisor before making any financial decisions.*
