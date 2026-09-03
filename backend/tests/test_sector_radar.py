"""
Tests for Sector Valuation & Industry Radar Core Engine & FastAPI Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.sector_radar import (
    get_sector_radar_heatmap,
    get_sector_deep_dive,
    get_capex_cycle_matrix,
    calculate_valuation_percentile,
    classify_valuation_zone,
    SECTOR_DATABASE
)

client = TestClient(app)


def test_percentile_calculation():
    # Min 10, Max 20, Current 15 -> 50th percentile
    assert calculate_valuation_percentile(15.0, 10.0, 20.0) == 50.0
    # Min 10, Max 20, Current 10 -> 0th percentile
    assert calculate_valuation_percentile(10.0, 10.0, 20.0) == 0.0
    # Min 10, Max 20, Current 20 -> 100th percentile
    assert calculate_valuation_percentile(20.0, 10.0, 20.0) == 100.0
    # Beyond max clamps to 100
    assert calculate_valuation_percentile(25.0, 10.0, 20.0) == 100.0


def test_valuation_zone_classification():
    z_under = classify_valuation_zone(35.0)
    assert z_under["code"] == "UNDERVALUED"

    z_fair = classify_valuation_zone(55.0)
    assert z_fair["code"] == "FAIR_VALUE"

    z_over = classify_valuation_zone(85.0)
    assert z_over["code"] == "OVERVALUED"


def test_get_sector_radar_heatmap_default():
    res = get_sector_radar_heatmap()
    assert res["total_sectors"] == 16
    assert len(res["sectors"]) == 16
    assert "macro_summary" in res
    assert res["macro_summary"]["nifty50_pe"] == 22.4
    
    # Check sector item structure
    sec = res["sectors"][0]
    assert "name" in sec
    assert "current_multiple" in sec
    assert "historical_median" in sec
    assert "percentile" in sec
    assert "zone_code" in sec
    assert "capex_phase" in sec
    assert "rs_1y" in sec


def test_get_sector_radar_heatmap_filters():
    # Phase 3 filter
    res_p3 = get_sector_radar_heatmap(phase_filter="phase_3")
    assert res_p3["filtered_count"] > 0
    assert all(s["capex_phase_num"] == 3 for s in res_p3["sectors"])

    # PB metric
    res_pb = get_sector_radar_heatmap(metric="pb")
    assert res_pb["metric"] == "pb"


def test_get_sector_deep_dive():
    dive = get_sector_deep_dive("nifty_auto")
    assert dive["id"] == "nifty_auto"
    assert dive["name"] == "Nifty Auto"
    assert len(dive["constituents"]) >= 5
    
    # Check constituent fields
    first_c = dive["constituents"][0]
    assert "ticker" in first_c
    assert "cmp" in first_c
    assert "pe" in first_c
    assert "divergence_vs_sector_pct" in first_c
    assert "valuation_status" in first_c


def test_get_capex_cycle_matrix():
    matrix = get_capex_cycle_matrix()
    assert matrix["total_sectors"] == 16
    assert "phase_1_initiation" in matrix
    assert "phase_2_execution" in matrix
    assert "phase_3_harvest" in matrix
    assert matrix["phase_1_initiation"]["count"] > 0
    assert matrix["phase_2_execution"]["count"] > 0
    assert matrix["phase_3_harvest"]["count"] > 0


def test_api_endpoints():
    # Test heatmap endpoint
    r1 = client.get("/api/v1/api/sectors/heatmap?metric=pe&lookback=5y")
    if r1.status_code == 404:
        r1 = client.get("/api/sectors/heatmap?metric=pe&lookback=5y")
    assert r1.status_code == 200
    data = r1.json()
    assert len(data["sectors"]) == 16

    # Test detail endpoint
    r2 = client.get("/api/sectors/nifty_it")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["id"] == "nifty_it"

    # Test capex matrix endpoint
    r3 = client.get("/api/sectors/capex-matrix")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["total_sectors"] == 16
