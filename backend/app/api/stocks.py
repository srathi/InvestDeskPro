"""Stock Diagnostic Scorecard & Search API Router."""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.core.factors import generate_stock_scorecard, search_indian_stocks
from app.schemas import StockScorecardResponse, StockSearchResult

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("/search", response_model=List[StockSearchResult])
def search_stocks(q: str = Query(..., min_length=1, description="Ticker prefix or company name")):
    """Fast search for Indian stocks by ticker or company name."""
    try:
        results = search_indian_stocks(q)
        return results
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Stock search failed for '{q}': {str(exc)}",
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
