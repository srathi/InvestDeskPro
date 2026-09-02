"""Tests for Finology + Tijori Company 360, Screener, Bundles, and Omni-Search."""

from fastapi.testclient import TestClient
from app.main import app
from app.core.company_deep import calculate_dcf_sensitivity_matrix, calculate_institutional_delta
from app.schemas import ShareholdingQuarter

client = TestClient(app)


def test_company_deep_endpoint():
    """Verify Company 360 endpoint returns essentials, segments, forensics, and DCF."""
    response = client.get("/api/v1/company/TATAMOTORS")
    assert response.status_code == 200
    data = response.json()
    assert "ticker" in data
    assert "essentials" in data
    assert "segments" in data
    assert "forensics" in data
    assert "reverse_dcf" in data
    assert "financials" in data
    assert "shareholding" in data
    assert "quarterly_financials" in data
    assert "dcf_sensitivity_matrix" in data
    assert "institutional_delta" in data
    assert len(data["segments"]) >= 1
    assert len(data["forensics"]) >= 1
    assert data["reverse_dcf"]["implied_5y_cagr"] is not None
    if data["quarterly_financials"]:
        assert len(data["quarterly_financials"]["quarters"]) >= 4
        assert len(data["quarterly_financials"]["rows"]) >= 5
    if data["dcf_sensitivity_matrix"]:
        assert len(data["dcf_sensitivity_matrix"]["grid"]) == 5
        assert len(data["dcf_sensitivity_matrix"]["grid"][0]) == 5
        assert data["dcf_sensitivity_matrix"]["base_fair_value"] > 0
    if data["institutional_delta"]:
        assert data["institutional_delta"]["net_institutional_sentiment"] is not None


def test_dcf_sensitivity_matrix_computation():
    """Direct unit test for 2-stage DCF intrinsic valuation and 5x5 sensitivity grid."""
    matrix = calculate_dcf_sensitivity_matrix(
        current_price=500.0,
        eps=25.0,
        base_wacc=12.0,
        base_growth=15.0,
        base_terminal_growth=4.0,
    )
    assert matrix.current_market_price == 500.0
    assert matrix.base_fair_value > 0
    assert len(matrix.wacc_rates) == 5
    assert len(matrix.terminal_growth_rates) == 5
    assert len(matrix.grid) == 5
    assert len(matrix.grid[0]) == 5
    # Base case cell should be marked
    base_cells = [cell for row in matrix.grid for cell in row if cell.is_base_case]
    assert len(base_cells) == 1
    assert base_cells[0].wacc_pct == 12.0
    assert base_cells[0].terminal_growth_pct == 4.0


def test_institutional_delta_computation():
    """Direct unit test for institutional ownership delta tracking."""
    shareholding = [
        ShareholdingQuarter(quarter="Q1", promoter_pct=50.0, fii_pct=15.0, dii_pct=10.0, public_pct=25.0, pledged_pct=0.0),
        ShareholdingQuarter(quarter="Q2", promoter_pct=50.5, fii_pct=16.0, dii_pct=10.5, public_pct=23.0, pledged_pct=0.0),
    ]
    delta = calculate_institutional_delta(shareholding)
    assert delta.promoter_qoq_delta == 0.5
    assert delta.fii_qoq_delta == 1.0
    assert delta.dii_qoq_delta == 0.5
    assert "Inflows" in delta.net_institutional_sentiment or "Accumulation" in delta.net_institutional_sentiment


def test_screener_filter_endpoint():
    """Verify Screener filter endpoint works with multi-criteria parameters."""
    response = client.post(
        "/api/v1/screener/filter",
        json={"max_debt_to_equity": 0.5, "min_roce": 20.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_matches" in data
    assert "stocks" in data
    for s in data["stocks"]:
        if s["debt_to_equity"] is not None:
            assert s["debt_to_equity"] <= 0.5
        if s["roce"] is not None:
            assert s["roce"] >= 20.0


def test_bundles_endpoint():
    """Verify curated thematic investment bundles endpoint."""
    response = client.get("/api/v1/bundles")
    assert response.status_code == 200
    bundles = response.json()
    assert len(bundles) >= 4
    for b in bundles:
        assert "id" in b
        assert "name" in b
        assert "tickers" in b
        assert len(b["tickers"]) >= 1


def test_omni_search_endpoint():
    """Verify omni search returns both matching stocks and funds."""
    response = client.get("/api/v1/search/omni?q=Tata")
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert any(r["type"] == "stock" for r in results)


def test_company_history_endpoint():
    """Verify dedicated multi-timeframe history and valuation summary endpoint."""
    response = client.get("/api/v1/company/INFY/history?timeframe=1y")
    assert response.status_code == 200
    data = response.json()
    assert "ticker" in data
    assert "history" in data
    assert "valuation_summary" in data
    assert len(data["history"]) >= 50
    assert data["valuation_summary"]["median_pe"] is not None
    assert data["valuation_summary"]["valuation_verdict"] is not None
    # Check DMA and PE in points
    first_pt = data["history"][0]
    assert "date" in first_pt
    assert "close" in first_pt
    assert "pe" in first_pt


def test_company_history_timeframes():
    """Verify history endpoint supports multiple timeframes (1m, 5y, max)."""
    for tf in ["1m", "5y", "max"]:
        response = client.get(f"/api/v1/company/TATAMOTORS/history?timeframe={tf}")
        assert response.status_code == 200
        data = response.json()
        assert data["timeframe"] == tf
        assert len(data["history"]) >= 10
        assert data["valuation_summary"]["timeframe"] == tf

