"""Pydantic data models and API schemas for InvestDeskPro.
Incorporates Trendlyne DVM, Simply Wall St Radar, Tickertape Red Flags, Morningstar Style Box & Portfolio Visualizer Models.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    timestamp: str
    service: str = "investdeskpro-api"
    version: str = "1.1.0"


# ---------------------------------------------------------------------------
# Stock Factor Scorecard Models (Trendlyne DVM + Simply Wall St + Tickertape)
# ---------------------------------------------------------------------------

class FactorScoreDetail(BaseModel):
    score: float = Field(..., description="Calculated sub-score")
    max_score: float = Field(..., description="Maximum possible sub-score")
    grade: str = Field(..., description="Verbal grade e.g. High, Moderate, Low")
    summary: str = Field(..., description="Human-readable breakdown")


class DVMScorecard(BaseModel):
    durability: float = Field(..., ge=0, le=100, description="Durability / Quality Score (0-100)")
    valuation: float = Field(..., ge=0, le=100, description="Valuation Score (0-100)")
    momentum: float = Field(..., ge=0, le=100, description="Momentum & Volatility Score (0-100)")
    classification: str = Field(..., description="Institutional DVM classification (e.g. High Quality Compounder, Momentum Trap)")


class RadarAxis(BaseModel):
    axis: str
    value: float
    max_value: float = 100.0


class StockFlags(BaseModel):
    green_flags: List[str] = Field(default_factory=list)
    red_flags: List[str] = Field(default_factory=list)


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
    verdict: str = Field(..., description="Institutional verdict")
    dvm: DVMScorecard
    radar_axes: List[RadarAxis] = Field(default_factory=list)
    flags: StockFlags
    quality: FactorScoreDetail
    value: FactorScoreDetail
    momentum_low_vol: FactorScoreDetail
    fundamentals: StockFundamentals
    price_history: List[StockPricePoint] = Field(default_factory=list)


class StockSearchResult(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = "Equities"
    exchange: str = "NSE"


# ---------------------------------------------------------------------------
# Mutual Fund Models (Advisorkhoj + Morningstar + PrimeInvestor)
# ---------------------------------------------------------------------------

class FundMeta(BaseModel):
    scheme_code: str
    scheme_name: str
    fund_house: Optional[str] = None
    scheme_type: Optional[str] = None
    scheme_category: Optional[str] = None


class FundStyleBox(BaseModel):
    size: str = Field("Large", description="Market cap size: Large, Mid, Small, Flexi")
    style: str = Field("Blend", description="Investment style: Value, Blend, Growth")


class FundRollingSummary(BaseModel):
    total_windows: int
    outperforming_windows: int
    outperformance_rate_pct: float
    verdict: str


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
    style_box: FundStyleBox
    rolling_summary: FundRollingSummary
    stats: FundRiskStats
    rolling_series: List[FundRollingDataPoint] = Field(default_factory=list)
    latest_nav: float
    latest_nav_date: str


class FundSearchResult(BaseModel):
    scheme_code: str
    scheme_name: str


# ---------------------------------------------------------------------------
# Portfolio Optimizer Models (Portfolio Visualizer & Capitalmind)
# ---------------------------------------------------------------------------

class PortfolioAssetAllocation(BaseModel):
    ticker: str
    name: Optional[str] = None
    weight_pct: float = Field(..., description="Target allocation weight (%)")
    raw_weight_pct: float = Field(..., description="Uncapped raw inverse-vol weight (%)")
    realized_volatility: float = Field(..., description="1-Year Annualized Volatility (%)")
    risk_contribution_pct: float = Field(..., description="Marginal contribution to total portfolio risk (%)")
    expected_return_1y: float = Field(..., description="Historical 1Y annualized return (%)")


class PortfolioBacktestPoint(BaseModel):
    date: str
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
    correlation_matrix: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    backtest_series: List[PortfolioBacktestPoint] = Field(default_factory=list)
    effective_number_of_assets: float = Field(..., description="Diversification ratio / ENB metric")
