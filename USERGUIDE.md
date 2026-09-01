# InvestDeskPro 📖 Comprehensive User Guide & Quantitative Playbook

**InvestDeskPro** is an institutional-grade quantitative investment intelligence platform built specifically for Indian Equities (NSE/BSE) and AMFI Mutual Funds. 

*Created & Engineered by **Sandesh Rathi** • Powered by [rupeemap.in](https://rupeemap.in)*

---

## 📑 Table of Contents

1. [Executive Introduction & Quantitative Philosophy](#1-executive-introduction--quantitative-philosophy)
2. [Interface Overview & Global Controls](#2-interface-overview--global-controls)
3. [Module 1: Indian Stock Diagnostic Factor Scorecard](#3-module-1-indian-stock-diagnostic-factor-scorecard)
   - [Searching Tickers & Normalization](#searching-tickers--normalization)
   - [The 0–100 Rating & Verdict Tiers](#the-0100-rating--verdict-tiers)
   - [Deep Dive: The Three Orthogonal Pillars](#deep-dive-the-three-orthogonal-pillars)
   - [Key Financial Ratios Matrix](#key-financial-ratios-matrix)
   - [Historical 1-Year Price Trend Chart](#historical-1-year-price-trend-chart)
4. [Module 2: AMFI Mutual Fund Rolling Alpha & Risk Engine](#4-module-2-amfi-mutual-fund-rolling-alpha--risk-engine)
   - [Why Rolling Alpha Beats Trailing Returns](#why-rolling-alpha-beats-trailing-returns)
   - [Searching 40,000+ AMFI Schemes](#searching-40000-amfi-schemes)
   - [Core Quantitative Metrics Explained](#core-quantitative-metrics-explained)
   - [Interpreting the 3-Year Rolling Alpha Chart](#interpreting-the-3-year-rolling-alpha-chart)
5. [Module 3: Inverse-Volatility Risk-Parity Optimizer](#5-module-3-inverse-volatility-risk-parity-optimizer)
   - [The Risk-Parity Philosophy](#the-risk-parity-philosophy)
   - [Constructing Baskets & Using Presets](#constructing-baskets--using-presets)
   - [Enforcing Allocation Caps ($5\% - 35\%$)](#enforcing-allocation-caps-5---35)
   - [Asset Weights vs Percent Risk Contribution (PRC)](#asset-weights-vs-percent-risk-contribution-prc)
   - [Asset Allocation & Volatility Matrix](#asset-allocation--volatility-matrix)
6. [Practical Quantitative Investment Playbooks](#6-practical-quantitative-investment-playbooks)
   - [Playbook A: Screening for High-Quality Compounders](#playbook-a-screening-for-high-quality-compounders)
   - [Playbook B: Institutional Mutual Fund Manager Due Diligence](#playbook-b-institutional-mutual-fund-manager-due-diligence)
   - [Playbook C: Building a Low-Drawdown Indian Bluechip Portfolio](#playbook-c-building-a-low-drawdown-indian-bluechip-portfolio)
7. [Developer & Quant API Integration Guide](#7-developer--quant-api-integration-guide)
8. [Frequently Asked Questions (FAQ) & Troubleshooting](#8-frequently-asked-questions-faq--troubleshooting)
9. [Regulatory Disclaimer](#9-regulatory-disclaimer)

---

## 1. Executive Introduction & Quantitative Philosophy

Retail and institutional investors in India face two recurring challenges:
1. **End-Point Bias in Returns**: A mutual fund or stock may boast high 3-year returns simply because a single rally took place 30 months ago, masking severe ongoing underperformance.
2. **Volatility Blind Spots**: Standard portfolio allocations (market-cap or equal-weighted) concentrate risk in high-beta, volatile cyclical stocks, leading to severe drawdowns during market corrections.

**InvestDeskPro** eliminates emotional bias and replaces guesswork with empirical mathematics:
- **Orthogonal Multi-Factor Modeling**: Evaluates stocks across uncorrelated dimensions (Balance Sheet Quality, Valuation Multiples, and Price Momentum).
- **Rolling Multi-Year Window Analysis**: Tests mutual fund outperformance across hundreds of shifting 36-month windows rather than a single static period.
- **Risk-Parity Capital Allocation**: Balances risk contributions so no single high-volatility stock dominates total portfolio risk.

---

## 2. Interface Overview & Global Controls

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ NIFTY 50 +0.68%  •  SENSEX +0.55%  •  NIFTY BANK +0.82%  •  INDIA VIX -3.15% | [rupeemap.in] 🟢 FastAPI Live │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 💠 InvestDeskPro  INSTITUTIONAL QUANT [rupeemap.in]       [Stock Scorecard] [Fund Alpha] [Risk Parity]  │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│                                  Active Quantitative View Content                                      │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Elements:
- **Top Market Ribbon**: Real-time live status for major Indian indices (**NIFTY 50**, **SENSEX**, **NIFTY BANK**, and **INDIA VIX**).
- **API Health Indicator**: Real-time pulsing badge verifying that the high-performance FastAPI quant engine is active.
- **Ecosystem Link**: Direct quick-access pill to [rupeemap.in](https://rupeemap.in).
- **Navigation Tabs**: Seamlessly toggle between:
  1. 📊 **Stock Scorecard**
  2. 📈 **Mutual Fund Rolling Alpha**
  3. 🥧 **Risk-Parity Optimizer**

---

## 3. Module 1: Indian Stock Diagnostic Factor Scorecard

The **Stock Scorecard** provides an institutional factor analysis for any stock listed on the National Stock Exchange (NSE) or Bombay Stock Exchange (BSE).

```
                      Composite Score (0 - 100)
             ┌───────────────────┼───────────────────┐
             │                   │                   │
      Quality (Max 40)    Value (Max 30)     Momentum (Max 30)
      • ROE               • Trailing P/E     • 6M Momentum
      • ROCE / ROA        • PEG Ratio        • 1Y Return
      • Debt / Equity     • Price to Book    • 60D Realized Vol
      • Cash Conversion
      • Profit Margins
```

### Searching Tickers & Normalization
- You can enter the plain ticker symbol (e.g. `TATAMOTORS`, `RELIANCE`, `INFY`, `HDFCBANK`, `ITC`, `LT`).
- The system automatically handles `.NS` (NSE) and `.BO` (BSE) suffixes and falls back to alternate exchange feeds if secondary listings are needed.
- Click any of the **Quick Preset Tickers** (`TATAMOTORS`, `RELIANCE`, `INFY`, `TCS`, `HDFCBANK`, `ITC`, `LT`) for instant loading.

### The 0–100 Rating & Verdict Tiers

| Score Range | Verdict | Institutional Interpretation |
| :--- | :--- | :--- |
| **75.0 – 100.0** | **High Quality Compounder (Strong Buy)** | Pristine balance sheet, strong return on capital, high cash conversion, attractive valuation, and stable momentum. |
| **60.0 – 74.9** | **Favorable Fundamental Momentum (Buy)** | Solid fundamentals with robust price momentum or attractive valuation multiples. |
| **45.0 – 59.9** | **Neutral / Core Accumulation (Hold)** | Stable core holding; fair valuation with average capital efficiency or moderate debt. |
| **30.0 – 44.9** | **Elevated Valuation / Quality Concerns (Underweight)** | Either rich multiples without growth support, high financial leverage, or declining margins. |
| **0.0 – 29.9** | **High Risk / Negative Fundamentals (Avoid)** | Weak return on equity, high leverage ($D/E > 2.0$), negative cash flow, or heavy price drawdowns. |

---

### Deep Dive: The Three Orthogonal Pillars

#### 1. Quality Pillar (Max 40 Points)
Measures balance sheet strength, profitability, and capital efficiency:
- **Return on Equity (ROE)**: Measures net profit generated per rupee of shareholders' equity. $>20\% \to 10\text{ pts}$, $>15\% \to 8\text{ pts}$.
- **Capital Return (ROCE / ROA)**: Capital efficiency metric. $>18\% \to 8\text{ pts}$, $>12\% \to 6\text{ pts}$.
- **Financial Leverage ($D/E$)**: Debt-to-Equity ratio. Debt is penalized non-linearly: $D/E \le 0.30 \to 8\text{ pts}$ (pristine/cash-rich), $D/E > 2.0 \to 0\text{ pts}$ (high default risk).
- **Cash Conversion ($FCF / \text{Net Profit}$)**: Ratio of Free Cash Flow to Net Profit. $>0.80 \to 7\text{ pts}$ indicates high accounting quality and real cash generation.
- **Operating / Net Margin**: Pricing power and operational leverage. $>20\% \to 7\text{ pts}$.

#### 2. Value Pillar (Max 30 Points)
Prevents overpaying for earnings:
- **Trailing P/E Ratio**: $P/E \le 15.0 \to 12\text{ pts}$, $15.0 < P/E \le 24.0 \to 9\text{ pts}$, $P/E > 60.0 \to 0\text{ pts}$.
- **PEG Ratio (P/E to Growth)**: Adjusts P/E for earnings growth rate. $\text{PEG} \le 1.0 \to 10\text{ pts}$ (undervalued relative to growth), $\text{PEG} > 2.5 \to 0\text{ pts}$.
- **Price-to-Book ($P/B$)**: $\le 2.0 \to 8\text{ pts}$, $\le 4.0 \to 6\text{ pts}$.

#### 3. Momentum & Low-Volatility Pillar (Max 30 Points)
Validates market confirmation and risk control:
- **6-Month Price Return**: Momentum over ~126 trading days. $>20\% \to 10\text{ pts}$, $>10\% \to 8\text{ pts}$.
- **1-Year Price Return**: Trend sustainability. $>25\% \to 10\text{ pts}$, $>12\% \to 8\text{ pts}$.
- **60-Day Realized Annualized Volatility**: Price stability metric. $\sigma_{60} \le 18\% \to 10\text{ pts}$, $\sigma_{60} \le 25\% \to 8\text{ pts}$, $\sigma_{60} > 45\% \to 0\text{ pts}$.

---

### Key Financial Ratios Matrix

The dashboard displays a structured 8-factor financial matrix:
- **ROE & ROCE**: Direct operational return metrics.
- **Debt to Equity**: Balance sheet leverage.
- **Trailing P/E & PEG**: Valuation metrics.
- **Price to Book**: Asset-backing multiple.
- **6M Return & 60D Realized Volatility**: Market risk profile.

### Historical 1-Year Price Trend Chart
An interactive, high-resolution area chart rendered via Recharts displaying daily closing prices on NSE/BSE with hover tooltips and 1-year total percentage return badge.

---

## 4. Module 2: AMFI Mutual Fund Rolling Alpha & Risk Engine

```text
                  AMFI Daily NAV (10+ Years History)
                                  │
                                  ▼
      ┌───────────────────────────────────────────────────────┐
      │  Synchronize with Nifty 50 TRI Benchmark (^NSEI)      │
      └───────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
      ┌───────────────────────────────────────────────────────┐
      │  Compute 3-Year Rolling Alpha (756 Trading Days)      │
      │  Alpha_3Y(t) = Fund_CAGR_3Y(t) - Nifty_CAGR_3Y(t)     │
      └───────────────────────────┬───────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
  Alpha Consistency %     Downside Capture        Information Ratio
  (% periods Alpha > 0)   (Loss vs Benchmark)    (Active Return / TE)
```

### Why Rolling Alpha Beats Trailing Returns
Traditional fact sheets show a static "3-Year Return: 18.5%". This metric is easily distorted if the start date was during a market bottom or the end date coincided with a peak. 

**Rolling Alpha** calculates the 3-year annualized excess return across *every single trading day* over the scheme's history. This proves whether a fund manager consistently creates true alpha or merely caught a single lucky trend.

---

### Searching 40,000+ AMFI Schemes
1. Enter any fund keyword in the search bar (e.g. `Parag Parikh`, `Mirae Large Cap`, `HDFC Top 100`, `Quant Active`, `SBI Small Cap`).
2. Click **Search AMFI** to query the live AMFI scheme database.
3. Select the scheme from the instant autocomplete dropdown list.
4. Or use the **Popular Schemes** preset pills for one-click access.

---

### Core Quantitative Metrics Explained

| Metric | Target / Benchmark | Description |
| :--- | :--- | :--- |
| **Mean 3Y Rolling Alpha** | $> +3.0\%$ | Average annual excess return generated over Nifty 50 TRI across all 3-year holding periods. |
| **Alpha Consistency %** | $> 75.0\%$ | The percentage of historical 3-year rolling windows where the fund outperformed Nifty 50 TRI. |
| **Downside Capture Ratio (DCR)** | $< 85.0\%$ (**Elite Shield**) | How much the fund drops when Nifty 50 drops. If Nifty drops $-10\%$ and the fund drops $-7.5\%$, $\text{DCR} = 75\%$. Lower is better. |
| **Upside Capture Ratio (UCR)** | $> 100.0\%$ | How much the fund gains when Nifty 50 gains. |
| **Information Ratio (IR)** | $> 0.50$ | Active Return divided by Tracking Error. Measures manager skill per unit of excess risk taken. |
| **Sharpe Ratio** | $> 1.00$ | Excess return over 6.5% Indian risk-free rate divided by annualized standard deviation. |
| **Sortino Ratio** | $> 1.50$ | Excess return divided by *downside volatility* only (does not penalize upside volatility). |
| **Max Drawdown** | As low as possible | Maximum historical peak-to-trough decline experienced by the fund. |

---

### Interpreting the 3-Year Rolling Alpha Chart

- **Zero Line (Dashed Reference Line)**: Represents the Nifty 50 TRI benchmark.
- **Green Area Above 0%**: Periods of active manager outperformance.
- **Area Below 0%**: Periods of benchmark lag.
- **Hover Tooltip**: Inspect exact historical dates and point-in-time 3-year alpha values.

---

## 5. Module 3: Inverse-Volatility Risk-Parity Optimizer

```text
              Asset Basket: [RELIANCE, TCS, HDFCBANK, INFY, ITC, LT]
                                        │
                                        ▼
                  Historical Daily Price Covariance Matrix (Σ)
                                        │
                                        ▼
                   Raw Inverse Volatility: w_i ~ 1 / σ_i
                                        │
                                        ▼
           Iterative Simplex Projection with Max Weight Cap (e.g. 15%)
                                        │
                                        ▼
    ┌───────────────────────────────────┼───────────────────────────────────┐
    │                                   │                                   │
    ▼                                   ▼                                   ▼
Optimal Asset Weights         % Risk Contribution (PRC)            Volatility Reduction
(Sum = 100.0%)               (Balances Marginal Risk)             (vs Equal Weight Benchmark)
```

### The Risk-Parity Philosophy
In traditional portfolios, high-volatility stocks (e.g. beta 1.8) generate over 60–70% of total portfolio risk, even when equal capital is invested. 

**Risk-Parity** weights assets inversely proportional to their realized volatility ($\sigma_i$), ensuring that lower-volatility stocks receive larger capital allocations and volatile stocks are scaled back. This creates a smoother equity curve with reduced portfolio drawdowns.

---

### Constructing Baskets & Using Presets

1. **Add Custom Stock**: Type any NSE/BSE ticker into the input box and click **Add Stock**.
2. **Remove Stock**: Click the **X** icon on any active ticker chip.
3. **One-Click Institutional Presets**:
   - **Nifty Tech Leaders**: `TCS`, `INFY`, `WIPRO`, `HCLTECH`, `TECHM`
   - **Financial Powerhouses**: `HDFCBANK`, `ICICIBANK`, `SBIN`, `KOTAKBANK`, `AXISBANK`
   - **Defensive FMCG & Pharma**: `ITC`, `HINDUNILVR`, `NESTLEIND`, `SUNPHARMA`, `CIPLA`
   - **Diversified Bluechips**: `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `ICICIBANK`, `BHARTIARTL`, `ITC`, `LT`

---

### Enforcing Allocation Caps ($5\% - 35\%$)

Use the **Max Weight Cap Slider** to set individual stock constraints:
- **Default Cap**: $15\%$ (Standard institutional risk limit).
- **Iterative Simplex Projection**: If an asset's raw inverse-volatility weight exceeds the cap, the algorithm fixes it at the cap and re-distributes the remaining weight proportionally across uncapped assets without violating $\sum w_i = 100\%$.

---

### Asset Weights vs Percent Risk Contribution (PRC)

The dashboard presents two coordinated visual charts:
1. **Target Asset Allocations (Donut Chart)**: Visualizes exact capital percentage per stock.
2. **Weight vs Risk Contribution (Bar Chart)**: Compares nominal capital weight ($\%$) against actual risk contribution ($\%$).
   - In a balanced risk-parity portfolio, the risk contribution of each asset stays closely aligned, preventing concentration risk.

---

### Asset Allocation & Volatility Matrix

The detailed summary table provides:
- **Target Weight (%)**: The final cap-constrained allocation.
- **Uncapped Weight (%)**: Pure inverse-volatility weight.
- **1Y Realized Volatility (%)**: Annualized price volatility.
- **Risk Contribution (%)**: Percentage contribution to overall portfolio risk.
- **1Y Historical Return (%)**: Point-to-point trailing 1-year total return.

---

## 6. Practical Quantitative Investment Playbooks

### Playbook A: Screening for High-Quality Compounders

```text
Goal: Identify resilient Indian companies with pricing power and pristine balance sheets.
```

1. Navigate to **Stock Scorecard**.
2. Enter target candidate (e.g. `TCS`, `HINDUNILVR`, `TITAN`).
3. Check the **Composite Score**:
   - Must be $\ge 75.0$ (**High Quality Compounder**).
4. Verify Pillar Sub-scores:
   - **Quality $\ge 32/40$**: Confirm $ROE \ge 18\%$ and Debt-to-Equity $\le 0.30$.
   - **Value $\ge 18/30$**: Avoid speculative bubbles ($\text{PEG} \le 1.8$).
   - **Momentum $\ge 20/30$**: Ensure 60D Realized Volatility is $\le 22\%$.

---

### Playbook B: Institutional Mutual Fund Manager Due Diligence

```text
Goal: Separate true active manager alpha from temporary market luck.
```

1. Navigate to **Mutual Fund Rolling Alpha**.
2. Search for the scheme (e.g. `122639` for Parag Parikh Flexi Cap).
3. Evaluate the 3 Key Criteria:
   - **Mean 3Y Rolling Alpha**: Is it $> +2.5\%$ per year above Nifty 50 TRI?
   - **Alpha Consistency**: Is it $> 80\%$? (The manager beats the index 8 out of 10 times).
   - **Downside Capture**: Is it $< 85\%$? (The fund acts as an effective capital shield during bear markets).
4. Review **Information Ratio**: A score $> 0.50$ confirms institutional manager skill.

---

### Playbook C: Building a Low-Drawdown Indian Bluechip Portfolio

```text
Goal: Construct an all-weather equity basket with minimal portfolio volatility.
```

1. Navigate to **Risk-Parity Optimizer**.
2. Click the **Diversified Bluechips** preset (`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `ICICIBANK`, `BHARTIARTL`, `ITC`, `LT`).
3. Set the **Max Weight Cap** to `15%`.
4. Observe the **Volatility Reduction**:
   - Compare Risk-Parity Volatility against the Equal-Weight baseline.
   - Typically achieves a **10% to 25% reduction** in portfolio risk while maintaining equity compounding upside.
5. Execute portfolio rebalancing according to the computed **Target Weights**.

---

## 7. Developer & Quant API Integration Guide

InvestDeskPro exposes clean, typed RESTful endpoints that can be integrated into algorithmic trading bots, Python notebooks, or quantitative research pipelines.

### Python Quick Example:

```python
import requests

BASE_URL = "http://127.0.0.1:8005/api/v1"

# 1. Fetch Stock Scorecard
stock_resp = requests.get(f"{BASE_URL}/stocks/TATAMOTORS")
stock_data = stock_resp.json()
print(f"Ticker: {stock_data['ticker']} | Score: {stock_data['total_score']} | Verdict: {stock_data['verdict']}")

# 2. Fetch Mutual Fund Rolling Alpha
fund_resp = requests.get(f"{BASE_URL}/funds/122639")
fund_data = fund_resp.json()
print(f"Fund: {fund_data['meta']['scheme_name']}")
print(f"Mean 3Y Alpha: +{fund_data['stats']['mean_3y_rolling_alpha']}% | DCR: {fund_data['stats']['downside_capture_ratio']}%")

# 3. Optimize Portfolio with Risk Parity
payload = {
    "tickers": ["TCS", "INFY", "HDFCBANK", "RELIANCE", "ITC"],
    "max_weight": 20.0
}
opt_resp = requests.post(f"{BASE_URL}/portfolio/optimize", json=payload)
opt_data = opt_resp.json()
print(f"Total Portfolio Volatility: {opt_data['total_portfolio_volatility']}%")
for alloc in opt_data["allocations"]:
    print(f"  {alloc['ticker']}: {alloc['weight_pct']}% (Risk Contribution: {alloc['risk_contribution_pct']}%)")
```

---

## 8. Frequently Asked Questions (FAQ) & Troubleshooting

### Q1: What data sources does InvestDeskPro use?
- **Mutual Funds**: Daily NAV data is pulled directly from the official **AMFI** open data repository (`api.mfapi.in`), covering all active Indian mutual fund direct and regular schemes.
- **Indian Equities & Benchmarks**: Real-time and historical price actions, fundamentals, and financial statements are fetched via NSE/BSE feeds (`^NSEI` for Nifty 50 TRI).

### Q2: Why does a stock score show "N/A" for some ratios?
Certain financial ratios (e.g. Debt-to-Equity for banking institutions like HDFC Bank or ICICI Bank) are not applicable in standard non-financial formats. InvestDeskPro uses robust neutral fallbacks to prevent distorting the composite score.

### Q3: How often should I rebalance a Risk-Parity portfolio?
For retail and high-net-worth investors, **quarterly or semi-annual rebalancing** is typically optimal to capture shifts in realized volatility without incurring excessive transaction costs or short-term capital gains tax.

### Q4: The API status indicator shows "Connecting..."
Ensure that the backend FastAPI server is running (`uvicorn app.main:app --port 8005`) and that `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to the correct backend host and port.

---

## 9. Regulatory Disclaimer

**InvestDeskPro** is an analytical and quantitative research tool developed for educational and institutional research purposes. 

- This software does **not** provide personal investment advice, buy/sell recommendations, or portfolio management services under SEBI regulations.
- Past performance, rolling alpha calculations, and backtested risk-parity metrics do not guarantee future returns.
- Equity and mutual fund investments are subject to market risks. Users should conduct their own independent diligence or consult a qualified **SEBI-Registered Investment Advisor (RIA)** before executing financial transactions.

---

*InvestDeskPro • Engineered by **Sandesh Rathi** • Powered by [rupeemap.in](https://rupeemap.in)*
