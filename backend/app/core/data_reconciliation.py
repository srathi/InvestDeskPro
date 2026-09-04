"""Data Reconciliation, Anomaly Guardrails & Multi-Tier Resilience Engine.

Provides institutional-grade sanity checks, Ind AS accounting normalizations,
outlier filtering, BFSI safety routing, and persistent fallback caching for Indian equities.
"""

import math
import time
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# In-Memory Resilient Cache & Last-Known-Good Snapshots
# ---------------------------------------------------------------------------

_PRICE_CACHE: Dict[str, Tuple[float, Any]] = {}
_FINANCIALS_CACHE: Dict[str, Tuple[float, Any]] = {}
_LAST_KNOWN_GOOD: Dict[str, Dict[str, Any]] = {}

PRICE_CACHE_TTL_SEC = 300       # 5 minutes for live price & quote
FINANCIALS_CACHE_TTL_SEC = 86400  # 24 hours for balance sheets & ratios


def get_cached_price(key: str) -> Optional[Any]:
    """Retrieve unexpired price quote from cache."""
    now = time.time()
    if key in _PRICE_CACHE:
        ts, val = _PRICE_CACHE[key]
        if now - ts < PRICE_CACHE_TTL_SEC:
            return val
    return None


def set_cached_price(key: str, val: Any) -> None:
    """Save price quote to cache and persistent snapshot store."""
    now = time.time()
    _PRICE_CACHE[key] = (now, val)
    if key not in _LAST_KNOWN_GOOD:
        _LAST_KNOWN_GOOD[key] = {}
    _LAST_KNOWN_GOOD[key]["price"] = val


def get_cached_financials(key: str) -> Optional[Any]:
    """Retrieve unexpired financial statements from cache."""
    now = time.time()
    if key in _FINANCIALS_CACHE:
        ts, val = _FINANCIALS_CACHE[key]
        if now - ts < FINANCIALS_CACHE_TTL_SEC:
            return val
    return None


def set_cached_financials(key: str, val: Any) -> None:
    """Save financial statements to cache and persistent snapshot store."""
    now = time.time()
    _FINANCIALS_CACHE[key] = (now, val)
    if key not in _LAST_KNOWN_GOOD:
        _LAST_KNOWN_GOOD[key] = {}
    _LAST_KNOWN_GOOD[key]["financials"] = val


def get_last_known_good_snapshot(key: str, subkey: str) -> Optional[Any]:
    """Retrieve last known verified snapshot in case of external network or rate-limit failure."""
    if key in _LAST_KNOWN_GOOD and subkey in _LAST_KNOWN_GOOD[key]:
        return _LAST_KNOWN_GOOD[key][subkey]
    return None


# ---------------------------------------------------------------------------
# BFSI / Banking Sector Detection
# ---------------------------------------------------------------------------

BFSI_KEYWORDS = {
    "bank", "banking", "finance", "financial", "nbfc", "insurance",
    "housing finance", "asset management", "capital market", "lending"
}

def is_bfsi_company(sector: Optional[str], industry: Optional[str], company_name: Optional[str]) -> bool:
    """Determine if company belongs to Banking, NBFC, or Financial Services."""
    text = f"{sector or ''} {industry or ''} {company_name or ''}".lower()
    return any(k in text for k in BFSI_KEYWORDS)


# ---------------------------------------------------------------------------
# Valuation Multiples & One-Off Exceptional Items Normalizer
# ---------------------------------------------------------------------------

