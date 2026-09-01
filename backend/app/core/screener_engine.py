"""Stock Screener & Curated Investment Bundles Engine for Indian Equities."""

from typing import List, Optional
from app.schemas import (
    InvestmentBundleItem,
    ScreenerFilterRequest,
    ScreenerResponse,
    ScreenerStockItem,
)

# Comprehensive Master Stock Universe for Indian Equities
MASTER_STOCK_UNIVERSE: List[ScreenerStockItem] = [
    ScreenerStockItem(ticker="RELIANCE.NS", company_name="Reliance Industries", sector="Energy & Conglomerate", market_cap_cr=2015000.0, price=2980.0, pe=28.4, pb=2.3, roe=10.2, roce=12.1, debt_to_equity=0.42, return_1y=26.4, div_yield=0.35, quality_score=78.0),
    ScreenerStockItem(ticker="TCS.NS", company_name="Tata Consultancy Services", sector="Information Technology", market_cap_cr=1485000.0, price=4120.0, pe=31.2, pb=14.2, roe=48.5, roce=61.2, debt_to_equity=0.04, return_1y=22.8, div_yield=1.45, quality_score=94.0),
    ScreenerStockItem(ticker="HDFCBANK.NS", company_name="HDFC Bank Limited", sector="Financial Services", market_cap_cr=1260000.0, price=1655.0, pe=19.2, pb=2.8, roe=16.8, roce=17.2, debt_to_equity=0.85, return_1y=8.4, div_yield=1.15, quality_score=85.0),
    ScreenerStockItem(ticker="INFY.NS", company_name="Infosys Limited", sector="Information Technology", market_cap_cr=785000.0, price=1890.0, pe=28.6, pb=8.4, roe=31.8, roce=40.5, debt_to_equity=0.06, return_1y=34.2, div_yield=2.05, quality_score=90.0),
    ScreenerStockItem(ticker="ICICIBANK.NS", company_name="ICICI Bank Limited", sector="Financial Services", market_cap_cr=860000.0, price=1225.0, pe=18.4, pb=3.1, roe=18.5, roce=19.4, debt_to_equity=0.72, return_1y=28.6, div_yield=0.85, quality_score=88.0),
    ScreenerStockItem(ticker="TATAMOTORS.NS", company_name="Tata Motors Limited", sector="Automobile", market_cap_cr=348000.0, price=948.5, pe=10.4, pb=3.4, roe=31.2, roce=19.4, debt_to_equity=0.42, return_1y=42.5, div_yield=0.65, quality_score=82.0),
    ScreenerStockItem(ticker="ITC.NS", company_name="ITC Limited", sector="FMCG & Consumer", market_cap_cr=615000.0, price=492.0, pe=28.2, pb=8.1, roe=29.4, roce=39.2, debt_to_equity=0.01, return_1y=12.4, div_yield=2.85, quality_score=92.0),
    ScreenerStockItem(ticker="LT.NS", company_name="Larsen & Toubro", sector="Capital Goods & Infra", market_cap_cr=495000.0, price=3610.0, pe=36.4, pb=5.2, roe=15.2, roce=17.4, debt_to_equity=0.82, return_1y=25.2, div_yield=0.95, quality_score=80.0),
    ScreenerStockItem(ticker="HINDUNILVR.NS", company_name="Hindustan Unilever", sector="FMCG & Consumer", market_cap_cr=648000.0, price=2760.0, pe=62.4, pb=12.4, roe=20.4, roce=28.2, debt_to_equity=0.02, return_1y=10.5, div_yield=1.55, quality_score=86.0),
    ScreenerStockItem(ticker="BAJFINANCE.NS", company_name="Bajaj Finance Limited", sector="Financial Services", market_cap_cr=435000.0, price=7050.0, pe=29.5, pb=6.2, roe=22.4, roce=24.5, debt_to_equity=1.45, return_1y=2.8, div_yield=0.52, quality_score=83.0),
    ScreenerStockItem(ticker="TITAN.NS", company_name="Titan Company", sector="Consumer Discretionary", market_cap_cr=315000.0, price=3540.0, pe=88.4, pb=28.2, roe=33.5, roce=36.2, debt_to_equity=0.48, return_1y=16.8, div_yield=0.32, quality_score=84.0),
    ScreenerStockItem(ticker="SUNPHARMA.NS", company_name="Sun Pharma Industries", sector="Healthcare & Pharma", market_cap_cr=412000.0, price=1720.0, pe=38.2, pb=6.4, roe=16.8, roce=20.5, debt_to_equity=0.08, return_1y=52.4, div_yield=0.78, quality_score=87.0),
    ScreenerStockItem(ticker="MARUTI.NS", company_name="Maruti Suzuki India", sector="Automobile", market_cap_cr=385000.0, price=12240.0, pe=28.4, pb=4.8, roe=17.2, roce=23.4, debt_to_equity=0.01, return_1y=19.4, div_yield=1.05, quality_score=89.0),
    ScreenerStockItem(ticker="PICCADILY.NS", company_name="Piccadily Agro Industries", sector="Distillery & Beverages", market_cap_cr=8450.0, price=895.0, pe=42.5, pb=14.2, roe=38.4, roce=42.1, debt_to_equity=0.18, return_1y=310.5, div_yield=0.25, quality_score=86.0),
    ScreenerStockItem(ticker="TRENT.NS", company_name="Trent Limited", sector="Consumer Retail", market_cap_cr=245000.0, price=6890.0, pe=142.0, pb=36.4, roe=28.5, roce=32.4, debt_to_equity=0.22, return_1y=230.4, div_yield=0.08, quality_score=81.0),
    ScreenerStockItem(ticker="CDSL.NS", company_name="Central Depository Services", sector="Capital Market Infra", market_cap_cr=32500.0, price=1550.0, pe=68.4, pb=21.2, roe=32.4, roce=44.2, debt_to_equity=0.00, return_1y=112.5, div_yield=0.92, quality_score=95.0),
    ScreenerStockItem(ticker="POLYCAB.NS", company_name="Polycab India Limited", sector="Capital Goods & Electricals", market_cap_cr=98000.0, price=6520.0, pe=52.4, pb=12.1, roe=24.5, roce=31.2, debt_to_equity=0.04, return_1y=38.4, div_yield=0.45, quality_score=88.0),
    ScreenerStockItem(ticker="DIXON.NS", company_name="Dixon Technologies", sector="EMS & Tech Hardware", market_cap_cr=76500.0, price=12850.0, pe=118.0, pb=38.2, roe=28.4, roce=34.5, debt_to_equity=0.12, return_1y=164.2, div_yield=0.08, quality_score=82.0),
    ScreenerStockItem(ticker="KAYNES.NS", company_name="Kaynes Technology", sector="EMS & Aerospace", market_cap_cr=34200.0, price=5350.0, pe=135.0, pb=22.4, roe=18.4, roce=22.8, debt_to_equity=0.15, return_1y=182.4, div_yield=0.00, quality_score=79.0),
    ScreenerStockItem(ticker="TATAPOWER.NS", company_name="Tata Power Company", sector="Utilities & Energy", market_cap_cr=138000.0, price=432.0, pe=34.5, pb=4.2, roe=12.4, roce=14.2, debt_to_equity=1.35, return_1y=68.4, div_yield=0.48, quality_score=74.0),
]


