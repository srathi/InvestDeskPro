"""Stock Diagnostic Factor Engine for Indian Equities (NSE/BSE).

Calculates a 0-100 Institutional Scorecard across Quality (40), Value (30), and Momentum/Low-Vol (30).
"""

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf

from app.schemas import (
    DVMScorecard,
    FactorScoreDetail,
    RadarAxis,
    StockFlags,
    StockFundamentals,
    StockPricePoint,
    StockScorecardResponse,
    StockSearchResult,
)


def normalize_ticker(ticker: str) -> str:
    """Ensure Indian ticker has exchange suffix (.NS or .BO)."""
    t = ticker.strip().upper()
    if not (t.endswith(".NS") or t.endswith(".BO")):
        return f"{t}.NS"
    return t


def safe_float(val: Any, default: Optional[float] = None) -> Optional[float]:
    """Safely convert any numeric value or return default."""
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def compute_quality_score(f: StockFundamentals) -> Tuple[float, str, str]:
    """Compute Quality Factor Score out of 40 points."""
    score = 0.0
    reasons = []

    # 1. ROE (10 pts)
    roe = f.roe
    if roe is not None:
        if roe >= 20.0:
            score += 10.0
            reasons.append(f"Exceptional ROE ({roe:.1f}%)")
        elif roe >= 15.0:
            score += 8.0
            reasons.append(f"Strong ROE ({roe:.1f}%)")
        elif roe >= 10.0:
            score += 5.0
            reasons.append(f"Moderate ROE ({roe:.1f}%)")
        elif roe > 0.0:
            score += 2.0
            reasons.append(f"Low ROE ({roe:.1f}%)")
        else:
            reasons.append(f"Negative ROE ({roe:.1f}%)")
    else:
        score += 5.0  # neutral fallback

    # 2. ROCE / ROA (8 pts)
    roce = f.roce
    if roce is not None:
        if roce >= 18.0:
            score += 8.0
            reasons.append(f"High Capital Efficiency ({roce:.1f}%)")
        elif roce >= 12.0:
            score += 6.0
            reasons.append(f"Healthy Capital Return ({roce:.1f}%)")
        elif roce >= 8.0:
            score += 4.0
        elif roce > 0.0:
            score += 2.0
    else:
        score += 4.0

    # 3. Debt to Equity (8 pts)
    de = f.debt_to_equity
    if de is not None:
        if de <= 0.3:
            score += 8.0
            reasons.append("Pristine low/zero debt balance sheet")
        elif de <= 0.6:
            score += 7.0
            reasons.append(f"Conservative Leverage (D/E {de:.2f})")
        elif de <= 1.0:
            score += 5.0
        elif de <= 2.0:
            score += 2.0
            reasons.append(f"Elevated Leverage (D/E {de:.2f})")
        else:
            reasons.append(f"High Debt Risk (D/E {de:.2f})")
    else:
        score += 5.0

    # 4. FCF to Net Profit (7 pts)
    fcf_np = f.fcf_to_net_profit
    if fcf_np is not None:
        if fcf_np >= 0.8:
            score += 7.0
            reasons.append("High Cash Conversion Quality")
        elif fcf_np >= 0.5:
            score += 5.0
        elif fcf_np >= 0.2:
            score += 3.0
        else:
            reasons.append("Weak Free Cash Flow Conversion")
    else:
        score += 3.5

    # 5. Margins (7 pts)
    margin = f.operating_margin or f.net_margin
    if margin is not None:
        if margin >= 20.0:
            score += 7.0
            reasons.append(f"High Margin Power ({margin:.1f}%)")
        elif margin >= 12.0:
            score += 5.0
        elif margin >= 6.0:
            score += 3.0
        elif margin > 0.0:
            score += 1.0
    else:
        score += 3.5

    # Bounded to [0, 40]
    score = max(0.0, min(40.0, round(score, 1)))

    if score >= 32.0:
        grade = "High Quality"
    elif score >= 22.0:
        grade = "Moderate Quality"
    else:
        grade = "Weak Quality"

    summary = "; ".join(reasons[:3]) if reasons else "Sufficient baseline quality metrics"
    return score, grade, summary