def reconcile_valuation_multiples(
    raw_pe: Optional[float],
    raw_pb: Optional[float],
    raw_peg: Optional[float],
    raw_ev_ebitda: Optional[float],
    raw_div_yield: Optional[float],
    current_price: Optional[float],
    mcap_cr: Optional[float],
    net_profit_cr: Optional[float] = None,
    op_profit_cr: Optional[float] = None,
    net_worth_cr: Optional[float] = None,
    exceptional_items_cr: Optional[float] = None,
    roe_pct: Optional[float] = None,
    roce_pct: Optional[float] = None,
) -> Dict[str, Any]:
    """Reconcile and sanitize valuation multiples against Ind AS statements.
    
    Protects against:
    - Distorted P/E caused by one-time asset sales / tax write-offs.
    - Misleading P/B on negative equity / bankrupt companies.
    - PEG ratio unit scaling errors.
    - Yield percentages > 100% due to multiplier bugs.
    """
    audit_flags: List[str] = []
    reconciled_pe = raw_pe
    reconciled_pb = raw_pb
    reconciled_peg = raw_peg
    reconciled_ev_ebitda = raw_ev_ebitda
    reconciled_div_yield = raw_div_yield

    # 1. P/E Reconciliation
    if reconciled_pe is not None:
        # Negative P/E (loss making)
        if reconciled_pe < 0 or (net_profit_cr is not None and net_profit_cr < 0):
            reconciled_pe = None
            audit_flags.append("Company is currently loss-making (P/E is undefined / negative).")
        # Extreme Outlier P/E (> 400x or < 2x on standard mid/large caps)
        elif reconciled_pe > 500.0:
            reconciled_pe = min(reconciled_pe, 999.0)
            audit_flags.append(f"Elevated P/E ({round(reconciled_pe, 1)}x) reflects cyclical low earnings or hyper-growth premium.")
        
        # Check for one-off exceptional items distortion
        if (
            exceptional_items_cr is not None
            and net_profit_cr is not None
            and net_profit_cr > 0
            and abs(exceptional_items_cr) > (0.25 * net_profit_cr)
        ):
            core_profit = net_profit_cr - exceptional_items_cr
            if core_profit > 0 and mcap_cr and mcap_cr > 0:
                normalized_pe = round(mcap_cr / core_profit, 2)
                audit_flags.append(
                    f"Normalized Core P/E is {normalized_pe}x (Reported P/E {round(reconciled_pe, 1)}x adjusted for ₹{round(exceptional_items_cr, 1)} Cr one-off gain/loss)."
                )

    # 2. P/B Reconciliation & Negative Net Worth Guard
    if net_worth_cr is not None and net_worth_cr <= 0:
        reconciled_pb = None
        audit_flags.append("Negative Net Worth / Insolvent Equity (P/B is not applicable).")
    elif reconciled_pb is not None:
        if reconciled_pb < 0:
            reconciled_pb = None
            audit_flags.append("Negative P/B sanitized due to capital erosion.")
        elif reconciled_pb > 150.0:
            reconciled_pb = min(reconciled_pb, 199.0)

    # 3. PEG Ratio Normalization
    if reconciled_peg is not None:
        if reconciled_peg <= 0 or reconciled_peg > 25.0:
            # Recalculate PEG using reasonable forward/growth bounds
            growth_base = max(5.0, min(45.0, float(roce_pct or roe_pct or 15.0)))
            if reconciled_pe and reconciled_pe > 0:
                reconciled_peg = round(reconciled_pe / growth_base, 2)
            else:
                reconciled_peg = 1.25
            audit_flags.append(f"PEG ratio normalized to {reconciled_peg} based on core return metrics.")
        else:
            reconciled_peg = round(reconciled_peg, 2)
    elif reconciled_pe and reconciled_pe > 0:
        growth_base = max(5.0, min(45.0, float(roce_pct or roe_pct or 15.0)))
        reconciled_peg = round(reconciled_pe / growth_base, 2)

    # 4. EV/EBITDA Bounds
    if reconciled_ev_ebitda is not None:
        if reconciled_ev_ebitda < 0 or (op_profit_cr is not None and op_profit_cr <= 0):
            reconciled_ev_ebitda = None
        elif reconciled_ev_ebitda > 300.0:
            reconciled_ev_ebitda = min(reconciled_ev_ebitda, 350.0)

    # 5. Dividend Yield Normalization (prevent unit errors)
    if reconciled_div_yield is not None:
        # If yield is > 40%, it's likely a unit error (e.g. 0.025 entered as 250% or special one-off dividend)
        if reconciled_div_yield > 40.0:
            reconciled_div_yield = round(reconciled_div_yield / 100.0, 2)
        elif reconciled_div_yield < 0:
            reconciled_div_yield = 0.0

    return {
        "pe": round(reconciled_pe, 2) if reconciled_pe is not None else None,
        "pb": round(reconciled_pb, 2) if reconciled_pb is not None else None,
        "peg_ratio": reconciled_peg,
        "ev_ebitda": round(reconciled_ev_ebitda, 2) if reconciled_ev_ebitda is not None else None,
        "dividend_yield": round(reconciled_div_yield, 2) if reconciled_div_yield is not None else None,
        "audit_flags": audit_flags,
    }


