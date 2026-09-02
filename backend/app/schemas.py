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


class AnnualFinancialYear(BaseModel):
    year: str = Field(..., description="Fiscal Year, e.g. FY23, FY24, FY25, FY26")
    revenue_cr: Optional[float] = Field(None, description="Total Revenue in ₹ Cr")
    operating_profit_cr: Optional[float] = Field(None, description="Operating Profit / EBITDA in ₹ Cr")
    opm_pct: Optional[float] = Field(None, description="Operating Profit Margin (%)")
    net_profit_cr: Optional[float] = Field(None, description="Net Profit in ₹ Cr")
    npm_pct: Optional[float] = Field(None, description="Net Profit Margin (%)")
    eps: Optional[float] = Field(None, description="Basic/Diluted EPS in ₹")
    yoy_revenue_growth_pct: Optional[float] = Field(None, description="YoY Revenue Growth (%)")
    yoy_profit_growth_pct: Optional[float] = Field(None, description="YoY Net Profit Growth (%)")


class ShareholdingPattern(BaseModel):
    promoters_pct: float = Field(..., description="Promoter Holding (%)")
    institutions_pct: float = Field(..., description="Institutional Holding (%)")
    fii_pct: Optional[float] = Field(None, description="FII / Foreign Institutional Holding (%)")
    dii_pct: Optional[float] = Field(None, description="DII / Domestic Mutual Funds Holding (%)")
    public_retail_pct: float = Field(..., description="Public / Retail Holding (%)")
    pledged_pct: float = Field(0.0, description="Pledged Promoter Shares (%)")


class StockClassification(BaseModel):
    stock_type: str = Field(..., description="e.g. High-Growth Compounder, Quality Defensive, Value Opportunity, High Dividend")
    is_growth_stock: bool = Field(..., description="True if company exhibits robust growth characteristics")
    category_tag: str = Field(..., description="Growth, Value, Quality, Dividend, Cyclical, Turnaround")
    cagr_3y_revenue: Optional[float] = Field(None, description="3-Year Revenue CAGR (%)")
    cagr_3y_profit: Optional[float] = Field(None, description="3-Year Net Profit CAGR (%)")
    growth_score: float = Field(..., description="0-100 Growth Factor Score")
    rationale: str = Field(..., description="Comprehensive explanation of classification based on fundamentals")


class StockPricePoint(BaseModel):
    date: str
    close: float
    volume: Optional[float] = None
    pe: Optional[float] = None
    pb: Optional[float] = None


class StockScorecardResponse(BaseModel):
    ticker: str
    company_name: str
    sector: Optional[str] = "N/A"
    industry: Optional[str] = "N/A"
    total_score: float = Field(..., ge=0, le=100, description="Overall institutional rating out of 100")
    verdict: str = Field(..., description="Institutional verdict")
    dvm: DVMScorecard
    classification: StockClassification
    radar_axes: List[RadarAxis] = Field(default_factory=list)
    flags: StockFlags
    quality: FactorScoreDetail
    value: FactorScoreDetail
    momentum_low_vol: FactorScoreDetail
    fundamentals: StockFundamentals
    financials_annual: List[AnnualFinancialYear] = Field(default_factory=list)
    shareholding: Optional[ShareholdingPattern] = None
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


# ---------------------------------------------------------------------------
# Finology & Tijori Finance Inspired Company 360, Screener & Bundles Models
# ---------------------------------------------------------------------------

class RevenueSegment(BaseModel):
    name: str
    percentage: float
    revenue_cr: Optional[float] = None
    yoy_growth_pct: Optional[float] = None
    color: Optional[str] = None


class GeographicSegment(BaseModel):
    region: str
    percentage: float


class ForensicProbe(BaseModel):
    title: str
    status: str = Field(..., description="'pass', 'warning', or 'flag'")
    value_str: str
    benchmark_str: str
    description: str


class ReverseDCFModel(BaseModel):
    current_price: float
    current_eps: float
    discount_rate_pct: float = 12.0
    terminal_growth_pct: float = 4.0
    implied_5y_cagr: float
    implied_10y_cagr: float
    fair_value_at_15pct_growth: float
    interpretation: str


class FinancialStatementRow(BaseModel):
    metric_name: str
    values: Dict[str, Optional[float]] = Field(default_factory=dict)
    is_bold: bool = False


class FinancialStatementTable(BaseModel):
    years: List[str]
    rows: List[FinancialStatementRow]


class CompanyFinancials(BaseModel):
    income_statement: FinancialStatementTable
    balance_sheet: FinancialStatementTable
    cash_flows: FinancialStatementTable


class ShareholdingQuarter(BaseModel):
    quarter: str
    promoter_pct: float
    fii_pct: float
    dii_pct: float
    public_pct: float
    pledged_pct: float = 0.0


