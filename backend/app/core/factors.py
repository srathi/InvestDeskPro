"""Stock Diagnostic Factor Engine for Indian Equities (NSE/BSE).

Calculates a 0-100 Institutional Scorecard across Quality (40), Value (30), and Momentum/Low-Vol (30).
"""

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf

from app.schemas import (
    FactorScoreDetail,
    StockFundamentals,
    StockPricePoint,
    StockScorecardResponse,
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
    if roe_val is not None:
        roe_val = round(roe_val * 100.0, 2)

    roce_val = safe_float(info.get("returnOnAssets"))
    if roce_val is not None:
        roce_val = round(roce_val * 100.0, 2)

    de_val = safe_float(info.get("debtToEquity"))
    if de_val is not None:
        # yfinance often returns D/E as percentage (e.g. 45.2 for 0.452)
        if de_val > 10.0:
            de_val = round(de_val / 100.0, 2)
        else:
            de_val = round(de_val, 2)

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

    trailing_pe = safe_float(info.get("trailingPE"))
    forward_pe = safe_float(info.get("forwardPE"))
    peg_ratio = safe_float(info.get("pegRatio"))
    price_to_book = safe_float(info.get("priceToBook"))
    market_cap = safe_float(info.get("marketCap"))

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
        quality=FactorScoreDetail(score=q_score, max_score=40.0, grade=q_grade, summary=q_summary),
        value=FactorScoreDetail(score=v_score, max_score=30.0, grade=v_grade, summary=v_summary),
        momentum_low_vol=FactorScoreDetail(score=m_score, max_score=30.0, grade=m_grade, summary=m_summary),
        fundamentals=fundamentals,
        price_history=price_history,
    )