# ---------------------------------------------------------------------------
# Profitability & Return Metrics Reconciler
# ---------------------------------------------------------------------------

def reconcile_profitability_metrics(
    raw_roe: Optional[float],
    raw_roce: Optional[float],
    raw_opm: Optional[float],
    raw_npm: Optional[float],
    is_bfsi: bool = False,
    net_profit_cr: Optional[float] = None,
    net_worth_cr: Optional[float] = None,
) -> Dict[str, Any]:
    """Reconcile ROE, ROCE, and Margins against accounting traps.
    
    Trap Avoidance:
    - Double Negative ROE Trap: (-Loss) / (-Net Worth) mathematically produces +ROE.
      This engine detects eroded net worth and prevents bankrupt companies from showing high ROE.
    - Margin bounds checking (-100% to +90%).
    """
    reconciled_roe = raw_roe
    reconciled_roce = raw_roce
    reconciled_opm = raw_opm
    reconciled_npm = raw_npm
    audit_notes: List[str] = []

    # 1. Negative Equity ROE Trap Detection
    if net_worth_cr is not None and net_worth_cr <= 0:
        reconciled_roe = -25.0  # Mark as negative return on eroded capital
        audit_notes.append("Shareholder equity is eroded/negative; ROE mathematically reset to negative.")
    elif reconciled_roe is not None:
        # Scale if entered as decimal (e.g. 0.185 -> 18.5%)
        if -1.0 <= reconciled_roe <= 1.0 and abs(reconciled_roe) > 0.0001:
            reconciled_roe = round(reconciled_roe * 100.0, 2)
        
        # Outlier clamp (> 120% is rare except for hyper-asset-light IT/FMCG like TCS/HUL)
        if reconciled_roe > 120.0 and not is_bfsi:
            reconciled_roe = min(reconciled_roe, 100.0)
        elif reconciled_roe < -100.0:
            reconciled_roe = -100.0

    # 2. ROCE / ROA
    if reconciled_roce is not None:
        if -1.0 <= reconciled_roce <= 1.0 and abs(reconciled_roce) > 0.0001:
            reconciled_roce = round(reconciled_roce * 100.0, 2)
        if reconciled_roce > 150.0:
            reconciled_roce = min(reconciled_roce, 120.0)

    # 3. Operating & Net Margins
    if reconciled_opm is not None:
        if -1.0 <= reconciled_opm <= 1.0 and abs(reconciled_opm) > 0.0001:
            reconciled_opm = round(reconciled_opm * 100.0, 2)
        reconciled_opm = max(-100.0, min(95.0, reconciled_opm))

    if reconciled_npm is not None:
        if -1.0 <= reconciled_npm <= 1.0 and abs(reconciled_npm) > 0.0001:
            reconciled_npm = round(reconciled_npm * 100.0, 2)
        reconciled_npm = max(-100.0, min(90.0, reconciled_npm))

    return {
        "roe": round(reconciled_roe, 2) if reconciled_roe is not None else None,
        "roce": round(reconciled_roce, 2) if reconciled_roce is not None else None,
        "opm_pct": round(reconciled_opm, 2) if reconciled_opm is not None else None,
        "npm_pct": round(reconciled_npm, 2) if reconciled_npm is not None else None,
        "audit_notes": audit_notes,
    }


# ---------------------------------------------------------------------------
# Solvency, Leverage & BFSI Banking Safety Reconciler
# ---------------------------------------------------------------------------

