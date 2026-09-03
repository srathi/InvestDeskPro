"""Unit and integration tests for Mutual Fund Engine and API endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "investdeskpro-api"
    assert "timestamp" in data


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert ("<!DOCTYPE html>" in response.text) or ("service" in response.text)


import asyncio


def test_mutual_fund_search_local_fallback():
    from app.core.mf_engine import search_mutual_funds
    results = asyncio.run(search_mutual_funds("Parag"))
    assert len(results) > 0
    assert any("Parag Parikh" in r.scheme_name for r in results)


def test_mutual_fund_analysis_holistic_scorecard():
    from app.core.mf_engine import analyze_mutual_fund
    res = asyncio.run(analyze_mutual_fund("122639"))
    
    # Verify metadata
    assert res.meta.scheme_code == "122639"
    assert "Parag Parikh" in res.meta.scheme_name
    
    # Verify PowerUp Form Rating
    assert res.form_rating.status in ["in_form", "on_track", "off_track", "out_of_form"]
    assert len(res.form_rating.summary_rationale) > 0
    assert len(res.form_rating.action_recommendation) > 0

    # Verify Institutional 5-Pillar Scorecard
    assert 0 <= res.scorecard.total_score <= 100
    assert res.scorecard.grade in ["AAA", "AA", "A", "BBB", "C"]
    assert len(res.scorecard.pillars) == 5
    for p in res.scorecard.pillars:
        assert 0 <= p.score <= p.max_score

    # Verify Rolling Return Distributions
    assert len(res.rolling_distributions) >= 2
    for dist in res.rolling_distributions:
        assert dist.periods_count > 0
        assert 0.0 <= dist.prob_negative_pct <= 100.0
        assert 0.0 <= dist.hit_rate_vs_bench_pct <= 100.0
        assert dist.min_cagr <= dist.median_cagr <= dist.max_cagr

    # Verify Drawdown Events and Underwater Series
    assert len(res.drawdown_events) >= 2
    assert len(res.drawdown_series) > 0

    # Verify Suggested Alternatives
    assert len(res.suggested_alternatives) >= 1

def test_mutual_fund_fuzzy_search_aliases():
    from app.core.mf_engine import search_mutual_funds
    
    # Test PPFAS alias
    ppfas_results = asyncio.run(search_mutual_funds("PPFAS"))
    assert len(ppfas_results) > 0
    assert "122639" in [r.scheme_code for r in ppfas_results]
    assert ppfas_results[0].plan_type == "Direct"

    # Test Quant Small Cap
    quant_results = asyncio.run(search_mutual_funds("quant small"))
    assert len(quant_results) > 0
    assert any("Quant Small Cap" in r.scheme_name for r in quant_results)

    # Test SBI Contra
    sbi_results = asyncio.run(search_mutual_funds("sbi contra"))
    assert len(sbi_results) > 0
    assert any("SBI Contra" in r.scheme_name for r in sbi_results)


def test_category_aware_dynamic_benchmarks():
    from app.core.mf_benchmark import get_benchmark_for_category, detect_scheme_category
    
    # Small Cap -> Nifty Smallcap 250
    sym, name, _ = get_benchmark_for_category("Quant Small Cap Fund - Direct Plan - Growth", "Small Cap Fund")
    assert "Smallcap" in name
    
    # Mid Cap -> Nifty Midcap 150
    sym, name, _ = get_benchmark_for_category("Motilal Oswal Midcap Fund - Direct Plan - Growth", "Mid Cap Fund")
    assert "Midcap" in name

    # Flexi Cap -> Nifty 500 TRI
    sym, name, _ = get_benchmark_for_category("Parag Parikh Flexi Cap Fund - Direct Plan - Growth", "Flexi Cap Fund")
    assert "500" in name

    # Large Cap -> Nifty 50 TRI
    sym, name, _ = get_benchmark_for_category("Mirae Asset Large Cap Fund - Direct Plan - Growth", "Large Cap Fund")
    assert "50" in name or "100" in name


def test_mutual_fund_active_share_and_capture_ratios():
    from app.core.mf_engine import analyze_mutual_fund
    res = asyncio.run(analyze_mutual_fund("122639"))
    
    # Active Share & Closet Indexing
    assert res.active_share is not None
    assert 20.0 <= res.active_share.active_share_pct <= 98.0
    assert res.active_share.classification in ["Truly Active High-Conviction", "Moderate Active Tilt", "Closet Indexer"]
    
    # Holdings
    assert len(res.top_holdings) > 0
    assert any(h.ticker == "HDFCBANK" for h in res.top_holdings)
    
    # Capture Ratios
    assert res.stats.capture_details is not None
    assert res.stats.capture_details.upside_capture_ratio > 0
    assert res.stats.capture_details.downside_capture_ratio > 0
    assert res.stats.capture_details.asymmetric_profile in [
        "Asymmetric Alpha Compounder",
        "High-Beta Market Passenger",
        "Downside Bleeder",
        "Balanced Market Compounder",
    ]
    
    # Skill vs Luck Diagnostic & Capital Preservation
    assert res.stats.skill_vs_luck_diagnostic is not None
    assert res.stats.capital_preservation_rate_3y is not None
    assert 0.0 <= res.stats.capital_preservation_rate_3y <= 100.0


def test_cross_fund_overlap_api():
    # Parag Parikh Flexi Cap (122639) vs HDFC Flexi Cap (118955)
    resp = client.post("/api/v1/funds/overlap", json={"scheme_codes": ["122639", "118955"]})
    assert resp.status_code == 200
    data = resp.json()
    assert "scheme_a_name" in data
    assert "scheme_b_name" in data
    assert 10.0 <= data["total_overlap_pct"] <= 90.0
    assert data["common_holdings_count"] > 0
    assert len(data["common_holdings"]) > 0
    assert any(h["ticker"] in ["HDFCBANK", "ICICIBANK", "ITC", "INFY"] for h in data["common_holdings"])



