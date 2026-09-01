"""Unit tests for Stock Diagnostic Factor Scorecard Engine."""

import pytest
from app.core.factors import (
    compute_momentum_score,
    compute_quality_score,
    compute_value_score,
    normalize_ticker,
    safe_float,
    search_indian_stocks,
)
from app.schemas import StockFundamentals


def test_ticker_normalization():
    assert normalize_ticker("TATAMOTORS") == "TATAMOTORS.NS"
    assert normalize_ticker("reliance.ns") == "RELIANCE.NS"
    assert normalize_ticker("TCS.BO") == "TCS.BO"
    assert normalize_ticker("  infy  ") == "INFY.NS"


def test_safe_float():
    assert safe_float(10.5) == 10.5
    assert safe_float("42.8") == 42.8
    assert safe_float(None) is None
    assert safe_float("invalid_str", default=0.0) == 0.0
    assert safe_float(float("nan"), default=5.0) == 5.0


def test_factor_scores_bounds_and_empty_fallback():
    # Empty fundamentals should safely fallback without crashing
    empty_f = StockFundamentals()
    
    q_score, q_grade, q_summary = compute_quality_score(empty_f)
    v_score, v_grade, v_summary = compute_value_score(empty_f)
    m_score, m_grade, m_summary = compute_momentum_score(empty_f)
    
    assert 0.0 <= q_score <= 40.0
    assert 0.0 <= v_score <= 30.0
    assert 0.0 <= m_score <= 30.0
    
    total = q_score + v_score + m_score
    assert 0.0 <= total <= 100.0
    assert len(q_grade) > 0
    assert len(v_grade) > 0
    assert len(m_grade) > 0


def test_high_quality_value_momentum_stock():
    # Exceptional fundamentals
    f = StockFundamentals(
        roe=25.0,
        roce=22.0,
        debt_to_equity=0.1,
        fcf_to_net_profit=1.1,
        operating_margin=28.0,
        trailing_pe=14.5,
        peg_ratio=0.85,
        price_to_book=1.8,
        return_6m=24.0,
        return_1y=35.0,
        realized_vol_60d=14.0,
    )
    
    q_score, q_grade, _ = compute_quality_score(f)
    v_score, v_grade, _ = compute_value_score(f)
    m_score, m_grade, _ = compute_momentum_score(f)
    
    assert q_score >= 35.0
    assert v_score >= 26.0
    assert m_score >= 26.0
    
    total = q_score + v_score + m_score
    assert 85.0 <= total <= 100.0
    assert "High Quality" in q_grade


def test_poor_quality_expensive_stock():
    # Low quality & high valuation
    f = StockFundamentals(
        roe=-5.0,
        roce=1.0,
        debt_to_equity=3.5,
        fcf_to_net_profit=-0.4,
        operating_margin=-2.0,
        trailing_pe=95.0,
        peg_ratio=4.5,
        price_to_book=12.0,
        return_6m=-25.0,
        return_1y=-40.0,
        realized_vol_60d=55.0,
    )
    
    q_score, q_grade, _ = compute_quality_score(f)
    v_score, v_grade, _ = compute_value_score(f)
    m_score, m_grade, _ = compute_momentum_score(f)
    
    assert q_score <= 15.0
    assert v_score <= 8.0
    assert m_score <= 5.0
    
    total = q_score + v_score + m_score
    assert 0.0 <= total <= 30.0


def test_search_indian_stocks():
    # Search by ticker prefix
    res1 = search_indian_stocks("TATA")
    assert len(res1) > 0
    assert any("TATAMOTORS" in r.ticker for r in res1)

    # Search by company name
    res2 = search_indian_stocks("Reliance")
    assert len(res2) > 0
    assert res2[0].ticker == "RELIANCE.NS"

    # Search non-curated ticker
    res3 = search_indian_stocks("INFY")
    assert len(res3) > 0
    assert any("INFY.NS" in r.ticker for r in res3)