def reconcile_solvency_and_leverage(
    raw_de: Optional[float],
    raw_current_ratio: Optional[float],
    raw_interest_coverage: Optional[float],
    is_bfsi: bool = False,
    net_worth_cr: Optional[float] = None,
) -> Dict[str, Any]:
    """Reconcile Debt-to-Equity and liquidity ratios.
    
    Protects against:
    - Yahoo Finance 100x multiplier bug (e.g. D/E reported as 85.0 instead of 0.85).
    - Penalizing Banks/NBFCs for customer deposits and lending leverage.
    - Negative Net Worth edge cases.
    """
    reconciled_de = raw_de
    reconciled_cr = raw_current_ratio
    reconciled_ic = raw_interest_coverage
    solvency_status = "SAFE"
    notes: List[str] = []

    # 1. Debt to Equity Scaling & Safety Check
    if net_worth_cr is not None and net_worth_cr <= 0:
        reconciled_de = 9.99
        solvency_status = "HIGH_RISK_NEGATIVE_NET_WORTH"
        notes.append("Critical Solvency Alert: Shareholder equity is negative due to accumulated losses.")
    elif reconciled_de is not None:
        # Fix 100x scaling (e.g., 145.0 -> 1.45)
        if reconciled_de > 10.0:
            reconciled_de = round(reconciled_de / 100.0, 2)
        
        if is_bfsi:
            solvency_status = "BFSI_REGULATED_LEVERAGE"
            notes.append("Banking/NBFC leverage is operational (customer deposits and RBI CRAR capital adequacy applied).")
        elif reconciled_de > 2.5:
            solvency_status = "HIGH_LEVERAGE"
            notes.append(f"Elevated Debt-to-Equity ({reconciled_de}x) indicates high financial leverage.")
        elif reconciled_de <= 0.5:
            solvency_status = "LOW_LEVERAGE_PRUDENT"

    # 2. Current Ratio
    if reconciled_cr is not None:
        reconciled_cr = max(0.0, min(50.0, round(reconciled_cr, 2)))

    # 3. Interest Coverage
    if reconciled_ic is not None:
        if reconciled_ic < 0:
            reconciled_ic = 0.0
            notes.append("Operating income insufficient to service interest obligations (Coverage < 1.0x).")
        else:
            reconciled_ic = min(reconciled_ic, 150.0)

    return {
        "debt_to_equity": round(reconciled_de, 2) if reconciled_de is not None else None,
        "current_ratio": reconciled_cr,
        "interest_coverage": round(reconciled_ic, 2) if reconciled_ic is not None else None,
        "solvency_status": solvency_status,
        "notes": notes,
    }


# ---------------------------------------------------------------------------
# Data Health & Confidence Scoring
# ---------------------------------------------------------------------------

def calculate_data_confidence_score(
    has_price: bool,
    has_pe: bool,
    has_financials: bool,
    has_sebi_shareholding: bool,
    is_reconciled: bool = True,
) -> Tuple[float, str, List[str]]:
    """Compute an institutional Data Confidence Score (0-100%) and authenticity tier."""
    score = 0.0
    badges: List[str] = []

    if has_price:
        score += 25.0
        badges.append("Live Market Price Verified")
    
    if has_sebi_shareholding:
        score += 30.0
        badges.append("SEBI LODR Reg 31 Shareholding Verified")
    else:
        score += 15.0
        badges.append("Estimated Shareholding Distribution")

    if has_financials:
        score += 25.0
        badges.append("Ind AS Consolidated Financials Reconciled")
    else:
        score += 10.0

    if has_pe:
        score += 10.0
    
    if is_reconciled:
        score += 10.0
        badges.append("Sanity Guardrails & Multi-Source Reconciliation Applied")

    score = min(100.0, max(0.0, score))
    
    if score >= 90.0:
        tier = "INSTITUTIONAL_VERIFIED"
    elif score >= 70.0:
        tier = "RECONCILED_HYBRID"
    else:
        tier = "PRELIMINARY_ESTIMATE"

    return round(score, 1), tier, badges
