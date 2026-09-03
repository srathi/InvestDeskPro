"""Stock Diagnostic Scorecard & Search API Router."""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.core.factors import (
    fetch_latest_institutional_flow,
    fetch_live_market_indices,
    fetch_live_stock_quote,
    generate_stock_scorecard,
    search_indian_stocks,
)
from app.schemas import (
    MarketIndicesResponse,
    StockPriceQuoteResponse,
    StockScorecardResponse,
    StockSearchResult,
)

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("/indices", response_model=MarketIndicesResponse)
@router.get("/market-indices", response_model=MarketIndicesResponse)
def get_market_indices():
    """Retrieve live / latest market quotes for major Indian benchmark indices & daily FII/DII institutional cash flow."""
    try:
        indices = fetch_live_market_indices()
        fii_dii = fetch_latest_institutional_flow()
        return MarketIndicesResponse(indices=indices, institutional_flow=fii_dii, status="ok")
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch live market indices: {str(exc)}",
        )


@router.get("/search", response_model=List[StockSearchResult])
def search_stocks(q: str = Query(..., min_length=1, description="Ticker prefix or company name")):
    """Fast search across 2,100+ Indian stocks by ticker, company name, or brand."""
    try:
        results = search_indian_stocks(q)
        return results
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Stock search failed for '{q}': {str(exc)}",
        )


@router.get("/{ticker}/price", response_model=StockPriceQuoteResponse)
@router.get("/{ticker}/quote", response_model=StockPriceQuoteResponse)
def get_stock_price(ticker: str):
    """Retrieve high-speed dynamic live market price, day change, 52W range, and volume for any Indian stock."""
    try:
        quote = fetch_live_stock_quote(ticker)
        return quote
    except ValueError as val_err:
        raise HTTPException(
            status_code=404,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch live stock price for '{ticker}': {str(exc)}",
        )


@router.get("/{ticker}", response_model=StockScorecardResponse)
def get_stock_diagnostic(ticker: str):
    """Retrieve 0-100 institutional factor scorecard, fundamental ratios, and price history for an Indian stock."""
    try:
        scorecard = generate_stock_scorecard(ticker)
        return scorecard
    except ValueError as val_err:
        raise HTTPException(
            status_code=404,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate stock diagnostic scorecard for '{ticker}': {str(exc)}",
        )
