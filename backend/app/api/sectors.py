"""
InvestDeskPro: Sector Valuation & Industry Radar REST API Endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from app.core.sector_radar import (
    get_sector_radar_heatmap,
    get_sector_deep_dive,
    get_capex_cycle_matrix,
    SECTOR_DATABASE
)

router = APIRouter(prefix="/api/sectors", tags=["sectors"])


@router.get("/heatmap")
def get_heatmap(
    metric: str = Query(default="pe", description="Valuation metric: pe, pb, ev_ebitda, div_yield"),
    lookback: str = Query(default="5y", description="Historical baseline: 3y, 5y, 10y"),
    phase: str = Query(default="all", description="Capex phase filter: all, phase_1, phase_2, phase_3")
) -> Dict[str, Any]:
    """
    Returns the comprehensive 16-sector valuation heatmap with percentile ranks, zones, and macro statistics.
    """
    try:
        return get_sector_radar_heatmap(metric=metric, lookback=lookback, phase_filter=phase)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate sector heatmap: {str(e)}")


@router.get("/capex-matrix")
def get_capex_matrix() -> Dict[str, Any]:
    """
    Returns the 3-phase Capex Cycle and Earnings Reinvestment Matrix.
    """
    try:
        return get_capex_cycle_matrix()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve capex matrix: {str(e)}")


@router.get("/{sector_id}")
def get_sector_detail(sector_id: str) -> Dict[str, Any]:
    """
    Returns deep-dive analytics and constituent stock breakdown for a specific sector.
    """
    res = get_sector_deep_dive(sector_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Sector '{sector_id}' not found.")
    return res
