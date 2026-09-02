"""Tests for Forward Growth & Earnings Forecasting Engine (1Y, 2Y, 3Y Horizon Projections)."""

from fastapi.testclient import TestClient
from app.main import app
from app.core.growth_forecast import calculate_forward_estimates, safe_cagr
from app.schemas import CompanyEssentials, CompanyFinancials, FinancialStatementRow, FinancialStatementTable, HistoricalValuationSummary

client = TestClient(app)


def test_safe_cagr_calculation():
    """Verify CAGR calculation and edge cases."""
    # 100 -> 133.1 in 3 years = 10% CAGR
    assert safe_cagr(100.0, 133.1, 3) == 10.0
    # Negative / zero base
    assert safe_cagr(-50.0, 100.0, 3) is None
    assert safe_cagr(0.0, 100.0, 3) is None
    assert safe_cagr(100.0, -20.0, 3) is None


def test_calculate_forward_estimates_math():
    """Verify math for Base, Bull, and Bear forward projections."""
    years = ["FY22", "FY23", "FY24", "FY25", "FY26"]
    financials = CompanyFinancials(
        income_statement=FinancialStatementTable(
            years=years,
            rows=[
                FinancialStatementRow(
                    metric_name="Revenue",
                    values={"FY22": 1000.0, "FY23": 1150.0, "FY24": 1300.0, "FY25": 1500.0, "FY26": 1700.0},
                    is_bold=True,
                ),
                FinancialStatementRow(
                    metric_name="Net Profit (PAT)",
                    values={"FY22": 150.0, "FY23": 180.0, "FY24": 210.0, "FY25": 250.0, "FY26": 300.0},
                    is_bold=True,
                ),
                FinancialStatementRow(
                    metric_name="EPS (Diluted)",
                    values={"FY22": 15.0, "FY23": 18.0, "FY24": 21.0, "FY25": 25.0, "FY26": 30.0},
                ),
            ],
        ),
        balance_sheet=FinancialStatementTable(years=years, rows=[]),
        cash_flows=FinancialStatementTable(years=years, rows=[]),
    )
    essentials = CompanyEssentials(
        market_cap_cr=15000.0,
        current_price=600.0,
        day_change=5.0,
        day_change_pct=0.8,
        high_52w=650.0,
        low_52w=400.0,
        pe=20.0,
        roe=20.0,
        dividend_yield=1.5,
        eps_ttm=30.0,
    )
    hist_val = HistoricalValuationSummary(
        timeframe="5y",
        median_pe=22.0,
        pe_plus_1sigma=27.5,
        pe_minus_1sigma=16.5,
        valuation_verdict="Fair Value",
    )

    forecast = calculate_forward_estimates(
        ticker="TEST",
        financials=financials,
        essentials=essentials,
        historical_pe_summary=hist_val,
    )

    assert forecast.ticker == "TEST"
    assert forecast.base_revenue_cr == 1700.0
    assert forecast.base_pat_cr == 300.0
    assert forecast.base_eps == 30.0
    assert forecast.base_cmp == 600.0
    assert forecast.historical_cagr_3y_rev is not None
    assert forecast.historical_cagr_3y_pat is not None
    assert forecast.sustainable_growth_rate is not None

    # Base Case Checks
    assert len(forecast.base_case.projections) == 3
    for p in forecast.base_case.projections:
        assert p.revenue_cr > forecast.base_revenue_cr
        assert p.pat_cr > 0
        assert p.eps > 0
        assert p.target_price > 0
        assert p.horizon_years in [1, 2, 3]

    # Bull Case should have higher projections than Base
    assert forecast.bull_case.projections[-1].revenue_cr > forecast.base_case.projections[-1].revenue_cr
    assert forecast.bull_case.projections[-1].target_price > forecast.base_case.projections[-1].target_price

    # Bear Case should have lower projections than Base
    assert forecast.bear_case.projections[-1].revenue_cr < forecast.base_case.projections[-1].revenue_cr
    assert forecast.bear_case.projections[-1].target_price < forecast.base_case.projections[-1].target_price

    # Driver attribution text
    assert len(forecast.driver_attribution) > 20


def test_company_forecast_api_endpoint():
    """Verify GET /api/v1/company/{ticker}/forecast endpoint returns structured forecasts."""
    response = client.get("/api/v1/company/INFY/forecast")
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "INFY"
    assert "base_case" in data
    assert "bull_case" in data
    assert "bear_case" in data
    assert len(data["base_case"]["projections"]) == 3
    assert len(data["bull_case"]["projections"]) == 3
    assert len(data["bear_case"]["projections"]) == 3
    assert data["base_case"]["projections"][0]["horizon_years"] == 1
    assert data["base_case"]["projections"][1]["horizon_years"] == 2
    assert data["base_case"]["projections"][2]["horizon_years"] == 3


def test_company_360_includes_forecast():
    """Verify Company 360 payload includes forward estimates."""
    response = client.get("/api/v1/company/TATAMOTORS")
    assert response.status_code == 200
    data = response.json()
    assert "forward_estimates" in data
    assert data["forward_estimates"] is not None
    assert "base_case" in data["forward_estimates"]