def compute_value_score(f: StockFundamentals) -> Tuple[float, str, str]:
    """Compute Value Factor Score out of 30 points."""
    score = 0.0
    reasons = []

    # 1. Trailing P/E (12 pts)
    pe = f.trailing_pe or f.forward_pe
    if pe is not None and pe > 0:
        if pe <= 15.0:
            score += 12.0
            reasons.append(f"Attractive Multiple (P/E {pe:.1f}x)")
        elif pe <= 24.0:
            score += 9.0
            reasons.append(f"Fair Valuation (P/E {pe:.1f}x)")
        elif pe <= 38.0:
            score += 5.0
            reasons.append(f"Premium Valuation (P/E {pe:.1f}x)")
        elif pe <= 60.0:
            score += 2.0
        else:
            reasons.append(f"Very Rich Valuation (P/E {pe:.1f}x)")
    else:
        score += 5.0

    # 2. PEG Ratio (10 pts)
    peg = f.peg_ratio
    if peg is not None and peg > 0:
        if peg <= 1.0:
            score += 10.0
            reasons.append(f"Undervalued on Growth (PEG {peg:.2f})")
        elif peg <= 1.5:
            score += 8.0
            reasons.append(f"Reasonable Growth Price (PEG {peg:.2f})")
        elif peg <= 2.2:
            score += 5.0
        elif peg <= 3.2:
            score += 2.0
        else:
            reasons.append(f"High PEG ({peg:.2f})")
    else:
        score += 5.0

    # 3. Price to Book (8 pts)
    pb = f.price_to_book
    if pb is not None and pb > 0:
        if pb <= 2.0:
            score += 8.0
            reasons.append(f"Low P/B ({pb:.1f}x)")
        elif pb <= 4.0:
            score += 6.0
        elif pb <= 8.0:
            score += 3.0
        else:
            score += 1.0
    else:
        score += 4.0

    score = max(0.0, min(30.0, round(score, 1)))

    if score >= 24.0:
        grade = "Undervalued / Attractive"
    elif score >= 15.0:
        grade = "Fairly Valued"
    else:
        grade = "Expensive"

    summary = "; ".join(reasons[:2]) if reasons else "Standard valuation profile"
    return score, grade, summary


def compute_momentum_score(f: StockFundamentals) -> Tuple[float, str, str]:
    """Compute Momentum & Low-Volatility Score out of 30 points."""
    score = 0.0
    reasons = []

    # 1. 6M Return (10 pts)
    r6m = f.return_6m
    if r6m is not None:
        if r6m >= 20.0:
            score += 10.0
            reasons.append(f"Strong 6M Momentum (+{r6m:.1f}%)")
        elif r6m >= 10.0:
            score += 8.0
            reasons.append(f"Solid 6M Momentum (+{r6m:.1f}%)")
        elif r6m >= 0.0:
            score += 5.0
        elif r6m >= -10.0:
            score += 2.0
        else:
            reasons.append(f"Negative 6M Trend ({r6m:.1f}%)")
    else:
        score += 5.0

    # 2. 1Y Return (10 pts)
    r1y = f.return_1y
    if r1y is not None:
        if r1y >= 25.0:
            score += 10.0
            reasons.append(f"Outperforming 1Y Return (+{r1y:.1f}%)")
        elif r1y >= 12.0:
            score += 8.0
        elif r1y >= 0.0:
            score += 5.0
        elif r1y >= -15.0:
            score += 2.0
        else:
            reasons.append(f"1Y Price Drawdown ({r1y:.1f}%)")
    else:
        score += 5.0

    # 3. 60-Day Realized Volatility (10 pts)
    vol = f.realized_vol_60d
    if vol is not None:
        if vol <= 18.0:
            score += 10.0
            reasons.append(f"Low Volatility Profile ({vol:.1f}% ann.)")
        elif vol <= 25.0:
            score += 8.0
            reasons.append(f"Controlled Volatility ({vol:.1f}%)")
        elif vol <= 35.0:
            score += 5.0
        elif vol <= 45.0:
            score += 2.0
        else:
            reasons.append(f"High Price Volatility ({vol:.1f}%)")
    else:
        score += 5.0

    score = max(0.0, min(30.0, round(score, 1)))

    if score >= 24.0:
        grade = "Strong Bullish / Low Risk"
    elif score >= 15.0:
        grade = "Moderate Trend"
    else:
        grade = "Weak Momentum / High Vol"

    summary = "; ".join(reasons[:2]) if reasons else "Neutral momentum profile"
    return score, grade, summary


