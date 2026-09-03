import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ai_engine.copilot_engine import AlphaChanakyaEngine
from app.ai_engine.copilot_tools import execute_copilot_tool

client = TestClient(app)


def test_copilot_suggestions_endpoint():
    """Verify suggestions endpoint returns context-aware prompt chips."""
    res_stock = client.get("/api/v1/copilot/suggestions?tab=company&ticker=RELIANCE")
    assert res_stock.status_code == 200
    data_stock = res_stock.json()
    assert "suggestions" in data_stock
    assert len(data_stock["suggestions"]) >= 3
    assert any("RELIANCE" in s or "Reliance" in s for s in data_stock["suggestions"])

    res_fund = client.get("/api/v1/copilot/suggestions?tab=funds&fund=122639")
    assert res_fund.status_code == 200
    data_fund = res_fund.json()
    assert "suggestions" in data_fund
    assert len(data_fund["suggestions"]) >= 3


def test_copilot_guardrail_deflection():
    """Verify non-financial queries receive a witty Chanakya deflection."""
    engine = AlphaChanakyaEngine()
    is_fin = engine.is_finance_related("How do I bake a chocolate cake?")
    assert is_fin is False

    res = client.post("/api/v1/copilot/chat", json={
        "message": "Can you write a romantic poem about rain?",
        "history": [],
        "context": {}
    })
    assert res.status_code == 200
    data = res.json()
    assert "AlphaChanakya says:" in data["response"]
    assert len(data["tool_calls_executed"]) == 0


import asyncio

def test_copilot_tool_audit_stock():
    """Verify tool_audit_stock executes and returns forensic & valuation metrics."""
    res = asyncio.run(execute_copilot_tool("tool_audit_stock", {"ticker": "RELIANCE"}))
    assert "error" not in res
    assert res["ticker"] == "RELIANCE"
    assert "cmp" in res
    assert "pe_ratio" in res
    assert "roce_pct" in res
    assert "reverse_dcf" in res
    assert "implied_growth_5y" in res["reverse_dcf"]


def test_copilot_tool_forecast_growth():
    """Verify tool_forecast_growth returns 3-year forward scenarios."""
    res = asyncio.run(execute_copilot_tool("tool_forecast_growth", {"ticker": "TCS", "revenue_growth_pct": 12.0}))
    assert "error" not in res
    assert "TCS" in res["ticker"]
    assert "base_case" in res
    assert len(res["base_case"]["projections"]) >= 1


def test_copilot_tool_audit_mutual_fund():
    """Verify tool_audit_mutual_fund returns rolling alpha and active share."""
    res = asyncio.run(execute_copilot_tool("tool_audit_mutual_fund", {"query": "122639"}))
    assert "error" not in res
    assert res["scheme_code"] == "122639"
    assert "active_share" in res
    assert "stats" in res
    assert "form_rating" in res


def test_copilot_tool_cross_fund_overlap():
    """Verify tool_cross_fund_overlap calculates duplicate holdings."""
    res = asyncio.run(execute_copilot_tool("tool_cross_fund_overlap", {"fund_a": "122639", "fund_b": "118955"}))
    assert "error" not in res
    assert "total_overlap_pct" in res
    assert "common_holdings" in res
    assert res["common_holdings_count"] > 0


def test_copilot_tool_optimize_portfolio():
    """Verify tool_optimize_portfolio returns risk-parity allocations."""
    res = asyncio.run(execute_copilot_tool("tool_optimize_portfolio", {
        "tickers": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "LT"],
        "max_weight_pct": 20.0
    }))
    assert "error" not in res
    assert "allocations" in res
    assert len(res["allocations"]) == 6


def test_copilot_chat_endpoint_stock_query():
    """Verify chat endpoint processes stock query and executes tool calling."""
    res = client.post("/api/v1/copilot/chat", json={
        "message": "Run a 360 forensic audit on TCS",
        "history": [],
        "context": {"activeTab": "company", "selectedTicker": "TCS"}
    })
    assert res.status_code == 200
    data = res.json()
    assert "AlphaChanakya" in data["response"]
    assert len(data["suggestions"]) >= 2


def test_copilot_chat_endpoint_fund_overlap():
    """Verify chat endpoint processes fund overlap query."""
    res = client.post("/api/v1/copilot/chat", json={
        "message": "Compare overlap between Parag Parikh Flexi and HDFC Flexi Cap",
        "history": [],
        "context": {"activeTab": "funds"}
    })
    assert res.status_code == 200
    data = res.json()
    assert "Overlap" in data["response"] or "Common" in data["response"]
