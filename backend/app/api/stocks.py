"""Stock Diagnostic Scorecard API Router."""

from fastapi import APIRouter, HTTPException, Query
from app.core.factors import generate_stock_scorecard
from app.schemas import StockScorecardResponse

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("/{ticker}", response_model=StockScorecardResponse)
def get_stock_diagnostic(ticker: str):
    """Retrieve 0-100 institutional factor scorecard, fundamental ratios, and price history for an Indian stock."""
    try:
        scorecard = generate_stock_scorecard(ticker)
        return scorecard
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate stock diagnostic scorecard for '{ticker}': {str(exc)}",
        )
