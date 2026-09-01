"""API endpoints for Company 360, Stock Screener, Curated Bundles, and Omni-Search."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.company_deep import fetch_company_360
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
    """Retrieve full Finology + Tijori style 360 fundamental overview, segments, forensics, and DCF."""
    try:
        return fetch_company_360(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Company 360 for {ticker}: {str(e)}")


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


@router.get("/search/omni", response_model=List[OmniSearchResult])
async def omni_search(q: str = Query(..., min_length=1)):
    """Unified search for Indian equities (NSE/BSE) and AMFI Mutual Funds."""
    query_clean = q.strip().lower()
    results: List[OmniSearchResult] = []

    # 1. Search Stocks in Master Universe
    for s in MASTER_STOCK_UNIVERSE:
        ticker_clean = s.ticker.replace(".NS", "").replace(".BO", "").lower()
        name_clean = s.company_name.lower()
        if query_clean in ticker_clean or query_clean in name_clean:
            results.append(
                OmniSearchResult(
                    id=s.ticker,
                    name=s.company_name,
                    symbol_or_code=s.ticker.replace(".NS", ""),
                    type="stock",
                    sector_or_category=s.sector,
                    price_or_nav=s.price,
                )
            )

    # 2. Search AMFI Mutual Funds
    try:
        mf_results = await search_mutual_funds(query_clean)
        for mf in mf_results[:5]:
            results.append(
                OmniSearchResult(
                    id=mf.scheme_code,
                    name=mf.scheme_name,
                    symbol_or_code=f"AMFI #{mf.scheme_code}",
                    type="fund",
                    sector_or_category="Mutual Fund",
                    price_or_nav=None,
                )
            )
    except Exception:
        pass

    return results[:10]
