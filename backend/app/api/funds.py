"""Indian Mutual Fund Rolling Consistency & Risk API Router."""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.core.mf_engine import analyze_mutual_fund, search_mutual_funds
from app.schemas import FundAnalysisResponse, FundSearchResult

router = APIRouter(prefix="/funds", tags=["Mutual Funds"])


@router.get("/search", response_model=List[FundSearchResult])
async def search_funds(q: str = Query(..., min_length=1, description="Fund scheme name or keyword")):
    """Search Indian Mutual Fund schemes by query keyword."""
    try:
        results = await search_mutual_funds(q)
        return results
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mutual fund search failed: {str(exc)}")


@router.get("/{scheme_code}", response_model=FundAnalysisResponse)
async def get_fund_analysis(scheme_code: str):
    """Retrieve 3-Year rolling alpha, information ratio, downside/upside capture, and risk stats for an AMFI scheme."""
    try:
        analysis = await analyze_mutual_fund(scheme_code)
        return analysis
    except ValueError as val_err:
        raise HTTPException(status_code=404, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze mutual fund scheme '{scheme_code}': {str(exc)}",
        )
