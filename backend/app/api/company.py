"""API endpoints for Company 360, Stock Screener, Curated Bundles, and Omni-Search."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.company_deep import fetch_company_360, fetch_company_history
from app.core.mf_engine import search_mutual_funds
from app.core.screener_engine import (
    MASTER_STOCK_UNIVERSE,
    get_investment_bundles,
    run_stock_screener,
)
from app.schemas import (
    Company360Response,
    InvestmentBundleItem,
    ScreenerFilterRequest,
    ScreenerResponse,
    StockHistoryResponse,
)

router = APIRouter(tags=["Company & Screener"])


class OmniSearchResult(BaseModel):
    id: str
    name: str
    symbol_or_code: str
    type: str  # 'stock' or 'fund'
    sector_or_category: Optional[str] = None
    price_or_nav: Optional[float] = None


@router.get("/company/{ticker}", response_model=Company360Response)
@router.get("/stocks/{ticker}/deep", response_model=Company360Response)
def get_company_deep(ticker: str):
    """Retrieve full institutional 360° fundamental dossier, segments, forensics, and DCF."""
    try:
        return fetch_company_360(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Company 360 for {ticker}: {str(e)}")


@router.get("/company/{ticker}/history", response_model=StockHistoryResponse)
def get_company_history(ticker: str, timeframe: str = Query("1y", description="Timeframe: 1m, 6m, 1y, 3y, 5y, max")):
    """Retrieve multi-timeframe daily prices, moving averages, and P/E valuation trajectories."""
    try:
        return fetch_company_history(ticker, timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch price history for {ticker}: {str(e)}")


@router.post("/screener/filter", response_model=ScreenerResponse)
def screen_stocks(req: ScreenerFilterRequest):
    """Filter and sort Indian equities using multi-factor fundamental metrics."""
    try:
        return run_stock_screener(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screener evaluation failed: {str(e)}")


@router.get("/screener/stocks", response_model=ScreenerResponse)
def get_all_screener_stocks():
    """Retrieve the master screener stock list."""
    return ScreenerResponse(total_matches=len(MASTER_STOCK_UNIVERSE), stocks=MASTER_STOCK_UNIVERSE)


@router.get("/bundles", response_model=List[InvestmentBundleItem])
def get_bundles():
    """Retrieve curated thematic investment baskets."""
    return get_investment_bundles()


from app.core.factors import search_indian_stocks


@router.get("/search/omni", response_model=List[OmniSearchResult])
async def omni_search(q: str = Query(..., min_length=1)):
    """Unified search for Indian equities (NSE/BSE) and AMFI Mutual Funds."""
    query_clean = q.strip()
    if not query_clean:
        return []

    results: List[OmniSearchResult] = []
    seen = set()

    # 1. Full Indian Equities Search (Directory + Live Exchange Search)
    try:
        stock_matches = search_indian_stocks(query_clean)
        for s in stock_matches[:8]:
            if s.ticker not in seen:
                results.append(
                    OmniSearchResult(
                        id=s.ticker,
                        name=s.name,
                        symbol_or_code=s.ticker.replace(".NS", "").replace(".BO", ""),
                        type="stock",
                        sector_or_category=s.sector,
                        price_or_nav=None,
                    )
                )
                seen.add(s.ticker)
    except Exception:
        pass

    # 2. Search AMFI Mutual Funds
    try:
        mf_results = await search_mutual_funds(query_clean.lower())
        for mf in mf_results[:5]:
            code = str(mf.scheme_code)
            if code not in seen:
                results.append(
                    OmniSearchResult(
                        id=code,
                        name=mf.scheme_name,
                        symbol_or_code=f"AMFI #{code}",
                        type="fund",
                        sector_or_category="Mutual Fund",
                        price_or_nav=None,
                    )
                )
                seen.add(code)
    except Exception:
        pass

    return results[:12]
