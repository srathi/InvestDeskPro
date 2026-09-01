"""Portfolio Risk-Parity Optimizer API Router."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.portfolio import optimize_risk_parity_portfolio
from app.schemas import PortfolioOptimizeResponse

router = APIRouter(prefix="/portfolio", tags=["Portfolio Optimizer"])


class OptimizeBody(BaseModel):
    tickers: List[str] = Field(..., min_length=2, description="List of stock tickers (e.g. ['TCS.NS', 'INFY.NS', 'HDFCBANK.NS'])")
    max_weight_pct: float = Field(15.0, ge=1.0, le=100.0, description="Max individual asset weight ceiling in %")


@router.get("/optimize", response_model=PortfolioOptimizeResponse)
def get_optimized_portfolio(
    tickers: List[str] = Query(..., description="Stock tickers (pass multiple tickers=... params)"),
    max_weight: float = Query(15.0, ge=1.0, le=100.0, description="Max individual asset weight cap (%)"),
):
    """Compute Inverse-Volatility Risk-Parity allocation weights and risk metrics via GET query parameters."""
    if len(tickers) < 2:
        raise HTTPException(
            status_code=400,
            detail="Portfolio optimization requires at least 2 tickers. Provide multiple tickers parameter values.",
        )
    try:
        response = optimize_risk_parity_portfolio(tickers=tickers, max_weight_pct=max_weight)
        return response
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate risk-parity portfolio: {str(exc)}",
        )


@router.post("/optimize", response_model=PortfolioOptimizeResponse)
def post_optimized_portfolio(body: OptimizeBody):
    """Compute Inverse-Volatility Risk-Parity allocation weights via POST JSON body."""
    try:
        response = optimize_risk_parity_portfolio(tickers=body.tickers, max_weight_pct=body.max_weight_pct)
        return response
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate risk-parity portfolio: {str(exc)}",
        )
