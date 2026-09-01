"""Tests for Finology + Tijori Company 360, Screener, Bundles, and Omni-Search."""

from fastapi.testclient import TestClient
from app.main import app

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
    assert len(data["segments"]) >= 1
    assert len(data["forensics"]) >= 1
    assert data["reverse_dcf"]["implied_5y_cagr"] is not None


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
