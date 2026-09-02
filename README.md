# InvestDeskPro 📈

**InvestDeskPro** is an institutional-grade quantitative investment intelligence, forensic diagnostic scorecard, and portfolio optimization platform engineered specifically for **Indian Equities (NSE/BSE)** and **Mutual Funds (AMFI)**. Powered by [rupeemap.in](https://rupeemap.in) and engineered by **Sandesh Rathi**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Render](https://img.shields.io/badge/Deploy-Render_Blueprint-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Pytest](https://img.shields.io/badge/Tests-25_Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org)

---

## 📑 Table of Contents

- [Overview & System Philosophy](#-overview--system-philosophy)
- [Key Functional Capabilities](#-key-functional-capabilities)
  - [1. Universal OmniSearch & Quick Audit](#1-universal-omnisearch--quick-audit)
  - [2. Company 360° Diagnostic Scorecard & Health Badges](#2-company-360-diagnostic-scorecard--health-badges)
  - [3. Multi-Timeframe Price & Valuation Bands (P/E & P/B)](#3-multi-timeframe-price--valuation-bands-pe--pb)
  - [4. 1-to-3 Year Forward Growth & Earnings Forecasting Engine](#4-1-to-3-year-forward-growth--earnings-forecasting-engine)
  - [5. Authentic Sector-Specific Peer Benchmarking](#5-authentic-sector-specific-peer-benchmarking)
  - [6. Reverse DCF & Valuation Sensitivity Matrix](#6-reverse-dcf--valuation-sensitivity-matrix)
  - [7. AMFI Mutual Fund Rolling Alpha & Risk Engine](#7-amfi-mutual-fund-rolling-alpha--risk-engine)
  - [8. Inverse-Volatility Risk-Parity Portfolio Optimizer](#8-inverse-volatility-risk-parity-portfolio-optimizer)
- [📖 How to Use (Step-by-Step User Guide)](#-how-to-use-step-by-step-user-guide)
  - [A. Running an Instant Stock Audit](#a-running-an-instant-stock-audit)
  - [B. Simulating 1-to-3 Year Forward Growth](#b-simulating-1-to-3-year-forward-growth)
  - [C. Auditing Mutual Funds via AMFI Scheme Lookup](#c-auditing-mutual-funds-via-amfi-scheme-lookup)
  - [D. Constructing a Risk-Parity Equity Basket](#d-constructing-a-risk-parity-equity-basket)
- [🏛️ System Architecture & Data Flow](#-system-architecture--data-flow)
- [🧠 Quantitative & Mathematical Formulations](#-quantitative--mathematical-formulations)
- [🛠️ Tech Stack](#-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [📡 REST API Reference](#-rest-api-reference)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🐳 Production Deployment (Render & Docker)](#-production-deployment-render--docker)
- [⚖️ Attribution & Disclaimer](#-attribution--disclaimer)

---

## 🌟 Overview & System Philosophy

**InvestDeskPro** bridges the gap between raw financial data and institutional-grade decision intelligence for Indian capital markets. Traditional retail tools often suffer from:
- **Point-to-point trailing return bias**: Distorting fund performance based on arbitrary start/end dates.
- **Surface-level P/E ratios**: Failing to contextualize valuations against historical standard deviation bands.
- **Unverified peer comparisons**: Fabricating peer metrics or comparing disparate sectors (e.g. comparing LPG distributors to IT exporters).
- **Missing forward growth models**: Lacking transparent 1-to-3 year forward earnings forecasting and return driver attribution.

InvestDeskPro solves this by providing a unified quantitative terminal featuring orthogonal factor scoring, multi-timeframe valuation bands, reverse DCF sensitivity matrices, dynamic forward forecasting, verified sector peers, AMFI rolling alpha tracking, and risk-parity portfolio optimization.

---

## ⚡ Key Functional Capabilities

### 1. Universal OmniSearch & Quick Audit
- Instant auto-complete search across all **NSE and BSE listed equities** (e.g., `RELIANCE`, `TCS`, `CONFIPET`, `TATAMOTORS`, `PICCADIL`).
- Seamless **AMFI Mutual Fund Scheme Resolution** supporting scheme name queries or direct 6-digit numeric AMFI scheme codes (e.g., `122639` for Parag Parikh Flexi Cap).
- Quick-Search chips on the homepage for single-click institutional audits of high-volume market benchmarks.

### 2. Company 360° Diagnostic Scorecard & Health Badges
- **12-Factor Fundamental Essentials Grid**: Real-time tracking of CMP, Market Cap (₹ Cr), P/E, P/B, EV/EBITDA, Dividend Yield, ROCE, ROE, Debt-to-Equity, Promoter Holding %, Pledged Shares %, and 1Y Price Return.
- **Automated Warning Badges System**:
  - 🚨 **High Financial Leverage**: Triggers if $\text{Debt-to-Equity} > 1.50\text{x}$ (Critical) or $> 1.00\text{x}$ (Moderate).
  - 🚨 **Promoter Share Pledging**: Alerts if pledged promoter shares exceed $0\%$ (Critical if $> 15\%$).
  - 🚨 **Cash Flow Divergence**: Flags negative Operating Cash Flow (OCF), YoY OCF declines $> 15\%$, or weak conversion ($OCF < 0.70 \times \text{PAT}$).
  - 🚨 **Valuation Stretch**: Alerts when current P/E exceeds a $45\%$ premium over the 5-year historical median.
  - 🚨 **Forensic Probe Red Flags**: Automated red-flag detection across Beneish M-Score, Altman Z-Score, and Piotroski F-Score probes.

### 3. Multi-Timeframe Price & Valuation Bands (P/E & P/B)
- Multi-timeframe presets: **1M, 6M, 1Y, 3Y, 5Y, and MAX** (spanning the entire listed history of the stock).
- **Synchronized Dual-Chart Terminal**:
  1. *Price & Volume Chart*: Interactive daily closes with 50-DMA and 200-DMA moving average overlays and volume bars.
  2. *Valuation History Chart*: Daily trailing P/E multiple plotted against the **5-Year Historical Median**, $+1\sigma$ (Upper Bound), and $-1\sigma$ (Lower Bound) standard deviation valuation bands.

### 4. 1-to-3 Year Forward Growth & Earnings Forecasting Engine
- Projects **Revenue (₹ Cr), PAT (₹ Cr), Diluted EPS (₹), Target Share Price (₹), Implied Total Return (%), and Annualized CAGR (%)** over 1-Year ($FY+1$), 2-Year ($FY+2$), and 3-Year ($FY+3$) horizons.
- **Three Core Scenarios**:
  - ⚖️ **Base Case (Most Likely)**: Multi-factor top-line compounding ($40\% \times \text{3Y CAGR} + 35\% \times \text{5Y CAGR} + 25\% \times \text{SGR}$), mean-reverting net margins ($65\% \times \text{Latest} + 35\% \times \text{5Y Avg}$), and 5-year historical median exit P/E.
  - 🐂 **Bull Case (Accelerated Expansion)**: Top-line growth acceleration, operating leverage margin expansion ($+12\%$), and $+1\sigma$ exit P/E multiple.
  - 🐻 **Bear Case (Macro Slowdown & De-rating)**: Top-line growth compression, raw material margin contraction ($-15\%$), and $-1\sigma$ discounted exit P/E.
- **Interactive "What-If" Custom Simulator**: Live sliders for custom Revenue Growth % p.a., Projected Net Margin %, and Target Exit P/E Multiple with instant client-side recalculation.
- **Return Driver Attribution Breakdown**: Mathematically decomposes 3-year expected returns into **Fundamental Earnings Growth %** vs **Valuation Multiple Expansion/Contraction %**.

### 5. Authentic Sector-Specific Peer Benchmarking
- Comprehensive classification covering **16 deep industry sector peer groups**:
  - *Oil & Gas / LPG / Refineries* (`CONFIPET`, `AEGISLOG`, `MGL`, `IGL`, `GUJGASLTD`, `BPCL`, `IOC`, `HPCL`, `GAIL`, `PETRONET`, `ONGC`, `RELIANCE`)
  - *IT & SaaS* (`TCS`, `INFY`, `HCLTECH`, `WIPRO`, `TECHM`, `LTIM`, `PERSISTENT`, `COFORGE`, `KPITTECH`, `TATAELXSI`)
  - *Banking* (`HDFCBANK`, `ICICIBANK`, `SBIN`, `KOTAKBANK`, `AXISBANK`, `INDUSINDBK`, `FEDERALBNK`, `IDFCFIRSTB`, `BANKBARODA`, `PNB`)
  - *NBFC & Wealth / Exchanges* (`BAJFINANCE`, `BAJAJFINSV`, `JIOFIN`, `CHOLAFIN`, `CDSL`, `BSE`, `MUTHOOTFIN`, `ANGELONE`, `MCX`, `IREDA`)
  - *Automotive & Ancillaries* (`TATAMOTORS`, `MARUTI`, `M&M`, `BAJAJ-AUTO`, `HEROMOTOCO`, `EICHERMOT`, `TVSMOTOR`, `MOTHERSON`, `BHARATFORG`)
  - *FMCG & Consumer Goods* (`ITC`, `HINDUNILVR`, `NESTLEIND`, `BRITANNIA`, `DABUR`, `MARICO`, `GODREJCP`, `COLPAL`, `VBL`, `TATACONSUM`)
  - *Distilleries & Spirits* (`PICCADILY`, `RADICO`, `UNITDSPR`, `TI`, `GLOBUSSPR`, `SULA`, `GMBREW`)
  - *Retail & Consumer Discretionary* (`TRENT`, `TITAN`, `DMART`, `ABFRL`, `PAGEIND`, `BATAINDIA`)
  - *Pharma & Healthcare* (`SUNPHARMA`, `CIPLA`, `DRREDDY`, `DIVISLAB`, `APOLLOHOSP`, `MANKIND`, `MAXHEALTH`, `LUPIN`, `TORNTPHARM`)
  - *Capital Goods, Cables & EMS* (`LT`, `POLYCAB`, `KEI`, `HAVELLS`, `DIXON`, `KAYNES`, `SIEMENS`, `ABB`, `BHEL`, `VOLTAS`, `ASTRAL`)
  - *Power & Clean Energy* (`TATAPOWER`, `NTPC`, `POWERGRID`, `SUZLON`, `IREDA`)
  - *Chemicals & Agrochemicals* (`PIDILITIND`, `SRF`, `AARTIIND`, `DEEPAKNTR`, `TATACHEM`, `PIIND`, `UPL`, `COROMANDEL`)
  - *Metals & Mining* (`TATASTEEL`, `JSWSTEEL`, `HINDALCO`, `VEDL`, `COALINDIA`, `JINDALSTEL`, `NMDC`, `SAIL`)
  - *Cement & Materials* (`ULTRACEMCO`, `GRASIM`, `AMBUJACEM`, `ACC`, `SHREECEM`, `DALBHARAT`)
  - *Defence & Aerospace* (`HAL`, `BEL`, `MAZDOCK`, `COCHINSHIP`, `BDL`)
  - *Railways & Infrastructure* (`RVNL`, `IRFC`, `IRCTC`, `RAILTEL`, `RITES`)
- Real, verified fundamental metrics: CMP (₹), Market Cap (₹ Cr), P/E, P/B, ROE %, ROCE %, OPM %, and 1Y Return %.

### 6. Reverse DCF & Valuation Sensitivity Matrix
- **Implied Growth Rate**: Computes the exact 5-year and 10-year PAT compounding rate baked into the current stock price given standard hurdle rates (12% Discount Rate, 4% Terminal Growth).
- **2D Sensitivity Matrix**: 2D heatmapped valuation grid varying Discount Rate ($10.0\% - 15.0\%$) and Terminal Growth ($3.0\% - 5.0\%$) to identify margin of safety.

### 7. AMFI Mutual Fund Rolling Alpha & Risk Engine
- Fetches full historical daily NAV series from AMFI open endpoints for over 40,000+ mutual fund schemes.
- Aligns with the **Nifty 50 TRI (`^NSEI`)** benchmark on exact trading dates.
- Calculates **3-Year Rolling Alpha, Alpha Consistency Ratio %, Information Ratio, Downside Capture Ratio (DCR), Upside Capture Ratio (UCR), and Sortino Ratio** ($R_f = 6.5\%$).

### 8. Inverse-Volatility Risk-Parity Portfolio Optimizer
- Allocates capital inversely proportional to realized 60-day annualized volatility.
- Enforces an iterative simplex weight cap constraint ($w_i \le c_{\text{max}}$, e.g. 15%).
- Computes Marginal Risk Contribution (MRC), Percent Risk Contribution (PRC), full annualized Covariance Matrix ($\Sigma$), and Effective Number of Assets (ENB).

---

## 📖 How to Use (Step-by-Step User Guide)

### A. Running an Instant Stock Audit
1. Navigate to the **Homepage Search Bar** or switch to the **"Company 360°"** tab.
2. Enter any NSE or BSE ticker (e.g., `TCS`, `RELIANCE`, `CONFIPET`, `TATAMOTORS`, `PICCADILY`).
3. View the **Diagnostic Scorecard Banner**:
   - Check if any warning badges are triggered (Red = Critical, Amber = Warning).
   - Click *"View Detailed Breakdown"* to inspect exact thresholds and metric triggers.
4. Examine the **12-Factor Fundamental Essentials Grid** for key valuation multiples, return on capital, and debt metrics.
5. Review the **Dual-Chart Section**:
   - Toggle timeframe buttons (`1M`, `6M`, `1Y`, `3Y`, `5Y`, `MAX`).
   - Switch between **Price & Volume** and **P/E & Valuation Bands** to see if the stock is trading near its historical median or $+1\sigma$ / $-1\sigma$ valuation extremes.

### B. Simulating 1-to-3 Year Forward Growth
1. Scroll down to the **1-to-3 Year Forward Earnings & Growth Forecasting Engine**.
2. Review the **Historical Growth Anchors Strip** (3Y/5Y Rev CAGR, 3Y PAT CAGR, Sustainable Growth Rate SGR, and 5Y Median P/E).
3. Toggle between **Base Case (Most Likely)**, **Bull Case (Accelerated)**, and **Bear Case (Slowdown)** to see target share prices and implied CAGRs.
4. To test custom thesis assumptions:
   - Click the **"Custom Simulator"** tab.
   - Adjust the **Revenue Growth (% p.a.)**, **Projected Net Margin (%)**, and **Target Exit P/E** sliders.
   - Observe real-time recalculation of FY+1, FY+2, and FY+3 Target Prices and driver attribution.

### C. Auditing Mutual Funds via AMFI Scheme Lookup
1. Switch to the **"Mutual Funds"** tab or search for a scheme directly in the global search bar.
2. Search by AMC/Scheme name (e.g., `Parag Parikh Flexi Cap`, `Mirae Asset Large Cap`) or enter the direct **6-digit AMFI Scheme Code** (e.g., `122639`).
3. Inspect the **Rolling Alpha Chart** to verify if the fund manager consistently generates alpha over 3-year rolling windows.
4. Check the **Downside Capture Ratio (DCR)**: A DCR $< 80\%$ indicates superior downside capital protection during market corrections.

### D. Constructing a Risk-Parity Equity Basket
1. Switch to the **"Portfolio Optimizer"** tab.
2. Enter a basket of 4 to 12 Indian equity tickers (e.g., `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `ITC`, `LT`).
3. Set the **Max Weight Constraint** (e.g., `15%`).
4. Click **"Run Optimization"** to generate inverse-volatility allocations, the full asset covariance matrix, and risk contributions (PRC %).

---

## 🏛️ System Architecture & Data Flow

```text
                               ┌────────────────────────────────────────────────┐
                               │             InvestDeskPro Frontend             │
                               │          (Next.js 15 + Tailwind + Recharts)    │
                               └──────────────────────┬─────────────────────────┘
                                                      │ REST JSON (HTTP / CORS)
                                                      ▼
                               ┌────────────────────────────────────────────────┐
                               │             InvestDeskPro Backend              │
                               │          (FastAPI + Pydantic v2 Engine)        │
                               │          [In-Memory Cache: TTL 600s]           │
                               └───────┬──────────────┬──────────────┬──────────┘
                                       │              │              │
                   ┌───────────────────┴──┐    ┌──────┴──────┐   ┌───┴────────────────┐
                   │ Company 360 & Factor │    │ AMFI Engine │   │ Portfolio Optimizer│
                   │ Diagnostic Scorecard │    │ 3Y Rolling  │   │ Inverse-Volatility │
                   │ + Forward Forecast   │    │ Alpha & DCR │   │ Risk-Parity & MRC  │
                   └───────────┬──────────┘    └──────┬──────┘   └───┬────────────────┘
                               │                      │              │
                               ▼                      ▼              ▼
                    ┌─────────────────────┐    ┌─────────────┐   ┌────────────────────┐
                    │ Yahoo Finance API   │    │  AMFI API   │   │ Historical Price & │
                    │ (NSE/BSE Financials)│    │ (api.mfapi) │   │ Covariance Matrix  │
                    └─────────────────────┘    └─────────────┘   └────────────────────┘
```

---

## 🧠 Quantitative & Mathematical Formulations

### 1. Orthogonal Stock Factor Scoring (0–100)
$$S_{\text{total}} = S_{\text{Quality}} (40\text{ pts}) + S_{\text{Value}} (30\text{ pts}) + S_{\text{Momentum/Low-Vol}} (30\text{ pts})$$

- **Quality Score ($S_{\text{Quality}} \le 40$)**: Evaluates Return on Equity ($\text{ROE} \ge 20\% \to 10\text{ pts}$), Capital Efficiency ($\text{ROCE} \ge 18\% \to 8\text{ pts}$), Leverage ($D/E \le 0.30 \to 8\text{ pts}$), FCF Conversion ($\text{FCF}/\text{PAT} \ge 0.80 \to 7\text{ pts}$), and Operating Margin ($\text{OPM} \ge 20\% \to 7\text{ pts}$).
- **Value Score ($S_{\text{Value}} \le 30$)**: Evaluates Trailing P/E ($P/E \le 15.0 \to 12\text{ pts}$), PEG Ratio ($\text{PEG} \le 1.0 \to 10\text{ pts}$), and Price-to-Book ($P/B \le 2.0 \to 8\text{ pts}$).
- **Momentum & Low-Vol Score ($S_{\text{Momentum}} \le 30$)**: Evaluates 6M Return ($R_{6M} \ge 20\% \to 10\text{ pts}$), 1Y Return ($R_{1Y} \ge 25\% \to 10\text{ pts}$), and 60-Day Realized Annualized Volatility ($\sigma_{60} \le 18.0\% \to 10\text{ pts}$).

### 2. Forward Growth & Target Price Compounding
- **Top-Line Blended Growth ($g$)**:
  $$g_{\text{base}} = 0.40 \times \text{CAGR}_{3Y}^{\text{Rev}} + 0.35 \times \text{CAGR}_{5Y}^{\text{Rev}} + 0.25 \times \text{SGR}, \quad \text{where } \text{SGR} = \text{ROE} \times (1 - \text{Payout Ratio})$$
- **Mean-Reverting Net Profit Margin ($NPM$)**:
  $$NPM_{\text{base}} = 0.65 \times \text{NPM}_{\text{Latest}} + 0.35 \times \text{NPM}_{\text{5Y Avg}}$$
- **Forward Horizon Projections ($t \in \{1, 2, 3\}$)**:
  $$\text{Revenue}_t = \text{Revenue}_0 \times (1 + g)^t \qquad \text{PAT}_t = \text{Revenue}_t \times NPM \qquad \text{EPS}_t = \text{EPS}_0 \times \left(\frac{\text{PAT}_t}{\text{PAT}_0}\right)$$
  $$\text{Target Price}_t = \text{EPS}_t \times \text{Exit P/E} \qquad \text{Implied CAGR}_t = \left(\frac{\text{Target Price}_t}{\text{CMP}}\right)^{\frac{1}{t}} - 1$$

### 3. AMFI Mutual Fund Rolling Alpha & Risk Metrics
- **3-Year Rolling Alpha ($756\text{ trading days}$)**:
  $$\text{Alpha}_{3Y}(t) = \left[\left(\frac{\text{NAV}_t}{\text{NAV}_{t-756}}\right)^{\frac{1}{3}} - \left(\frac{\text{Bench}_t}{\text{Bench}_{t-756}}\right)^{\frac{1}{3}}\right] \times 100\%$$
- **Downside Capture Ratio ($\text{DCR}$)**:
  $$\text{DCR} = \frac{\prod_{t \in \mathcal{D}} (1 + r_{\text{fund},t}) - 1}{\prod_{t \in \mathcal{D}} (1 + r_{\text{bench},t}) - 1} \times 100\%, \quad \text{where } \mathcal{D} = \{ t \mid r_{\text{bench},t} < 0 \}$$
- **Information Ratio ($\text{IR}$)**:
  $$\text{IR} = \frac{\bar{R}_{\text{active, ann}}}{\text{Tracking Error}_{\text{ann}}} = \frac{\frac{252}{N}\sum (r_{\text{fund},t} - r_{\text{bench},t})}{\sqrt{252} \cdot \text{std}(r_{\text{fund},t} - r_{\text{bench},t})}$$

### 4. Inverse-Volatility Risk-Parity Allocation
- **Raw Volatility Weights**:
  $$\sigma_i = \sqrt{252 \cdot \text{Var}(r_i)}, \quad w_i^{\text{raw}} = \frac{1 / \sigma_i}{\sum_{j=1}^N (1 / \sigma_j)}$$
- **Marginal & Percent Risk Contribution**:
  $$\text{MRC}_i = \frac{(\Sigma_{\text{ann}} w)_i}{\sigma_p}, \qquad \text{PRC}_i = \frac{w_i \cdot \text{MRC}_i}{\sigma_p} \times 100\%$$

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com) (Python 3.11) | Async REST API with in-memory caching |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev) | Strict schema contracts for all API endpoints |
| **Quantitative Engines** | NumPy, Pandas, SciPy | Mathematical modeling, matrix ops & rolling statistics |
| **Market Data** | yfinance & AMFI Open Endpoints | Live equities, historical OHLCV & mutual fund NAVs |
| **Testing** | [Pytest](https://pytest.org) | 25 automated unit tests with full coverage |
| **Frontend Framework** | [Next.js 15](https://nextjs.org) (App Router) | React 19, TypeScript, Server & Client Components |
| **Styling & Theme** | [Tailwind CSS](https://tailwindcss.com) | Institutional dark glassmorphic UI terminal |
| **Visualizations** | [Recharts](https://recharts.org) | Responsive synchronized area charts, bars & valuation bands |
| **Containerization** | Docker Multi-Stage | Lean Alpine/Slim deployment containers |
| **Cloud Hosting** | Render Blueprint (`render.yaml`) | Automated dual-service web deployment |

---

## 📁 Repository Structure

```text
investdeskpro/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app, CORS, routes & /health
│   │   ├── schemas.py              # Pydantic v2 data models for all responses
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── company_deep.py     # 360° overview, forensic checks & verified peers
│   │   │   ├── growth_forecast.py  # 1-3Y forward earnings & growth engine
│   │   │   ├── factors.py          # 0-100 Quality (40), Value (30), Momentum (30)
│   │   │   ├── mf_engine.py        # AMFI NAV parsing, 3Y rolling alpha, DCR/UCR
│   │   │   ├── portfolio.py        # Inverse-volatility risk parity & simplex cap
│   │   │   └── screener_engine.py  # Multi-criteria screening & thematic bundles
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── company.py          # GET /api/v1/company/{ticker}, /history, /forecast
│   │       ├── stocks.py           # GET /api/v1/stocks/{ticker}
│   │       ├── funds.py            # GET /api/v1/funds/{scheme_code} & /search
│   │       └── optimizer.py        # GET & POST /api/v1/portfolio/optimize
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_company.py         # Tests for Company 360, DCF, history & search
│   │   ├── test_forecast.py        # Tests for 1-3Y forward CAGR & math formulations
│   │   ├── test_factors.py         # Tests for factor calculations & scoring bounds
│   │   ├── test_mf_engine.py       # Tests for AMFI parsing & rolling alpha
│   │   └── test_portfolio.py       # Tests for risk parity, caps & covariance
│   ├── Dockerfile                  # Multi-stage Python 3.11 container
│   ├── pytest.ini                  # Pytest test discovery config
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Dark theme & glassmorphic utilities
│   │   │   ├── layout.tsx          # Root layout & metadata
│   │   │   └── page.tsx            # Dashboard shell, omni-search & tab switcher
│   │   ├── components/
│   │   │   ├── Header.tsx          # Navigation bar, live indicator & tabs
│   │   │   ├── Company360View.tsx  # Scorecard, Warning Badges, Forecast & Peers
│   │   │   ├── StockScorecardView.tsx   # 0-100 Factor Diagnostic View
│   │   │   ├── FundAnalyzerView.tsx     # AMFI Mutual Fund Alpha View
│   │   │   └── PortfolioOptimizerView.tsx # Risk-Parity Allocation View
│   │   └── lib/
│   │       └── api.ts              # Type-safe API client with timeout protection
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── .gitignore
├── render.yaml                     # Render Blueprint IaC specification
├── USERGUIDE.md                    # In-depth User Guide & Playbook
└── README.md                       # Complete Technical & Functional Specification
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

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run test suite to verify quantitative engines
pytest -v

# Start FastAPI server on port 8005
uvicorn app.main:app --reload --port 8005
```

- **API Base URL**: `http://127.0.0.1:8005`
- **Swagger Docs**: [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs)
- **Healthcheck**: [http://127.0.0.1:8005/health](http://127.0.0.1:8005/health)

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

- **Frontend App**: `http://localhost:3000` (or `http://localhost:3001` / `3005`)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck returning backend status, UTC timestamp, and version. |
| `GET` | `/api/v1/company/omni-search?q={query}` | Global auto-complete searching Indian stocks & AMFI mutual funds. |
| `GET` | `/api/v1/company/{ticker}` | Returns complete Company 360° overview, forensic checks, warning badges, and forecast. |
| `GET` | `/api/v1/company/{ticker}/history?timeframe={1y\|3y\|5y\|max}` | Multi-timeframe price history, moving averages, and valuation bands (P/E & P/B). |
| `GET` | `/api/v1/company/{ticker}/forecast` | Dedicated 1Y, 2Y, 3Y Forward Growth, EPS, Target Prices, and Driver Attribution. |
| `GET` | `/api/v1/stocks/{ticker}` | Orthogonal 0–100 Quality, Value, and Momentum factor score breakdown. |
| `GET` | `/api/v1/funds/search?q={query}` | Searches AMFI mutual fund schemes by name or 6-digit scheme code. |
| `GET` | `/api/v1/funds/{scheme_code}` | Computes 3Y Rolling Alpha, DCR, UCR, Sortino Ratio, and NAV history. |
| `GET` | `/api/v1/portfolio/optimize?tickers=...&max_weight=15` | Computes inverse-volatility risk-parity weights, MRC, PRC, and covariance matrix. |

### cURL Quick Examples

```bash
# 1. Fetch Company 360 & Forward Forecast for TCS
curl -X GET "http://127.0.0.1:8005/api/v1/company/TCS" -H "Accept: application/json"

# 2. Fetch Multi-Timeframe Valuation Bands (5Y) for RELIANCE
curl -X GET "http://127.0.0.1:8005/api/v1/company/RELIANCE/history?timeframe=5y" -H "Accept: application/json"

# 3. Analyze AMFI Mutual Fund Rolling Alpha (Parag Parikh Flexi Cap)
curl -X GET "http://127.0.0.1:8005/api/v1/funds/122639" -H "Accept: application/json"

# 4. Optimize Risk-Parity Basket
curl -X GET "http://127.0.0.1:8005/api/v1/portfolio/optimize?tickers=RELIANCE&tickers=TCS&tickers=HDFCBANK&tickers=INFY&tickers=ITC&tickers=LT&max_weight=15" -H "Accept: application/json"
```

---

## 🧪 Testing & Quality Assurance

InvestDeskPro maintains an automated Pytest test suite covering all quantitative engines, factor bounds, DCF sensitivity matrices, forecasting formulations, AMFI parsing, and portfolio optimization:

```bash
cd backend
pytest -v
```

```text
======================== 25 passed in 25.67s ========================
```

---

## 🐳 Production Deployment (Render & Docker)

This repository includes a native [`render.yaml`](./render.yaml) Blueprint:

1. Push your code to GitHub.
2. Log into [Render](https://render.com) and click **New +** -> **Blueprint**.
3. Select your `InvestDeskPro` repository.
4. Render will deploy:
   - **`investdeskpro-api`**: FastAPI Web Service containerized with Docker and auto-healing healthchecks.
   - **`investdeskpro-dashboard`**: Next.js 15 App Router Frontend connected to the backend service.

---

## ⚖️ Attribution & Disclaimer

- **Created & Engineered by**: **Sandesh Rathi**
- **Ecosystem Integration**: Powered by [rupeemap.in](https://rupeemap.in)
- **Data Sources**: Association of Mutual Funds in India (AMFI), National Stock Exchange of India (NSE), and Bombay Stock Exchange (BSE).
- **Disclaimer**: *InvestDeskPro is designed strictly for quantitative research and educational analysis. It does not constitute financial, investment, legal, or tax advice. Market investments are subject to market risks. Please read all scheme-related documents carefully and consult a SEBI-registered investment advisor before making any financial decisions.*