class PeerComparisonStock(BaseModel):
    ticker: str
    name: str
    cmp: float
    market_cap_cr: float
    pe: Optional[float] = None
    pb: Optional[float] = None
    roe: Optional[float] = None
    roce: Optional[float] = None
    opm_pct: Optional[float] = None
    return_1y: Optional[float] = None


class CompanyEssentials(BaseModel):
    market_cap_cr: float
    current_price: float
    day_change: float
    day_change_pct: float
    high_52w: float
    low_52w: float
    pe: Optional[float] = None
    industry_pe: Optional[float] = None
    pb: Optional[float] = None
    dividend_yield: Optional[float] = None
    roce: Optional[float] = None
    roe: Optional[float] = None
    face_value: Optional[float] = None
    peg_ratio: Optional[float] = None
    debt_to_equity: Optional[float] = None
    eps_ttm: Optional[float] = None
    fcf_cr: Optional[float] = None
    promoter_holding_pct: Optional[float] = None
    volume: Optional[float] = None


class QuarterlyFinancialRow(BaseModel):
    metric_name: str
    values: Dict[str, Optional[float]] = Field(default_factory=dict)
    is_bold: bool = False
    is_percentage: bool = False


class QuarterlyFinancialTable(BaseModel):
    quarters: List[str]
    rows: List[QuarterlyFinancialRow]
    yoy_revenue_growth_pct: Optional[float] = None
    yoy_pat_growth_pct: Optional[float] = None
    latest_opm_pct: Optional[float] = None


class DCFSensitivityCell(BaseModel):
    wacc_pct: float
    terminal_growth_pct: float
    fair_value: float
    margin_of_safety_pct: float
    is_base_case: bool = False


class DCFSensitivityMatrix(BaseModel):
    wacc_rates: List[float]
    terminal_growth_rates: List[float]
    grid: List[List[DCFSensitivityCell]]
    base_wacc_pct: float
    base_growth_pct: float
    base_terminal_growth_pct: float
    base_fair_value: float
    current_market_price: float
    margin_of_safety_pct: float
    valuation_status: str


class InstitutionalDelta(BaseModel):
    promoter_qoq_delta: float
    fii_qoq_delta: float
    dii_qoq_delta: float
    public_qoq_delta: float
    pledged_shares_pct: float = 0.0
    net_institutional_sentiment: str


class Company360Response(BaseModel):
    ticker: str
    company_name: str
    exchange: str = "NSE"
    sector: str
    industry: str
    market_cap_category: str = Field(..., description="Large Cap, Mid Cap, Small Cap, Micro Cap")
    about: str
    website: Optional[str] = None
    essentials: CompanyEssentials
    swot_strengths: List[str] = Field(default_factory=list)
    swot_weaknesses: List[str] = Field(default_factory=list)
    segments: List[RevenueSegment] = Field(default_factory=list)
    geography: List[GeographicSegment] = Field(default_factory=list)
    forensics: List[ForensicProbe] = Field(default_factory=list)
    reverse_dcf: ReverseDCFModel
    dcf_sensitivity_matrix: Optional[DCFSensitivityMatrix] = None
    financials: CompanyFinancials
    quarterly_financials: Optional[QuarterlyFinancialTable] = None
    shareholding: List[ShareholdingQuarter] = Field(default_factory=list)
    institutional_delta: Optional[InstitutionalDelta] = None
    peers: List[PeerComparisonStock] = Field(default_factory=list)
    price_history: List[StockPricePoint] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Screener & Thematic Bundle Models
# ---------------------------------------------------------------------------

class ScreenerFilterRequest(BaseModel):
    min_market_cap_cr: Optional[float] = None
    max_market_cap_cr: Optional[float] = None
    min_pe: Optional[float] = None
    max_pe: Optional[float] = None
    min_roe: Optional[float] = None
    min_roce: Optional[float] = None
    max_debt_to_equity: Optional[float] = None
    min_return_1y: Optional[float] = None
    min_div_yield: Optional[float] = None
    sector: Optional[str] = None
    sort_by: str = "market_cap_cr"
    sort_order: str = "desc"


class ScreenerStockItem(BaseModel):
    ticker: str
    company_name: str
    sector: str
    market_cap_cr: float
    price: float
    pe: Optional[float] = None
    pb: Optional[float] = None
    roe: Optional[float] = None
    roce: Optional[float] = None
    debt_to_equity: Optional[float] = None
    return_1y: Optional[float] = None
    div_yield: Optional[float] = None
    quality_score: float = 75.0


class ScreenerResponse(BaseModel):
    total_matches: int
    stocks: List[ScreenerStockItem]


class InvestmentBundleItem(BaseModel):
    id: str
    name: str
    tagline: str
    icon: str
    risk_level: str
    avg_pe: float
    avg_roe: float
    avg_1y_return: float
    description: str
    tickers: List[str]
    sample_stocks: List[ScreenerStockItem] = Field(default_factory=list)
