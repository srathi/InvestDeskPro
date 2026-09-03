"""Unit tests for Stock Diagnostic Factor Scorecard Engine."""

import pytest
from app.core.factors import (
    compute_momentum_score,
    compute_quality_score,
    compute_value_score,
    generate_stock_scorecard,
    normalize_ticker,
    safe_float,
    search_indian_stocks,
)
from app.schemas import StockFundamentals


def test_ticker_normalization():
    # Colloquial names, abbreviations & spaces
    assert normalize_ticker("TATAMOTORS") == "TMCV.NS"
    assert normalize_ticker("TATA MOTORS") == "TMCV.NS"
    assert normalize_ticker("  tata   motors  ") == "TMCV.NS"
    assert normalize_ticker("SBI") == "SBIN.NS"
    assert normalize_ticker("STATE BANK OF INDIA") == "SBIN.NS"
    assert normalize_ticker("HDFC BANK") == "HDFCBANK.NS"
    assert normalize_ticker("M&M") == "M&M.NS"
    assert normalize_ticker("L&T") == "LT.NS"
    assert normalize_ticker("BAJAJ FINANCE") == "BAJFINANCE.NS"
    assert normalize_ticker("PICCADILY") == "PICCADIL.BO"
    assert normalize_ticker("reliance.ns") == "RELIANCE.NS"
    assert normalize_ticker("TCS.BO") == "TCS.BO"
    assert normalize_ticker("  infy  ") == "INFY.NS"
    assert normalize_ticker("RADICO KHAITAN LTD.") == "RADICO.NS"
    assert normalize_ticker("RADICO KHAITAN LTD..NS") == "RADICO.NS"
    assert normalize_ticker("RADICO KHAITAN") == "RADICO.NS"
    assert normalize_ticker("HINDUSTAN UNILEVER LIMITED") == "HINDUNILVR.NS"
    assert normalize_ticker("PIDILITE INDUSTRIES") == "PIDILITIND.NS"
    assert normalize_ticker("532497") == "RADICO.BO"
    # BSE 6-digit scrip codes
    assert normalize_ticker("500570") == "TMCV.BO"
    assert normalize_ticker("500180") == "HDFCBANK.BO"
    assert normalize_ticker("500325") == "RELIANCE.BO"



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

    # Search for PICC matches PICCADIL.NS
    res3 = search_indian_stocks("PICC")
    assert len(res3) > 0
    assert any("PICCADIL.NS" in r.ticker for r in res3)


def test_invalid_stock_ticker_validation():
    # An invalid ticker should raise ValueError and NOT return dummy data
    with pytest.raises(ValueError) as excinfo:
        generate_stock_scorecard("INVALID_NONEXISTENT_TICKER_9999")
    assert "not a recognized listed equity" in str(excinfo.value)


def test_market_indices_fetch():
    from app.core.factors import fetch_live_market_indices
    indices = fetch_live_market_indices()
    assert len(indices) == 5
    symbols = [idx.symbol for idx in indices]
    assert "^NSEI" in symbols
    assert "^BSESN" in symbols
    assert "^NSEBANK" in symbols
    assert "^INDIAVIX" in symbols
    assert "BZ=F" in symbols
    for idx in indices:
        assert idx.price > 0
        assert isinstance(idx.change_pct, float)


def test_institutional_flow_fetch():
    from app.core.factors import fetch_latest_institutional_flow
    flows = fetch_latest_institutional_flow()
    assert len(flows) >= 2
    categories = [f.category for f in flows]
    assert "FII" in categories
    assert "DII" in categories
    for f in flows:
        assert isinstance(f.net_value_cr, float)
        assert len(f.date) > 0


def test_bfsi_factor_scoring_model():
    # A high-quality bank with naturally high D/E (6.5x) but elite ROE (18%) and RoA (1.9%)
    f_bank = StockFundamentals(
        roe=18.5,
        roce=1.9,  # RoA for bank
        debt_to_equity=6.5,  # High financial leverage from deposits
        price_to_book=2.4,
        trailing_pe=17.5,
        net_margin=24.0,
        return_6m=15.0,
        return_1y=28.0,
        realized_vol_60d=16.0,
    )
    
    # Non-BFSI model would penalize D/E (6.5x)
    q_score_corp, _, _ = compute_quality_score(f_bank, is_bfsi=False)
    
    # BFSI model rewards RoA & does not penalize operational deposit leverage
    q_score_bfsi, q_grade_bfsi, q_summary_bfsi = compute_quality_score(f_bank, is_bfsi=True)
    v_score_bfsi, v_grade_bfsi, _ = compute_value_score(f_bank, is_bfsi=True)
    
    assert q_score_bfsi > q_score_corp
    assert q_score_bfsi >= 34.0
    assert "High Quality" in q_grade_bfsi
    assert "Banking ROE" in q_summary_bfsi
    assert v_score_bfsi >= 20.0


def test_institutional_red_flags_detection():
    # Test that high promoter pledge triggers CRITICAL risk tier in scorecard
    res = generate_stock_scorecard("RELIANCE.NS")
    assert res.flags.risk_tier in ["CLEAN", "WATCHLIST", "CRITICAL"]
    assert len(res.flags.green_flags) > 0 or len(res.flags.red_flags) > 0
    assert res.factor_model_type in ["Standard Corporate", "BFSI Banking & Financials"]