def run_stock_screener(req: ScreenerFilterRequest) -> ScreenerResponse:
    """Filter and sort stocks according to multi-criteria parameters."""
    filtered = []
    for s in MASTER_STOCK_UNIVERSE:
        # Market cap filter
        if req.min_market_cap_cr is not None and s.market_cap_cr < req.min_market_cap_cr:
            continue
        if req.max_market_cap_cr is not None and s.market_cap_cr > req.max_market_cap_cr:
            continue
        # P/E filter
        if req.min_pe is not None and (s.pe is None or s.pe < req.min_pe):
            continue
        if req.max_pe is not None and (s.pe is None or s.pe > req.max_pe):
            continue
        # ROE filter
        if req.min_roe is not None and (s.roe is None or s.roe < req.min_roe):
            continue
        # ROCE filter
        if req.min_roce is not None and (s.roce is None or s.roce < req.min_roce):
            continue
        # Debt to Equity filter
        if req.max_debt_to_equity is not None and (s.debt_to_equity is not None and s.debt_to_equity > req.max_debt_to_equity):
            continue
        # 1Y Return filter
        if req.min_return_1y is not None and (s.return_1y is None or s.return_1y < req.min_return_1y):
            continue
        # Dividend yield filter
        if req.min_div_yield is not None and (s.div_yield is None or s.div_yield < req.min_div_yield):
            continue
        # Sector filter
        if req.sector and req.sector.lower() not in s.sector.lower():
            continue

        filtered.append(s)

    # Sorting
    reverse_order = req.sort_order.lower() == "desc"
    key_field = req.sort_by or "market_cap_cr"

    def sort_val(item: ScreenerStockItem):
        v = getattr(item, key_field, None)
        return v if v is not None else -999999.0

    filtered.sort(key=sort_val, reverse=reverse_order)
    return ScreenerResponse(total_matches=len(filtered), stocks=filtered)


