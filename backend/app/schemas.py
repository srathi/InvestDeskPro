"""Pydantic data models and API schemas for InvestDeskPro."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    timestamp: str
    service: str = "investdeskpro-api"
    version: str = "1.0.0"


# ---------------------------------------------------------------------------
# Stock Factor Scorecard Models
# ---------------------------------------------------------------------------

class FactorScoreDetail(BaseModel):
    score: float = Field(..., description="Calculated sub-score")
    max_score: float = Field(..., description="Maximum possible sub-score")
    grade: str = Field(..., description="Verbal grade e.g. High, Moderate, Low")
    summary: str = Field(..., description="Human-readable breakdown")


class StockFundamentals(BaseModel):
    market_cap: Optional[float] = None
    roe: Optional[float] = Field(None, description="Return on Equity (%)")
    roce: Optional[float] = Field(None, description="Return on Capital Employed / ROA (%)")
    debt_to_equity: Optional[float] = Field(None, description="Debt to Equity Ratio")
    fcf_to_net_profit: Optional[float] = Field(None, description="Free Cash Flow to Net Profit Ratio")
    operating_margin: Optional[float] = Field(None, description="Operating Profit Margin (%)")
    net_margin: Optional[float] = Field(None, description="Net Profit Margin (%)")
    trailing_pe: Optional[float] = Field(None, description="Trailing Price-to-Earnings Ratio")
    forward_pe: Optional[float] = Field(None, description="Forward Price-to-Earnings Ratio")
    peg_ratio: Optional[float] = Field(None, description="PEG Ratio")
    price_to_book: Optional[float] = Field(None, description="Price to Book Ratio")
    return_6m: Optional[float] = Field(None, description="6-Month Return (%)")
    return_1y: Optional[float] = Field(None, description="1-Year Return (%)")
    realized_vol_60d: Optional[float] = Field(None, description="60-Day Annualized Volatility (%)")
    current_price: Optional[float] = None
    currency: str = "INR"


class StockPricePoint(BaseModel):
    date: str
    close: float
    volume: Optional[float] = None


class StockScorecardResponse(BaseModel):
    ticker: str
    company_name: str
    sector: Optional[str] = "N/A"
    industry: Optional[str] = "N/A"
    total_score: float = Field(..., ge=0, le=100, description="Overall institutional rating out of 100")
    verdict: str = Field(..., description="Institutional verdict (e.g., High Quality Compounder, Value Opportunity, Watchlist)")
    quality: FactorScoreDetail
    value: FactorScoreDetail
    momentum_low_vol: FactorScoreDetail
    fundamentals: StockFundamentals
    price_history: List[StockPricePoint] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Mutual Fund Models
# ---------------------------------------------------------------------------

class FundMeta(BaseModel):
    scheme_code: str
    scheme_name: str
    fund_house: Optional[str] = None
    scheme_type: Optional[str] = None
    scheme_category: Optional[str] = None


class FundRollingDataPoint(BaseModel):
    date: str
    fund_rolling_cagr: float
    benchmark_rolling_cagr: float
    rolling_alpha: float


class FundRiskStats(BaseModel):
    mean_3y_rolling_alpha: float = Field(..., description="Average 3-Year rolling alpha (%)")
    current_3y_alpha: float = Field(..., description="Latest 3-Year rolling alpha (%)")
    alpha_consistency_pct: float = Field(..., description="Percentage of 3Y rolling windows with positive alpha")
    information_ratio: float = Field(..., description="Active return over tracking error")
    downside_capture_ratio: float = Field(..., description="Downside capture ratio vs Nifty 50 TRI (%)")
    upside_capture_ratio: float = Field(..., description="Upside capture ratio vs Nifty 50 TRI (%)")
    sharpe_ratio: float = Field(..., description="Annualized Sharpe Ratio")
    sortino_ratio: float = Field(..., description="Annualized Sortino Ratio")
    max_drawdown_pct: float = Field(..., description="Maximum drawdown percentage over historical period")
    cagr_1y: Optional[float] = None
    cagr_3y: Optional[float] = None
    cagr_5y: Optional[float] = None
    fund_volatility: float = Field(..., description="Annualized standard deviation of fund (%)")
    benchmark_volatility: float = Field(..., description="Annualized standard deviation of benchmark (%)")


class FundAnalysisResponse(BaseModel):
    meta: FundMeta
    benchmark_name: str = "Nifty 50 TRI (^NSEI)"
    stats: FundRiskStats
    rolling_series: List[FundRollingDataPoint] = Field(default_factory=list)
    latest_nav: float
    latest_nav_date: str


class FundSearchResult(BaseModel):
    scheme_code: str
    scheme_name: str


# ---------------------------------------------------------------------------
# Portfolio Optimizer Models
# ---------------------------------------------------------------------------

class PortfolioAssetAllocation(BaseModel):
    ticker: str
    name: Optional[str] = None
    weight_pct: float = Field(..., description="Target allocation weight (%)")
    raw_weight_pct: float = Field(..., description="Uncapped raw inverse-vol weight (%)")
    realized_volatility: float = Field(..., description="1-Year Annualized Volatility (%)")
    risk_contribution_pct: float = Field(..., description="Marginal contribution to total portfolio risk (%)")
    expected_return_1y: float = Field(..., description="Historical 1Y annualized return (%)")


class PortfolioComparisonMetric(BaseModel):
    metric: str
    risk_parity: float
    equal_weight: float


class PortfolioOptimizeResponse(BaseModel):
    tickers: List[str]
    allocations: List[PortfolioAssetAllocation]
    total_portfolio_volatility: float = Field(..., description="Annualized portfolio volatility (%)")
    equal_weight_volatility: float = Field(..., description="Equal weight baseline volatility (%)")
    volatility_reduction_pct: float = Field(..., description="Volatility reduction vs equal-weight (%)")
    portfolio_expected_return: float = Field(..., description="Expected 1-Year annualized return (%)")
    portfolio_sharpe_ratio: float = Field(..., description="Sharpe ratio (assuming 6.5% risk-free rate)")
    max_weight_constraint: float = Field(..., description="Enforced maximum weight cap (%)")
    covariance_matrix: Dict[str, Dict[str, float]]
    effective_number_of_assets: float = Field(..., description="Diversification ratio / ENB metric")
