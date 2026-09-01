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


@pytest.mark.asyncio
async def test_mutual_fund_search_local_fallback():
    from app.core.mf_engine import search_mutual_funds
    results = await search_mutual_funds("Parag")
    assert len(results) > 0
    assert any("Parag Parikh" in r.scheme_name for r in results)
