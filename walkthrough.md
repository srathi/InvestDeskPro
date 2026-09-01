# InvestDeskPro Walkthrough: Quantitative Factor Engine, Screener Financials & Stock Classification

InvestDeskPro has been enhanced with Screener.in-grade financial statements, dynamic PEG ratio derivation, shareholding pattern analysis, institutional stock classification (Growth vs. Quality vs. Value), a 32-query alias autocompletion engine, and Rupeemap ecosystem badging.

---

## Key Features Implemented

### 1. Dynamic Multi-Tier PEG Ratio Engine
- **Problem**: Yahoo Finance frequently returns `None` or `N/A` for PEG ratios of Indian equities.
- **Solution**: Implemented a multi-tier quantitative derivation:
  $$\text{PEG} = \frac{\text{Trailing P/E}}{\text{YoY Net Profit / EPS Growth \%}}$$
  *Fallback*: If single-year growth is volatile or negative, utilizes **3-Year Profit CAGR**, **YoY Revenue Growth**, or **3-Year Revenue CAGR**.
- **Color-Coded Diagnostic Tiers**:
  - `PEG < 1.0`: 🟢 Undervalued Growth Opportunity
  - `PEG 1.0 - 1.8`: 🔵 Fair Growth Value
  - `PEG 1.8 - 2.5`: 🟡 High Growth Premium
  - `PEG > 2.5`: 🔴 Stretched Growth Multiple

---

### 2. Screener.in-Grade Annual Financial Statements
- Full historical multi-year financial statements extracted from live income statements:
  - **Sales / Revenue (₹ Crores)**
  - **YoY Sales Growth (%)**
  - **Operating Profit / EBITDA (₹ Crores)**
  - **Operating Profit Margin (OPM %)**
  - **Net Profit (₹ Crores)**
  - **YoY Net Profit Growth (%)**
  - **Net Profit Margin (NPM %)**
  - **Earnings Per Share (EPS in ₹)**
- Automatically formats clean fiscal years (`FY23`, `FY24`, `FY25`, `FY26`).

---

### 3. Screener & Trendlyne-Style Shareholding Pattern
- Extracts and visualizes ownership structure:
  - **Promoters Holding (%)**
  - **Institutional Holding (%)** with **FII** and **DII / Mutual Funds** breakdown
  - **Public / Retail Holding (%)**
  - **Promoter Pledge (%)** (flags high risk if pledge > 10%)
- Includes an interactive **visual stacked ownership bar**.

---

### 4. Stock Archetype & Growth Classification Engine
- Automatically determines whether a stock qualifies as an institutional **Growth Stock**:
  - **Stock Archetypes**:
    - `🚀 High-Growth Compounder` (e.g. Piccadily Agro: +19.3% Rev CAGR, +83.2% Profit CAGR, 15.2% ROE)
    - `🛡️ Quality Defensive Anchor` (e.g. TCS: 47.7% ROE, D/E 0.10x)
    - `💎 Deep Value Opportunity` (Low P/E, Margin of Safety)
    - `💰 High Dividend Cash Cow` (e.g. Coal India: > 5% Dividend Yield)
    - `⚡ High-Beta Momentum Leader`
    - `🏛️ Core Mature Compounder` (e.g. Reliance)
  - Displays:
    - **Growth Stock Badge**: `YES / NO`
    - **Growth Factor Score**: `0–100` progress meter
    - **3-Year Revenue CAGR (%)** & **3-Year Net Profit CAGR (%)**
    - **Institutional Diagnostic Rationale**: Plain-English fundamental explanation.

---

### 5. Strict Ticker Validation Guard & 32-Query Alias Autocomplete
- **Validation Guard**: Verifies active trading history before generating scorecards. Invalid tickers (e.g. `PICC.NS`) immediately return **HTTP 404** with closest suggestions (`PICCADIL.NS`) and clear frontend error state without phantom scores.
- **Alias Autocomplete**: Supports popular aliases (`L&T`, `DMart`, `Zudio`, `Tanishq`, `HUL`, `SBI`, `Paytm`, `Blinkit`, `HAL`, `BEL`, `CDSL`, `IRCTC`, `RVNL`, `IRFC`, `IREDA`, `SUZLON`).

---

### 6. Rupeemap Ecosystem & SwingTradeDeskPro Badging
- Top ticker ribbon: `rupeemap.in • By Sandesh Rathi` + `⚡ SwingTradeDeskPro`.
- Clean subheader: `Indian Equities & Mutual Funds Intelligence Engine`.
- Institutional footer: Rupeemap suite links + `Created & Engineered by Sandesh Rathi`.

---

## Verification & Test Results

```bash
backend/.venv/bin/pytest
# ======================== 13 passed in 8.23s =========================
```

| Symbol | Company Name | Archetype | Growth Stock | 3Y Rev CAGR | 3Y Profit CAGR | PEG Ratio | Promoters % | Institutions % |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `PICCADIL.NS` | Piccadily Agro Industries | 🚀 High-Growth Compounder | **YES** | +19.3% | +83.2% | **1.30** | 73.23% | 0.15% |
| `TCS.NS` | Tata Consultancy Services | 🛡️ Quality Defensive Anchor | **NO** | +5.8% | +5.3% | **2.97** | 71.79% | 17.60% |
| `RELIANCE.NS` | Reliance Industries | 🏛️ Core Mature Compounder | **NO** | +6.4% | +6.6% | **0.82** | 51.80% | 28.04% |