def get_investment_bundles() -> List[InvestmentBundleItem]:
    """Return pre-curated thematic investment baskets."""
    stock_map = {s.ticker.replace(".NS", ""): s for s in MASTER_STOCK_UNIVERSE}

    bundles = [
        InvestmentBundleItem(
            id="debt-free-compounders",
            name="Debt-Free Compounders",
            tagline="Zero-debt cash machines with >25% ROE",
            icon="ShieldCheck",
            risk_level="Low to Moderate",
            avg_pe=32.4,
            avg_roe=38.2,
            avg_1y_return=44.5,
            description="Pristine balance sheet companies with virtually zero debt, generating high free cash flow and compounding shareholder wealth across business cycles.",
            tickers=["TCS", "INFY", "ITC", "MARUTI", "CDSL", "POLYCAB"],
            sample_stocks=[stock_map[t] for t in ["TCS", "INFY", "ITC", "MARUTI", "CDSL", "POLYCAB"] if t in stock_map],
        ),
        InvestmentBundleItem(
            id="high-dividend-aristocrats",
            name="High Dividend Aristocrats",
            tagline="Stable cash flows with steady dividend payouts",
            icon="Coins",
            risk_level="Conservative / Low",
            avg_pe=24.8,
            avg_roe=26.4,
            avg_1y_return=18.2,
            description="Established market stalwarts with defensive cash flows, high operating margins, and regular dividend distribution yields.",
            tickers=["ITC", "TCS", "INFY", "HINDUNILVR", "HDFCBANK"],
            sample_stocks=[stock_map[t] for t in ["ITC", "TCS", "INFY", "HINDUNILVR", "HDFCBANK"] if t in stock_map],
        ),
        InvestmentBundleItem(
            id="monopoly-moat-leaders",
            name="Monopoly & High-Moat Leaders",
            tagline="Unrivaled pricing power and network dominance",
            icon="Crown",
            risk_level="Moderate",
            avg_pe=48.2,
            avg_roe=34.5,
            avg_1y_return=62.4,
            description="Businesses with insurmountable competitive moats, regulatory licenses, or dominant consumer brand loyalty in India.",
            tickers=["CDSL", "TITAN", "TRENT", "ITC", "RELIANCE"],
            sample_stocks=[stock_map[t] for t in ["CDSL", "TITAN", "TRENT", "ITC", "RELIANCE"] if t in stock_map],
        ),
        InvestmentBundleItem(
            id="smallcap-superstars",
            name="Smallcap Growth & Turnarounds",
            tagline="High-alpha compounders with fast revenue growth",
            icon="Rocket",
            risk_level="Aggressive / High",
            avg_pe=68.5,
            avg_roe=32.4,
            avg_1y_return=198.5,
            description="High-velocity emerging businesses in distillery, electronics manufacturing (EMS), and high-end consumer retail scaling rapidly.",
            tickers=["PICCADILY", "KAYNES", "DIXON", "TRENT"],
            sample_stocks=[stock_map[t] for t in ["PICCADILY", "KAYNES", "DIXON", "TRENT"] if t in stock_map],
        ),
        InvestmentBundleItem(
            id="bluechip-titans",
            name="Nifty Bluechip Titans",
            tagline="Core foundation of India's economic expansion",
            icon="Building2",
            risk_level="Balanced",
            avg_pe=22.4,
            avg_roe=22.8,
            avg_1y_return=24.2,
            description="The pillars of corporate India across banking, software, infrastructure, auto, and retail with deep institutional liquidity.",
            tickers=["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "LT", "TATAMOTORS"],
            sample_stocks=[stock_map[t] for t in ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "LT", "TATAMOTORS"] if t in stock_map],
        ),
    ]

    return bundles
