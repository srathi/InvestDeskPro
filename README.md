# InvestDeskPro 📈

**InvestDeskPro** is an institutional-grade quantitative investment intelligence and portfolio optimization platform specifically engineered for Indian Equities (NSE/BSE) and Mutual Funds (AMFI). Powered by [rupeemap.in](https://rupeemap.in) and created & engineered by **Sandesh Rathi**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Render](https://img.shields.io/badge/Deploy-Render_Blueprint-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Pytest](https://img.shields.io/badge/Tests-11_Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org)

---

## 📑 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [System Architecture](#-system-architecture)
- [Quantitative & Mathematical Formulations](#-quantitative--mathematical-formulations)
  - [1. Stock Diagnostic Factor Scorecard (0–100)](#1-stock-diagnostic-factor-scorecard-0100)
  - [2. AMFI Mutual Fund Rolling Alpha & Risk Engine](#2-amfi-mutual-fund-rolling-alpha--risk-engine)
  - [3. Inverse-Volatility Risk-Parity Optimizer](#3-inverse-volatility-risk-parity-optimizer)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [REST API Reference](#-rest-api-reference)
  - [Endpoints Summary](#endpoints-summary)
  - [cURL Examples](#curl-examples)
- [Docker Containerization](#-docker-containerization)
- [Production Deployment on Render](#-production-deployment-on-render)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [User Guide](#-user-guide)
- [Attribution & Disclaimer](#-attribution--disclaimer)

---

## 🌟 Overview & Value Proposition

Traditional retail investment tools in the Indian financial market often rely on point-to-point trailing returns (which suffer from end-point bias) and simple market-cap weighting (which over-allocates to volatile mega-caps). **InvestDeskPro** bridges the gap between retail investing and hedge-fund grade quantitative analysis by offering:

1. **Orthogonal Stock Factor Scoring (0–100)**: Evaluates Indian equities (NSE & BSE) across Quality (40%), Value (30%), and Momentum/Low-Volatility (30%) with automatic ticker normalization (`.NS` / `.BO`).
2. **AMFI Rolling Alpha & Downside Capture Engine**: Ingests direct NAV series across 40,000+ mutual fund schemes from AMFI open endpoints, dynamically aligns with the **Nifty 50 TRI (`^NSEI`)** benchmark, and calculates 3-Year Rolling Alpha, Alpha Consistency %, Information Ratio, Sortino Ratio, and Downside/Upside Capture ratios.
3. **Inverse-Volatility Risk-Parity Portfolio Optimizer**: Automatically distributes capital inversely proportional to realized asset volatility with an iterative simplex weight-cap constraint ($w_i \le \text{max\_weight}$, e.g. 15%), calculating Marginal Risk Contribution (MRC), Percent Risk Contribution (PRC), and full annualized covariance matrices.

---

## 🏛️ System Architecture

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
                               └───────┬──────────────┬──────────────┬──────────┘
                                       │              │              │
                    ┌──────────────────┴──┐    ┌──────┴──────┐   ┌───┴────────────────┐
                    │  Stock Scorecard    │    │ Fund Engine │   │ Portfolio Optimizer│
                    │  Quality / Value /  │    │ 3Y Rolling  │   │ Inverse-Volatility │
                    │  Momentum Scorecard │    │ Alpha & DCR │   │ Risk-Parity & MRC  │
                    └──────────┬──────────┘    └──────┬──────┘   └───┬────────────────┘
                               │                      │              │
                               ▼                      ▼              ▼
                    ┌─────────────────────┐    ┌─────────────┐   ┌────────────────────┐
                    │ Yahoo Finance API   │    │  AMFI API   │   │ Historical Price & │
                    │ (NSE/BSE Financials)│    │ (api.mfapi) │   │ Covariance Matrix  │
                    └─────────────────────┘    └─────────────┘   └────────────────────┘
```

---

## 🧠 Quantitative & Mathematical Formulations

### 1. Stock Diagnostic Factor Scorecard (0–100)

The composite stock score $S_{\text{total}} \in [0, 100]$ is computed as the sum of three orthogonal pillar scores:

$$S_{\text{total}} = S_{\text{Quality}} + S_{\text{Value}} + S_{\text{Momentum}}$$

#### A. Quality Pillar ($S_{\text{Quality}} \le 40\text{ pts}$)
- **Return on Equity ($\text{ROE}$)**:
  $$\text{Score}_{\text{ROE}} = \begin{cases} 10.0 & \text{if } \text{ROE} \ge 20\% \\ 8.0 & \text{if } 15\% \le \text{ROE} < 20\% \\ 5.0 & \text{if } 10\% \le \text{ROE} < 15\% \\ 2.0 & \text{if } 0\% < \text{ROE} < 10\% \\ 0.0 & \text{if } \text{ROE} \le 0\% \end{cases}$$
- **Capital Efficiency ($\text{ROCE} / \text{ROA}$)**: $\ge 18\% \to 8\text{ pts}$, $\ge 12\% \to 6\text{ pts}$, $\ge 8\% \to 4\text{ pts}$.
- **Debt-to-Equity ($D/E$)**:
  $$\text{Score}_{D/E} = \begin{cases} 8.0 & \text{if } D/E \le 0.30 \text{ (Pristine / Cash Rich)} \\ 7.0 & \text{if } 0.30 < D/E \le 0.60 \text{ (Conservative)} \\ 5.0 & \text{if } 0.60 < D/E \le 1.00 \\ 2.0 & \text{if } 1.00 < D/E \le 2.00 \\ 0.0 & \text{if } D/E > 2.00 \text{ (High Leverage Risk)} \end{cases}$$
- **Free Cash Flow Conversion ($\text{FCF} / \text{Net Profit}$)**: $\ge 0.80 \to 7\text{ pts}$, $\ge 0.50 \to 5\text{ pts}$, $\ge 0.20 \to 3\text{ pts}$.
- **Operating / Net Margin**: $\ge 20\% \to 7\text{ pts}$, $\ge 12\% \to 5\text{ pts}$, $\ge 6\% \to 3\text{ pts}$.

#### B. Value Pillar ($S_{\text{Value}} \le 30\text{ pts}$)
- **Trailing P/E Ratio ($P/E$)**:
  $$\text{Score}_{P/E} = \begin{cases} 12.0 & \text{if } P/E \le 15.0 \\ 9.0 & \text{if } 15.0 < P/E \le 24.0 \\ 5.0 & \text{if } 24.0 < P/E \le 38.0 \\ 2.0 & \text{if } 38.0 < P/E \le 60.0 \\ 0.0 & \text{if } P/E > 60.0 \end{cases}$$
- **Price/Earnings-to-Growth ($\text{PEG}$)**: $\le 1.0 \to 10\text{ pts}$, $\le 1.5 \to 8\text{ pts}$, $\le 2.2 \to 5\text{ pts}$, $\le 3.2 \to 2\text{ pts}$.
- **Price-to-Book ($P/B$)**: $\le 2.0 \to 8\text{ pts}$, $\le 4.0 \to 6\text{ pts}$, $\le 8.0 \to 3\text{ pts}$.

#### C. Momentum & Low-Volatility Pillar ($S_{\text{Momentum}} \le 30\text{ pts}$)
- **6-Month Price Momentum ($R_{6M}$)**: $\ge 20\% \to 10\text{ pts}$, $\ge 10\% \to 8\text{ pts}$, $\ge 0\% \to 5\text{ pts}$.
- **1-Year Price Return ($R_{1Y}$)**: $\ge 25\% \to 10\text{ pts}$, $\ge 12\% \to 8\text{ pts}$, $\ge 0\% \to 5\text{ pts}$.
- **60-Day Realized Annualized Volatility ($\sigma_{60}$)**:
  $$\sigma_{60} = \sqrt{\frac{252}{N-1} \sum_{t=1}^N \left( r_t - \bar{r} \right)^2} \times 100\%$$
  $$\text{Score}_{\sigma_{60}} = \begin{cases} 10.0 & \text{if } \sigma_{60} \le 18.0\% \\ 8.0 & \text{if } 18.0\% < \sigma_{60} \le 25.0\% \\ 5.0 & \text{if } 25.0\% < \sigma_{60} \le 35.0\% \\ 2.0 & \text{if } 35.0\% < \sigma_{60} \le 45.0\% \\ 0.0 & \text{if } \sigma_{60} > 45.0\% \end{cases}$$

---

### 2. AMFI Mutual Fund Rolling Alpha & Risk Engine

- **3-Year Rolling CAGR ($756\text{ trading days}$)**:
  $$\text{CAGR}_{3Y}(t) = \left( \frac{\text{NAV}_t}{\text{NAV}_{t-756}} \right)^{\frac{1}{3}} - 1$$
- **Rolling Alpha ($t$)**:
  $$\text{Alpha}_{3Y}(t) = \left( \text{CAGR}_{3Y,\text{Fund}}(t) - \text{CAGR}_{3Y,\text{Benchmark}}(t) \right) \times 100\%$$
- **Alpha Consistency Ratio**:
  $$\text{Consistency} = \frac{\sum_{t=1}^K \mathbb{I}(\text{Alpha}_{3Y}(t) > 0)}{K} \times 100\%$$
- **Information Ratio ($\text{IR}$)**:
  $$\text{IR} = \frac{\bar{R}_{\text{active, ann}}}{\text{Tracking Error}_{\text{ann}}} = \frac{\frac{252}{N}\sum (r_{\text{fund},t} - r_{\text{bench},t})}{\sqrt{252} \cdot \text{std}(r_{\text{fund},t} - r_{\text{bench},t})}$$
- **Downside Capture Ratio ($\text{DCR}$)**:
  $$\text{DCR} = \frac{\prod_{t \in \mathcal{D}} (1 + r_{\text{fund},t}) - 1}{\prod_{t \in \mathcal{D}} (1 + r_{\text{bench},t}) - 1} \times 100\%, \quad \text{where } \mathcal{D} = \{ t \mid r_{\text{bench},t} < 0 \}$$
- **Upside Capture Ratio ($\text{UCR}$)**:
  $$\text{UCR} = \frac{\prod_{t \in \mathcal{U}} (1 + r_{\text{fund},t}) - 1}{\prod_{t \in \mathcal{U}} (1 + r_{\text{bench},t}) - 1} \times 100\%, \quad \text{where } \mathcal{U} = \{ t \mid r_{\text{bench},t} > 0 \}$$
- **Sortino Ratio ($R_f = 6.5\%$ Indian Risk-Free Rate)**:
  $$\text{Sortino} = \frac{\text{CAGR}_{\text{total}} - R_f}{\sqrt{252} \cdot \sqrt{\frac{1}{K} \sum_{t=1}^K \min(0, r_{\text{fund},t} - r_{f,\text{daily}})^2}}$$

---

### 3. Inverse-Volatility Risk-Parity Optimizer

Distributes portfolio capital inversely proportional to individual asset volatility:

- **Raw Inverse-Volatility Weights**:
  $$\sigma_i = \sqrt{252 \cdot \text{Var}(r_i)}, \quad w_i^{\text{raw}} = \frac{1 / \sigma_i}{\sum_{j=1}^N (1 / \sigma_j)}$$
- **Iterative Simplex Cap Projection ($w_i \le c_{\text{max}}$, e.g. $15\%$)**:
  1. Initialize $w = w^{\text{raw}}$.
  2. If $\exists i \text{ s.t. } w_i > c_{\text{max}}$, set $w_i = c_{\text{max}}$ for all violation indices.
  3. Re-distribute the remaining weight $1 - \sum_{\text{capped}} c_{\text{max}}$ proportionally among uncapped assets:
     $$w_{\text{uncapped}} \leftarrow w_{\text{uncapped}} \times \frac{1 - \sum_{\text{capped}} c_{\text{max}}}{\sum_{\text{uncapped}} w}$$
  4. Iterate until convergence ($|w_i - c_{\text{max}}| < \epsilon$).
- **Portfolio Volatility & Risk Attribution**:
  $$\sigma_p = \sqrt{w^T \Sigma_{\text{ann}} w}$$
  $$\text{Marginal Risk Contribution (MRC)}_i = \frac{(\Sigma_{\text{ann}} w)_i}{\sigma_p}$$
  $$\text{Percent Risk Contribution (PRC)}_i = \frac{w_i \cdot \text{MRC}_i}{\sigma_p} \times 100\% \quad \left(\sum_{i=1}^N \text{PRC}_i = 100\%\right)$$
- **Effective Number of Assets ($\text{ENB}$ / Diversification)**:
  $$\text{ENB} = \frac{1}{\sum_{i=1}^N w_i^2}$$

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com) (Python 3.11) | High-concurrency async REST API |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev) | Strict schema parsing and data validation |
| **Quant Engines** | NumPy, Pandas, SciPy | Matrix operations, rolling alpha & covariance |
| **Market Data** | yfinance & AMFI Open API | Real-time Indian equities & mutual fund NAVs |
| **Testing** | [Pytest](https://pytest.org) | Unit test suite covering factor, alpha & optimizer logic |
| **Frontend Framework** | [Next.js 15](https://nextjs.org) (App Router) | React 19, Server & Client Components |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | Institutional dark terminal glassmorphic UI |
| **Visualizations** | [Recharts](https://recharts.org) | Responsive area charts, bar charts, and donut pies |
| **Icons** | [Lucide React](https://lucide.dev) | Vector financial UI icons |
| **Containerization** | Docker Multi-Stage | Lean container image for rapid cloud deploys |
| **Cloud Hosting** | Render Blueprint (`render.yaml`) | Automated dual-service web deployment |

---

## 📁 Repository Structure

```text
investdeskpro/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entry point, CORS, routers & /health
│   │   ├── schemas.py          # Pydantic data contracts for all responses
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── factors.py      # 0-100 Quality (40), Value (30), Momentum (30)
│   │   │   ├── mf_engine.py    # AMFI historical NAV, 3Y rolling alpha, DCR/UCR
│   │   │   └── portfolio.py    # Inverse-volatility risk parity & simplex cap
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── stocks.py       # GET /api/v1/stocks/{ticker}
│   │       ├── funds.py        # GET /api/v1/funds/{scheme_code} & /search
│   │       └── optimizer.py    # GET & POST /api/v1/portfolio/optimize
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_factors.py     # Tests for factor calculations & scoring
│   │   ├── test_mf_engine.py   # Tests for AMFI parsing & rolling alpha
│   │   └── test_portfolio.py   # Tests for risk parity, caps & covariance
│   ├── Dockerfile              # Multi-stage Python 3.11-slim container
│   ├── pytest.ini              # Pytest configuration
│   └── requirements.txt        # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css     # Dark terminal theme & glassmorphic utilities
│   │   │   ├── layout.tsx      # Root metadata & font configurations
│   │   │   └── page.tsx        # Dashboard shell, tabs & healthcheck monitor
│   │   ├── components/
│   │   │   ├── Header.tsx      # Market ticker ribbon, live pill & tab nav
│   │   │   ├── StockScorecardView.tsx       # 0-100 Stock Diagnostic View
│   │   │   ├── FundAnalyzerView.tsx         # AMFI Mutual Fund Alpha View
│   │   │   └── PortfolioOptimizerView.tsx   # Risk-Parity Allocation View
│   │   └── lib/
│   │       └── api.ts          # Type-safe API client & endpoints
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── .gitignore
├── render.yaml                 # Render Blueprint Infrastructure as Code
├── USERGUIDE.md                # Comprehensive User Guide & Playbook
└── README.md                   # Technical Documentation & Specification
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: Version 3.10 or 3.11
- **Node.js**: Version 18.x or 20.x
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

# Run unit tests to verify quantitative engines
pytest -v

# Start FastAPI development server
uvicorn app.main:app --reload --port 8005
```

The backend server will start at `http://127.0.0.1:8005`.
- **Interactive Swagger UI**: [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs)
- **Interactive ReDoc**: [http://127.0.0.1:8005/redoc](http://127.0.0.1:8005/redoc)
- **Healthcheck**: [http://127.0.0.1:8005/health](http://127.0.0.1:8005/health)

---

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

The Next.js frontend dashboard will be live at `http://localhost:3000` (or `http://localhost:3005`).

---

## 📡 REST API Reference

### Endpoints Summary

| Method | Endpoint | Query / Path Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | Returns backend status, UTC timestamp, and version. |
| `GET` | `/api/v1/stocks/{ticker}` | `ticker` (e.g. `TATAMOTORS`, `RELIANCE.NS`) | Calculates 0–100 score, Quality, Value, Momentum factors, and 1Y price history. |
| `GET` | `/api/v1/funds/search` | `q` (e.g. `Parag Parikh`, `HDFC`) | Autocompletes and searches AMFI scheme codes and names. |
| `GET` | `/api/v1/funds/{scheme_code}` | `scheme_code` (e.g. `122639`) | Computes 3Y Rolling Alpha, DCR/UCR, Sharpe, Sortino, and NAV history. |
| `GET` | `/api/v1/portfolio/optimize` | `tickers` (repeated), `max_weight` (default 15.0) | Optimizes inverse-volatility risk parity allocations with allocation caps. |
| `POST` | `/api/v1/portfolio/optimize` | JSON: `{"tickers": [...], "max_weight": 15.0}` | POST variation for programmatic portfolio optimization requests. |

---

### cURL Examples

#### 1. Analyze Indian Stock Scorecard
```bash
curl -X GET "http://127.0.0.1:8005/api/v1/stocks/TATAMOTORS" -H "Accept: application/json"
```

<details>
<summary>Sample JSON Response</summary>

```json
{
  "ticker": "TATAMOTORS.NS",
  "company_name": "Tata Motors Limited",
  "sector": "Consumer Cyclical",
  "industry": "Auto Manufacturers",
  "total_score": 77.0,
  "verdict": "High Quality Compounder (Strong Buy)",
  "quality": {
    "score": 34.0,
    "max_score": 40.0,
    "grade": "High Quality",
    "summary": "Exceptional ROE (31.2%); High Capital Efficiency (19.4%); Conservative Leverage (D/E 0.42)"
  },
  "value": {
    "score": 21.0,
    "max_score": 30.0,
    "grade": "Fairly Valued",
    "summary": "Attractive Multiple (P/E 10.4x); Low P/B (2.4x)"
  },
  "momentum_low_vol": {
    "score": 22.0,
    "max_score": 30.0,
    "grade": "Moderate Trend",
    "summary": "Outperforming 1Y Return (+42.5%); Controlled Volatility (22.8%)"
  },
  "fundamentals": {
    "market_cap": 342100000000.0,
    "roe": 31.2,
    "roce": 19.4,
    "debt_to_equity": 0.42,
    "trailing_pe": 10.4,
    "return_1y": 42.5,
    "realized_vol_60d": 22.8,
    "current_price": 948.5,
    "currency": "INR"
  },
  "price_history": [
    { "date": "2023-09-01", "close": 612.4, "volume": 8420100 },
    { "date": "2024-09-01", "close": 948.5, "volume": 6120300 }
  ]
}
```
</details>

#### 2. Analyze AMFI Mutual Fund Rolling Alpha
```bash
curl -X GET "http://127.0.0.1:8005/api/v1/funds/122639" -H "Accept: application/json"
```

#### 3. Optimize Portfolio with 15% Max Weight Constraint
```bash
curl -X GET "http://127.0.0.1:8005/api/v1/portfolio/optimize?tickers=RELIANCE&tickers=TCS&tickers=HDFCBANK&tickers=INFY&tickers=ITC&tickers=LT&max_weight=15" -H "Accept: application/json"
```

---

## 🐳 Docker Containerization

The backend includes a production-ready, multi-stage `Dockerfile`:

```bash
# Build Docker image
cd backend
docker build -t investdeskpro-backend .

# Run Docker container
docker run -d -p 8005:8005 --name investdeskpro-api investdeskpro-backend

# Check container logs
docker logs -f investdeskpro-api
```

---

## ☁️ Production Deployment on Render

This repository includes a native [`render.yaml`](./render.yaml) Blueprint configuration:

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and select **New +** -> **Blueprint**.
3. Connect your `InvestDeskPro` repository.
4. Render will automatically parse `render.yaml` and deploy:
   - **`investdeskpro-api`**: FastAPI Web Service running in Docker with native `/health` monitoring.
   - **`investdeskpro-dashboard`**: Next.js 15 App Router Frontend connected to the backend service.

---

## 🧪 Testing & Quality Assurance

InvestDeskPro comes equipped with an extensive Pytest test suite covering factor boundary conditions, mutual fund mathematical continuity, and constrained risk-parity convergence:

```bash
cd backend
pytest -v
```

### Test Coverage Highlights:
- `test_factors.py`: Validates Quality, Value, Momentum factor scoring bounds $[0, 40]$, $[0, 30]$, $[0, 30]$, ticker normalization, and fallback handling for missing financials.
- `test_mf_engine.py`: Tests AMFI NAV parsing, rolling CAGR mathematical formulations, Downside/Upside capture ratios, and Information Ratio calculation.
- `test_portfolio.py`: Tests inverse-volatility weight allocation, iterative simplex clipping under restrictive caps (e.g. 15%), Marginal Risk Contribution (MRC) sum consistency, and covariance matrix symmetry.

---

## 📖 User Guide

For an in-depth, step-by-step walkthrough on how to use every module, screen stocks, evaluate mutual fund manager skill, and construct low-drawdown portfolios, please refer to the comprehensive [USERGUIDE.md](./USERGUIDE.md).

---

## ⚖️ Attribution & Disclaimer

- **Created & Engineered by**: **Sandesh Rathi**
- **Ecosystem Integration**: Powered by [rupeemap.in](https://rupeemap.in)
- **Data Sources**: AMFI India (Association of Mutual Funds in India), National Stock Exchange of India (NSE), and Bombay Stock Exchange (BSE).
- **Disclaimer**: *InvestDeskPro is designed strictly for quantitative research and educational analysis. It does not constitute financial, investment, legal, or tax advice. Market investments are subject to market risks. Please read all scheme-related documents carefully and consult a SEBI-registered investment advisor before making any financial decisions.*
