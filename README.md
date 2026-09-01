# InvestDeskPro 📈

**InvestDeskPro** is an institutional-grade quantitative investment intelligence and portfolio optimization platform specifically built for Indian Equities (NSE/BSE) and Mutual Funds (AMFI).

![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat&logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat&logo=render&logoColor=white)

---

## 🏛️ System Architecture

```text
investdeskpro/
├── backend/                    # Python FastAPI High-Performance Backend
│   ├── app/
│   │   ├── main.py             # FastAPI App, CORS, Healthcheck & Routers
│   │   ├── schemas.py          # Pydantic v2 validation models
│   │   ├── core/
│   │   │   ├── factors.py      # Stock Quality (40), Value (30), Momentum (30) Scorecard
│   │   │   ├── mf_engine.py    # AMFI Historical NAV, Rolling Alpha & Downside Capture
│   │   │   └── portfolio.py    # Inverse-Volatility Risk-Parity Optimizer
│   │   └── api/
│   │       ├── stocks.py       # GET /api/v1/stocks/{ticker}
│   │       ├── funds.py        # GET /api/v1/funds/{scheme_code} & /search
│   │       └── optimizer.py    # GET & POST /api/v1/portfolio/optimize
│   ├── tests/                  # Pytest Unit Test Suite (11 Tests)
│   ├── requirements.txt        # Python Dependencies
│   └── Dockerfile              # Multi-stage Python 3.11-slim Container
├── frontend/                   # Next.js 15 App Router + Tailwind + Lucide + Recharts
├── render.yaml                 # Infrastructure as Code for Render Blueprint
└── README.md                   # Full Technical Specification
```

---

## 🧠 Quantitative & Mathematical Formulations

### 1. Stock Diagnostic Factor Scorecard (0–100)
Evaluates Indian equities across three orthogonal fundamental factors:

- **Quality Score (Max 40 Points)**:
  - **Return on Equity (ROE)** ($>20\% \to 10\text{ pts}$, $>15\% \to 8\text{ pts}$)
  - **Capital Efficiency (ROCE / ROA)** ($>18\% \to 8\text{ pts}$)
  - **Financial Leverage ($D/E$)** ($<0.3 \to 8\text{ pts}$, $<0.6 \to 7\text{ pts}$, $>2.0 \to 0\text{ pts}$)
  - **Cash Conversion ($FCF / \text{Net Profit}$)** ($>0.8 \to 7\text{ pts}$)
  - **Operating / Net Margin** ($>20\% \to 7\text{ pts}$)

- **Value Score (Max 30 Points)**:
  - **Trailing P/E Ratio** ($10 \le P/E \le 22 \to 12\text{ pts}$, $22 < P/E \le 35 \to 8\text{ pts}$)
  - **PEG Ratio** ($<1.0 \to 10\text{ pts}$, $1.0-1.5 \to 8\text{ pts}$, $>2.5 \to 0\text{ pts}$)
  - **Price-to-Book ($P/B$)** ($<2.5 \to 8\text{ pts}$)

- **Momentum & Low-Volatility (Max 30 Points)**:
  - **6-Month Momentum** ($>20\% \to 10\text{ pts}$)
  - **1-Year Momentum** ($>25\% \to 10\text{ pts}$)
  - **60-Day Realized Annualized Volatility** ($\sigma_{60} < 18\% \to 10\text{ pts}$, $\sigma_{60} < 25\% \to 8\text{ pts}$)

---

### 2. AMFI Mutual Fund Rolling Alpha & Risk Engine
Directly ingests daily NAV records from AMFI open endpoints (`api.mfapi.in`) and aligns them against the Nifty 50 TRI benchmark (`^NSEI`):

- **3-Year Rolling Alpha**:
  $$\text{Rolling Alpha}_t = \text{CAGR}_{3Y,\text{Fund}}(t) - \text{CAGR}_{3Y,\text{Nifty}}(t)$$
- **Information Ratio**:
  $$\text{IR} = \frac{\mathbb{E}[R_{\text{fund}} - R_{\text{bench}}]}{\text{Tracking Error}_{\text{ann}}}$$
- **Downside Capture Ratio ($DCR$)**:
  $$\text{DCR} = \frac{R_{\text{Fund, negative benchmark days}}}{R_{\text{Benchmark, negative benchmark days}}} \times 100\%$$
- **Sortino Ratio**:
  $$\text{Sortino} = \frac{R_{\text{Fund, ann}} - R_f}{\sqrt{\frac{1}{K}\sum_{i=1}^K \min(0, R_i - R_{f,\text{daily}})^2 \times 252}}$$

---

### 3. Inverse-Volatility Risk-Parity Optimizer
Constructs risk-balanced portfolios where capital is distributed inversely proportional to asset volatility:

- **Raw Inverse-Volatility Weights**:
  $$w_i^{\text{raw}} = \frac{1 / \sigma_i}{\sum_{j=1}^N (1 / \sigma_j)}$$
- **Allocation Cap Enforcement** ($w_i \le \text{max\_weight}$, default $15\%$):
  Iterative redistribution projecting weights onto the constrained simplex $\sum w_i = 1.0$.
- **Marginal Risk Contribution ($MRC$) & Percent Risk Contribution ($PRC$)**:
  $$\sigma_p = \sqrt{w^T \Sigma_{\text{ann}} w}, \quad MRC_i = \frac{(\Sigma_{\text{ann}} w)_i}{\sigma_p}, \quad PRC_i = \frac{w_i \cdot MRC_i}{\sigma_p} \times 100\%$$

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (optional)

### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run test suite
pytest -v

# Start FastAPI server
uvicorn app.main:app --reload --port 8005
```
API Documentation will be live at: [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be live at: [http://localhost:3005](http://localhost:3005)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck & uptime monitor |
| `GET` | `/api/v1/stocks/{ticker}` | 0-100 Scorecard, Quality, Value, Momentum & Financials |
| `GET` | `/api/v1/funds/{scheme_code}` | AMFI 3Y Rolling Alpha, DCR, Sharpe, Sortino & NAV series |
| `GET` | `/api/v1/funds/search?q={query}` | Search Indian mutual funds by keyword |
| `GET` | `/api/v1/portfolio/optimize?tickers=...` | Inverse-Volatility Risk Parity allocations & covariance |
| `POST` | `/api/v1/portfolio/optimize` | Risk-parity calculation with JSON body |

### Sample cURL Commands:
```bash
# Stock Scorecard
curl -X GET "http://127.0.0.1:8000/api/v1/stocks/TATAMOTORS.NS"

# Mutual Fund Analysis (Parag Parikh Flexi Cap)
curl -X GET "http://127.0.0.1:8000/api/v1/funds/122639"

# Portfolio Risk-Parity Optimization
curl -X GET "http://127.0.0.1:8000/api/v1/portfolio/optimize?tickers=TCS.NS&tickers=INFY.NS&tickers=HDFCBANK.NS&tickers=RELIANCE.NS&max_weight=15"
```

---

## 🐳 Docker Containerization

Run the containerized backend microservice:
```bash
cd backend
docker build -t investdeskpro-backend .
docker run -p 8000:8000 investdeskpro-backend
```

---

## ☁️ Deployment on Render

This repository includes a native [`render.yaml`](./render.yaml) blueprint:
1. Connect your GitHub repository to [Render.com](https://render.com).
2. Create a new **Blueprint Instance**.
3. Render will automatically provision:
   - `investdeskpro-api` (Docker web service with `/health` checks)
   - `investdeskpro-dashboard` (Next.js web application)