def generate_stock_scorecard(ticker: str) -> StockScorecardResponse:
    """Fetch live data and generate full institutional scorecard for an Indian stock."""
    norm_ticker = normalize_ticker(ticker)
    
    # Try fetching via primary ticker, fallback to alternate exchange if needed
    t = yf.Ticker(norm_ticker)
    info = {}
    try:
        info = t.info or {}
    except Exception:
        info = {}

    # If info is empty and ends with .NS, try .BO
    if (not info or "shortName" not in info) and norm_ticker.endswith(".NS"):
        alt_ticker = norm_ticker.replace(".NS", ".BO")
        try:
            alt_t = yf.Ticker(alt_ticker)
            alt_info = alt_t.info or {}
            if alt_info and "shortName" in alt_info:
                t = alt_t
                norm_ticker = alt_ticker
                info = alt_info
        except Exception:
            pass

    # History for momentum & volatility
    hist = pd.DataFrame()
    try:
        hist = t.history(period="1y")
    except Exception:
        hist = pd.DataFrame()

    # Calculate returns and 60-day realized volatility
    return_6m = None
    return_1y = None
    realized_vol_60d = None
    price_history: List[StockPricePoint] = []
    current_price = safe_float(info.get("currentPrice") or info.get("regularMarketPrice"))

    if not hist.empty and "Close" in hist.columns:
        closes = hist["Close"].dropna()
        if len(closes) > 0:
            if current_price is None:
                current_price = float(closes.iloc[-1])
            
            # 1Y Return
            if len(closes) >= 20:
                first_close = float(closes.iloc[0])
                last_close = float(closes.iloc[-1])
                if first_close > 0:
                    return_1y = round(((last_close / first_close) - 1.0) * 100.0, 2)

            # 6M Return (~126 trading days)
            if len(closes) >= 126:
                idx = max(0, len(closes) - 126)
                mid_close = float(closes.iloc[idx])
                last_close = float(closes.iloc[-1])
                if mid_close > 0:
                    return_6m = round(((last_close / mid_close) - 1.0) * 100.0, 2)
            elif len(closes) >= 60:
                idx = 0
                mid_close = float(closes.iloc[idx])
                last_close = float(closes.iloc[-1])
                if mid_close > 0:
                    return_6m = round(((last_close / mid_close) - 1.0) * 100.0, 2)

            # 60-Day Realized Annualized Volatility
            if len(closes) >= 20:
                recent_closes = closes.tail(min(60, len(closes)))
                log_ret = np.log(recent_closes / recent_closes.shift(1)).dropna()
                if len(log_ret) > 5:
                    vol = float(np.std(log_ret) * np.sqrt(252) * 100.0)
                    realized_vol_60d = round(vol, 2)

            # Build recent price history points (sampling to ~50-80 points for fast chart transfer)
            step = max(1, len(hist) // 60)
            sampled = hist.iloc[::step]
            for dt, row in sampled.iterrows():
                date_str = dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)[:10]
                close_val = safe_float(row.get("Close"), 0.0)
                vol_val = safe_float(row.get("Volume"), 0.0)
                price_history.append(StockPricePoint(date=date_str, close=close_val, volume=vol_val))

    # Extract & sanitize fundamental metrics
    roe_val = safe_float(info.get("returnOnEquity"))
    roa_val = safe_float(info.get("returnOnAssets"))

    de_val = safe_float(info.get("debtToEquity"))
    if de_val is not None:
        # yfinance often returns D/E as percentage (e.g. 45.2 for 0.452)
        if de_val > 10.0:
            de_val = round(de_val / 100.0, 2)
        else:
            de_val = round(de_val, 2)

    trailing_pe = safe_float(info.get("trailingPE"))
    forward_pe = safe_float(info.get("forwardPE"))
    peg_ratio = safe_float(info.get("pegRatio"))
    price_to_book = safe_float(info.get("priceToBook"))
    market_cap = safe_float(info.get("marketCap"))

    # Tier 2: Check financial statements if ROE or ROA is missing
    if roe_val is None or roa_val is None:
        try:
            fin = t.financials
            bs = t.balance_sheet
            if not fin.empty and not bs.empty:
                net_income = None
                for ni_key in ["Net Income", "Net Income Common Stockholders", "Net Income Continuous Operations"]:
                    if ni_key in fin.index:
                        net_income = safe_float(fin.loc[ni_key].iloc[0])
                        break
                equity = None
                for eq_key in ["Stockholders Equity", "Total Equity Gross Minority Interest", "Common Stock Equity"]:
                    if eq_key in bs.index:
                        equity = safe_float(bs.loc[eq_key].iloc[0])
                        break
                assets = safe_float(bs.loc["Total Assets"].iloc[0]) if "Total Assets" in bs.index else None

                if roe_val is None and net_income and equity and equity > 0:
                    roe_val = float(net_income / equity)
                if roa_val is None and net_income and assets and assets > 0:
                    roa_val = float(net_income / assets)
        except Exception:
            pass

    # Tier 3: DuPont Fundamental Identity: ROE = (Price/Book) / (Price/Earnings) = Earnings / Book
    if roe_val is None and price_to_book is not None and price_to_book > 0:
        pe_to_use = trailing_pe or forward_pe
        if pe_to_use is not None and pe_to_use > 0:
            roe_val = float(price_to_book / pe_to_use)

    # Tier 4: From Net Income / Total Market Equity (Book Value * Shares)
    if roe_val is None:
        net_inc = safe_float(info.get("netIncomeToCommon"))
        book_val = safe_float(info.get("bookValue"))
        shares = safe_float(info.get("sharesOutstanding") or info.get("impliedSharesOutstanding"))
        if net_inc and book_val and shares and (book_val * shares) > 0:
            roe_val = float(net_inc / (book_val * shares))

    # Tier 5: Derive ROA from ROE and Leverage
    if roa_val is None and roe_val is not None:
        de_ratio = de_val if de_val is not None else 0.0
        roa_val = float(roe_val / (1.0 + max(0.0, de_ratio)))

    # Tier 6: Derive ROCE from ROA & Operating Efficiency
    roce_val = None
    if roa_val is not None:
        de_ratio = de_val if de_val is not None else 0.0
        roce_val = float(roa_val * (1.2 + min(1.0, de_ratio * 0.3)))
    elif roe_val is not None:
        roce_val = float(roe_val * 0.85)

    # Convert to clean percentages
    if roe_val is not None:
        roe_val = round(roe_val * 100.0, 2)
    if roce_val is not None:
        roce_val = round(roce_val * 100.0, 2)

    # Free Cash Flow to Net Profit
    fcf = safe_float(info.get("freeCashflow"))
    net_income = safe_float(info.get("netIncomeToCommon"))
    fcf_np_ratio = None
    if fcf is not None and net_income is not None and net_income > 0:
        fcf_np_ratio = round(fcf / net_income, 2)

    op_margin = safe_float(info.get("operatingMargins"))
    if op_margin is not None:
        op_margin = round(op_margin * 100.0, 2)

    net_margin = safe_float(info.get("profitMargins"))
    if net_margin is not None:
        net_margin = round(net_margin * 100.0, 2)

    fundamentals = StockFundamentals(
        market_cap=market_cap,
        roe=roe_val,
        roce=roce_val,
        debt_to_equity=de_val,
        fcf_to_net_profit=fcf_np_ratio,
        operating_margin=op_margin,
        net_margin=net_margin,
        trailing_pe=trailing_pe,
        forward_pe=forward_pe,
        peg_ratio=peg_ratio,
        price_to_book=price_to_book,
        return_6m=return_6m,
        return_1y=return_1y,
        realized_vol_60d=realized_vol_60d,
        current_price=current_price,
        currency=info.get("currency", "INR"),
    )

    # Calculate Sub-factor Scores
    q_score, q_grade, q_summary = compute_quality_score(fundamentals)
    v_score, v_grade, v_summary = compute_value_score(fundamentals)
    m_score, m_grade, m_summary = compute_momentum_score(fundamentals)

    total_score = round(q_score + v_score + m_score, 1)

    # 1. Trendlyne DVM Scores (0-100 scale)
    durability = round(min(100.0, (q_score / 40.0) * 100.0), 1)
    valuation = round(min(100.0, (v_score / 30.0) * 100.0), 1)
    momentum = round(min(100.0, (m_score / 30.0) * 100.0), 1)

    if durability >= 65.0 and valuation >= 50.0 and momentum >= 60.0:
        dvm_class = "High Quality Compounder"
    elif durability >= 65.0 and momentum >= 65.0:
        dvm_class = "Strong Performer"
    elif durability >= 60.0 and valuation >= 65.0 and momentum < 50.0:
        dvm_class = "Value Opportunity (Contrarian)"
    elif durability < 50.0 and valuation < 45.0 and momentum >= 65.0:
        dvm_class = "Momentum Trap (High Volatility)"
    elif durability < 50.0 and valuation >= 60.0 and momentum < 45.0:
        dvm_class = "Value Trap (Stressed Multiples)"
    elif durability >= 60.0 and valuation >= 60.0:
        dvm_class = "Under the Radar"
    elif durability < 40.0 and valuation < 40.0 and momentum < 40.0:
        dvm_class = "High Risk / Stressed Fundamentals"
    else:
        dvm_class = "Neutral / Core Accumulation"

    # 2. Simply Wall St 5-Axis Snowflake Radar
    stability_val = round(max(10.0, min(100.0, 100.0 - (fundamentals.realized_vol_60d or 25.0) * 2.0)), 1)
    profitability_val = round(min(100.0, max(10.0, (fundamentals.roe or 12.0) * 2.5 + (fundamentals.operating_margin or 15.0) * 1.5)), 1)

    radar_axes = [
        RadarAxis(axis="Durability", value=durability, max_value=100.0),
        RadarAxis(axis="Valuation", value=valuation, max_value=100.0),
        RadarAxis(axis="Momentum", value=momentum, max_value=100.0),
        RadarAxis(axis="Stability", value=stability_val, max_value=100.0),
        RadarAxis(axis="Profitability", value=profitability_val, max_value=100.0),
    ]

    # 3. Tickertape Health Checks & Red Flags
    green_flags: List[str] = []
    red_flags: List[str] = []

    if fundamentals.debt_to_equity is not None and fundamentals.debt_to_equity <= 0.5:
        green_flags.append(f"Low Debt Profile: D/E ratio at {fundamentals.debt_to_equity}x (<0.5x)")
    if fundamentals.roe is not None and fundamentals.roe >= 15.0:
        green_flags.append(f"Strong Capital Efficiency: ROE at {fundamentals.roe}% (>15%)")
    if fundamentals.operating_margin is not None and fundamentals.operating_margin >= 18.0:
        green_flags.append(f"Healthy Margins: Operating margin at {fundamentals.operating_margin}%")
    if fundamentals.realized_vol_60d is not None and fundamentals.realized_vol_60d <= 22.0:
        green_flags.append("Controlled Volatility: 60D Realized Volatility < 22%")
    if fundamentals.fcf_to_net_profit is not None and fundamentals.fcf_to_net_profit >= 0.7:
        green_flags.append("Robust Cash Conversion: Free Cash Flow > 70% of Net Income")
    if fundamentals.peg_ratio is not None and 0 < fundamentals.peg_ratio <= 1.5:
        green_flags.append(f"Attractive Growth Multiple: PEG ratio at {fundamentals.peg_ratio}x")

    if fundamentals.debt_to_equity is not None and fundamentals.debt_to_equity >= 1.5:
        red_flags.append(f"Elevated Financial Leverage: Debt-to-Equity is {fundamentals.debt_to_equity}x (>1.5x)")
    if fundamentals.trailing_pe is not None and fundamentals.trailing_pe >= 45.0:
        red_flags.append(f"Premium Valuation: Trailing P/E at {round(fundamentals.trailing_pe, 1)}x (>45x)")
    if fundamentals.realized_vol_60d is not None and fundamentals.realized_vol_60d >= 35.0:
        red_flags.append(f"High Realized Volatility: 60D annualized vol at {fundamentals.realized_vol_60d}%")
    if fundamentals.return_1y is not None and fundamentals.return_1y <= -20.0:
        red_flags.append(f"Severe 1-Year Price Drawdown: Stock down {fundamentals.return_1y}% over 12M")
    if fundamentals.fcf_to_net_profit is not None and fundamentals.fcf_to_net_profit < 0.2:
        red_flags.append("Weak Cash Flow Conversion: FCF is less than 20% of net profits")

    if not green_flags:
        green_flags.append("Stable operating baseline across diversified segments")

    if total_score >= 75.0:
        verdict = "High Quality Compounder (Strong Buy)"
    elif total_score >= 60.0:
        verdict = "Favorable Fundamental Momentum (Buy)"
    elif total_score >= 45.0:
        verdict = "Neutral / Core Accumulation (Hold)"
    elif total_score >= 30.0:
        verdict = "Elevated Valuation / Quality Concerns (Underweight)"
    else:
        verdict = "High Risk / Negative Fundamentals (Avoid)"

    company_name = info.get("longName") or info.get("shortName") or norm_ticker
    sector = info.get("sector", "Diversified Indian Equities")
    industry = info.get("industry", "Financial & Capital Markets")

    return StockScorecardResponse(
        ticker=norm_ticker,
        company_name=company_name,
        sector=sector,
        industry=industry,
        total_score=total_score,
        verdict=verdict,
        dvm=DVMScorecard(
            durability=durability,
            valuation=valuation,
            momentum=momentum,
            classification=dvm_class,
        ),
        radar_axes=radar_axes,
        flags=StockFlags(
            green_flags=green_flags,
            red_flags=red_flags,
        ),
        quality=FactorScoreDetail(score=q_score, max_score=40.0, grade=q_grade, summary=q_summary),
        value=FactorScoreDetail(score=v_score, max_score=30.0, grade=v_grade, summary=v_summary),
        momentum_low_vol=FactorScoreDetail(score=m_score, max_score=30.0, grade=m_grade, summary=m_summary),
        fundamentals=fundamentals,
        price_history=price_history,
    )


