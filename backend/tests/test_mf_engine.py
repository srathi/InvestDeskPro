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

    # Verify Investor Horizon Playbook
    assert res.playbook.min_recommended_horizon_years >= 3
    assert res.playbook.direct_vs_regular_10y_drag_lakhs > 0