INDIAN_STOCKS_DIRECTORY = [
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries Ltd.", "sector": "Energy & Telecom"},
    {"ticker": "TCS.NS", "name": "Tata Consultancy Services Ltd.", "sector": "Information Technology"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "INFY.NS", "name": "Infosys Ltd.", "sector": "Information Technology"},
    {"ticker": "ICICIBANK.NS", "name": "ICICI Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd.", "sector": "Telecommunications"},
    {"ticker": "SBIN.NS", "name": "State Bank of India", "sector": "Financials & Banking"},
    {"ticker": "ITC.NS", "name": "ITC Ltd.", "sector": "Consumer Goods & FMCG"},
    {"ticker": "LT.NS", "name": "Larsen & Toubro Ltd.", "sector": "Capital Goods & Infra"},
    {"ticker": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd.", "sector": "Consumer Goods & FMCG"},
    {"ticker": "TATAMOTORS.NS", "name": "Tata Motors Ltd.", "sector": "Automotive"},
    {"ticker": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries", "sector": "Healthcare & Pharma"},
    {"ticker": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd.", "sector": "Financials & NBFC"},
    {"ticker": "MARUTI.NS", "name": "Maruti Suzuki India Ltd.", "sector": "Automotive"},
    {"ticker": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "TITAN.NS", "name": "Titan Company Ltd.", "sector": "Consumer Discretionary"},
    {"ticker": "AXISBANK.NS", "name": "Axis Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "NTPC.NS", "name": "NTPC Ltd.", "sector": "Utilities & Power"},
    {"ticker": "ONGC.NS", "name": "Oil & Natural Gas Corp.", "sector": "Energy & Oil"},
    {"ticker": "ADANIENT.NS", "name": "Adani Enterprises Ltd.", "sector": "Diversified Conglomerate"},
    {"ticker": "ADANIPORTS.NS", "name": "Adani Ports and Special Economic Zone", "sector": "Infrastructure & Ports"},
    {"ticker": "M&M.NS", "name": "Mahindra & Mahindra Ltd.", "sector": "Automotive"},
    {"ticker": "ULTRACEMCO.NS", "name": "UltraTech Cement Ltd.", "sector": "Materials & Cement"},
    {"ticker": "POWERGRID.NS", "name": "Power Grid Corp of India", "sector": "Utilities & Power"},
    {"ticker": "TATASTEEL.NS", "name": "Tata Steel Ltd.", "sector": "Metals & Mining"},
    {"ticker": "COALINDIA.NS", "name": "Coal India Ltd.", "sector": "Energy & Mining"},
    {"ticker": "ASIANPAINT.NS", "name": "Asian Paints Ltd.", "sector": "Consumer Goods"},
    {"ticker": "BAJAJFINSV.NS", "name": "Bajaj Finserv Ltd.", "sector": "Financials"},
    {"ticker": "NESTLEIND.NS", "name": "Nestle India Ltd.", "sector": "Consumer Goods & FMCG"},
    {"ticker": "TECHM.NS", "name": "Tech Mahindra Ltd.", "sector": "Information Technology"},
    {"ticker": "WIPRO.NS", "name": "Wipro Ltd.", "sector": "Information Technology"},
    {"ticker": "HCLTECH.NS", "name": "HCL Technologies Ltd.", "sector": "Information Technology"},
    {"ticker": "JSWSTEEL.NS", "name": "JSW Steel Ltd.", "sector": "Metals & Mining"},
    {"ticker": "HINDALCO.NS", "name": "Hindalco Industries Ltd.", "sector": "Metals & Mining"},
    {"ticker": "CIPLA.NS", "name": "Cipla Ltd.", "sector": "Healthcare & Pharma"},
    {"ticker": "DRREDDY.NS", "name": "Dr. Reddy's Laboratories", "sector": "Healthcare & Pharma"},
    {"ticker": "APOLLOHOSP.NS", "name": "Apollo Hospitals Enterprise", "sector": "Healthcare Services"},
    {"ticker": "TATACONSUM.NS", "name": "Tata Consumer Products", "sector": "Consumer Goods & FMCG"},
    {"ticker": "BPCL.NS", "name": "Bharat Petroleum Corp Ltd.", "sector": "Energy & Refining"},
    {"ticker": "EICHERMOT.NS", "name": "Eicher Motors Ltd.", "sector": "Automotive"},
    {"ticker": "GRASIM.NS", "name": "Grasim Industries Ltd.", "sector": "Materials & Chemicals"},
    {"ticker": "BRITANNIA.NS", "name": "Britannia Industries Ltd.", "sector": "Consumer Goods & FMCG"},
    {"ticker": "HEROMOTOCO.NS", "name": "Hero MotoCorp Ltd.", "sector": "Automotive"},
    {"ticker": "DIVISLAB.NS", "name": "Divi's Laboratories Ltd.", "sector": "Healthcare & Pharma"},
    {"ticker": "INDUSINDBK.NS", "name": "IndusInd Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "BAJAJ-AUTO.NS", "name": "Bajaj Auto Ltd.", "sector": "Automotive"},
    {"ticker": "SBILIFE.NS", "name": "SBI Life Insurance Co.", "sector": "Financials & Insurance"},
    {"ticker": "HDFCLIFE.NS", "name": "HDFC Life Insurance Co.", "sector": "Financials & Insurance"},
    {"ticker": "LTIM.NS", "name": "LTIMindtree Ltd.", "sector": "Information Technology"},
    {"ticker": "LICI.NS", "name": "Life Insurance Corp of India", "sector": "Financials & Insurance"},
    {"ticker": "ZOMATO.NS", "name": "Zomato Ltd. / Eternal", "sector": "Consumer Internet & Tech"},
    {"ticker": "JIOFIN.NS", "name": "Jio Financial Services", "sector": "Financial Services"},
    {"ticker": "TRENT.NS", "name": "Trent Ltd.", "sector": "Retail & Consumer"},
    {"ticker": "BEL.NS", "name": "Bharat Electronics Ltd.", "sector": "Aerospace & Defence"},
    {"ticker": "HAL.NS", "name": "Hindustan Aeronautics Ltd.", "sector": "Aerospace & Defence"},
    {"ticker": "POLYCAB.NS", "name": "Polycab India Ltd.", "sector": "Industrial Manufacturing"},
    {"ticker": "DLF.NS", "name": "DLF Ltd.", "sector": "Real Estate"},
    {"ticker": "VBL.NS", "name": "Varun Beverages Ltd.", "sector": "Consumer Goods & FMCG"},
    {"ticker": "SIEMENS.NS", "name": "Siemens Ltd.", "sector": "Capital Goods & Engineering"},
    {"ticker": "ABB.NS", "name": "ABB India Ltd.", "sector": "Industrial Automation"},
    {"ticker": "IRCTC.NS", "name": "IRCTC Ltd.", "sector": "Travel & Hospitality"},
    {"ticker": "FEDERALBNK.NS", "name": "Federal Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "IDFCFIRSTB.NS", "name": "IDFC First Bank Ltd.", "sector": "Financials & Banking"},
    {"ticker": "TATAPOWER.NS", "name": "Tata Power Company Ltd.", "sector": "Utilities & Clean Energy"},
    {"ticker": "SUZLON.NS", "name": "Suzlon Energy Ltd.", "sector": "Renewable Energy"},
    {"ticker": "VEDL.NS", "name": "Vedanta Ltd.", "sector": "Metals & Mining"},
    {"ticker": "BHEL.NS", "name": "Bharat Heavy Electricals", "sector": "Capital Goods"},
]


def search_indian_stocks(query: str) -> List[StockSearchResult]:
    """Fast prefix and fuzzy matching search for Indian Equities."""
    q = query.strip().upper()
    if not q:
        return []

    clean_q = q.replace(".NS", "").replace(".BO", "")
    results: List[StockSearchResult] = []
    seen = set()

    # 1. Exact / Prefix ticker match
    for item in INDIAN_STOCKS_DIRECTORY:
        t_base = item["ticker"].replace(".NS", "")
        if t_base.startswith(clean_q):
            if item["ticker"] not in seen:
                results.append(StockSearchResult(
                    ticker=item["ticker"],
                    name=item["name"],
                    sector=item["sector"],
                    exchange="NSE",
                ))
                seen.add(item["ticker"])

    # 2. Company name matching
    q_lower = query.strip().lower()
    for item in INDIAN_STOCKS_DIRECTORY:
        if q_lower in item["name"].lower() or clean_q in item["ticker"]:
            if item["ticker"] not in seen:
                results.append(StockSearchResult(
                    ticker=item["ticker"],
                    name=item["name"],
                    sector=item["sector"],
                    exchange="NSE",
                ))
                seen.add(item["ticker"])

    # 3. Dynamic fallback if query isn't in curated list
    if not results and len(clean_q) >= 2:
        norm = normalize_ticker(clean_q)
        results.append(StockSearchResult(
            ticker=norm,
            name=f"{clean_q} (NSE Equities)",
            sector="Indian Equities",
            exchange="NSE",
        ))

    return results[:15]

