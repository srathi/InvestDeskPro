"""Quantitative Forward Growth & Earnings Forecasting Engine.

Estimates 1-Year (FY+1), 2-Year (FY+2), and 3-Year (FY+3) forward projections for
Revenue, PAT, EPS, and Target Equity Valuation based on audited historical financials,
DuPont margin trends, sustainable growth compounding (SGR), and valuation multiples.
"""

from typing import Dict, List, Optional
from app.schemas import (
    CompanyEssentials,
    CompanyFinancials,
    ForwardGrowthEstimates,
    ForwardScenario,
    ForwardYearProjection,
    HistoricalValuationSummary,
)


def safe_cagr(start_val: Optional[float], end_val: Optional[float], periods: int) -> Optional[float]:
    """Calculate compound annual growth rate safely with positive bounds checking."""
    if not start_val or not end_val or start_val <= 0 or end_val <= 0 or periods <= 0:
        return None
    try:
        cagr = (end_val / start_val) ** (1.0 / periods) - 1.0
        return round(cagr * 100.0, 2)
    except Exception:
        return None


def calculate_forward_estimates(
    ticker: str,
    financials: CompanyFinancials,
    essentials: CompanyEssentials,
    historical_pe_summary: Optional[HistoricalValuationSummary] = None,
) -> ForwardGrowthEstimates:
    """Compute 1Y, 2Y, and 3Y forward growth and earnings estimates across Base, Bull, and Bear cases."""
    years = financials.income_statement.years if financials.income_statement.years else ["FY22", "FY23", "FY24", "FY25", "FY26"]
    num_years = len(years)
    base_year_str = years[-1]
    
    # Try to parse the base fiscal year number (e.g. "FY26" -> 26)
    try:
        base_yr_int = int(base_year_str.upper().replace("FY", "").strip())
    except Exception:
        base_yr_int = 26

    # Extract historical Revenue & Net Profit series from P&L rows
    rev_vals: List[float] = []
    pat_vals: List[float] = []
    eps_vals: List[float] = []

    for r in financials.income_statement.rows:
        m_lower = r.metric_name.lower()
        if "revenue" in m_lower or "sales" in m_lower:
            rev_vals = [r.values.get(y) for y in years if r.values.get(y) is not None]  # type: ignore
        elif "net profit" in m_lower or "pat" in m_lower or "net income" in m_lower:
            pat_vals = [r.values.get(y) for y in years if r.values.get(y) is not None]  # type: ignore
        elif "eps" in m_lower:
            eps_vals = [r.values.get(y) for y in years if r.values.get(y) is not None]  # type: ignore

    # Fallback to essentials if financial row values are missing
    cmp = max(1.0, float(essentials.current_price))
    curr_pe = float(essentials.pe) if essentials.pe and essentials.pe > 0 else 22.0
    mcap_cr = float(essentials.market_cap_cr) if essentials.market_cap_cr and essentials.market_cap_cr > 0 else 5000.0

    base_rev = rev_vals[-1] if rev_vals and rev_vals[-1] and rev_vals[-1] > 0 else round(mcap_cr * 0.45, 1)
    base_pat = pat_vals[-1] if pat_vals and pat_vals[-1] and pat_vals[-1] > 0 else round(base_rev * 0.12, 1)
    
    if essentials.eps_ttm and essentials.eps_ttm > 0:
        base_eps = float(essentials.eps_ttm)
    elif eps_vals and eps_vals[-1] and eps_vals[-1] > 0:
        base_eps = float(eps_vals[-1])
    elif curr_pe > 0 and cmp > 0:
        base_eps = round(cmp / curr_pe, 2)
    else:
        base_eps = 25.0

    # Historical Revenue & PAT CAGRs
    cagr_3y_rev = safe_cagr(rev_vals[-4], rev_vals[-1], 3) if len(rev_vals) >= 4 else None
    cagr_5y_rev = safe_cagr(rev_vals[0], rev_vals[-1], num_years - 1) if len(rev_vals) >= 4 else None
    cagr_3y_pat = safe_cagr(pat_vals[-4], pat_vals[-1], 3) if len(pat_vals) >= 4 else None
    cagr_5y_pat = safe_cagr(pat_vals[0], pat_vals[-1], num_years - 1) if len(pat_vals) >= 4 else None

    # Calculate 5Y Average Net Profit Margin %
    npm_series = []
    if len(rev_vals) == len(pat_vals) and len(rev_vals) > 0:
        for r, p in zip(rev_vals, pat_vals):
            if r and p and r > 0:
                npm_series.append((p / r) * 100.0)
    avg_npm = sum(npm_series) / len(npm_series) if npm_series else ((base_pat / base_rev) * 100.0 if base_rev > 0 else 12.0)
    latest_npm = (base_pat / base_rev) * 100.0 if base_rev > 0 else 12.0

    # Sustainable Growth Rate (SGR = ROE * (1 - Payout Ratio))
    roe = float(essentials.roe) if essentials.roe and essentials.roe > 0 else 16.5
    div_yield = float(essentials.dividend_yield) if essentials.dividend_yield is not None else 1.2
    payout_ratio = min(0.70, max(0.05, (div_yield / max(1.0, roe)) * 2.5))
    sgr = round(roe * (1.0 - payout_ratio), 2)

    # Benchmark Exit P/E Multiple
    if historical_pe_summary and historical_pe_summary.median_pe and historical_pe_summary.median_pe > 0:
        median_pe = float(historical_pe_summary.median_pe)
    elif curr_pe > 0:
        median_pe = curr_pe
    else:
        median_pe = 22.5

    pe_plus_1sigma = float(historical_pe_summary.pe_plus_1sigma) if historical_pe_summary and historical_pe_summary.pe_plus_1sigma else round(median_pe * 1.25, 2)
    pe_minus_1sigma = float(historical_pe_summary.pe_minus_1sigma) if historical_pe_summary and historical_pe_summary.pe_minus_1sigma else round(median_pe * 0.78, 2)

    # Base Case Growth & Margin Assumptions
    hist_rev_growth = cagr_3y_rev or cagr_5y_rev or 14.0
    base_rev_growth = round(0.40 * hist_rev_growth + 0.35 * (cagr_5y_rev or hist_rev_growth) + 0.25 * sgr, 2)
    base_rev_growth = max(5.0, min(32.0, base_rev_growth))
    
    base_net_margin = round(0.65 * latest_npm + 0.35 * avg_npm, 2)
    base_net_margin = max(3.5, min(45.0, base_net_margin))
    base_exit_pe = median_pe

    # Helper function to generate projections for a scenario
    def generate_projections(
        rev_g_pct: float,
        npm_pct: float,
        exit_pe_mult: float,
    ) -> List[ForwardYearProjection]:
        projections: List[ForwardYearProjection] = []
        g_dec = rev_g_pct / 100.0
        m_dec = npm_pct / 100.0

        for h in [1, 2, 3]:
            yr_num = base_yr_int + h
            yr_lbl = f"FY{yr_num} ({h}Y Forward)"
            proj_rev = round(base_rev * ((1.0 + g_dec) ** h), 1)
            proj_pat = round(proj_rev * m_dec, 1)
            
            # EPS scales with PAT growth
            pat_growth_mult = proj_pat / max(1.0, base_pat)
            proj_eps = round(base_eps * pat_growth_mult, 2)
            
            # Target Price = Forward EPS * Exit P/E
            target_p = round(proj_eps * exit_pe_mult, 2)
            implied_ret = round(((target_p - cmp) / cmp) * 100.0, 2)
            
            # Annualized CAGR over h years
            if target_p > 0 and cmp > 0:
                implied_cagr = round((((target_p / cmp) ** (1.0 / h)) - 1.0) * 100.0, 2)
            else:
                implied_cagr = implied_ret / h

            projections.append(
                ForwardYearProjection(
                    horizon_years=h,
                    year_label=yr_lbl,
                    revenue_cr=proj_rev,
                    pat_cr=proj_pat,
                    eps=proj_eps,
                    net_margin_pct=npm_pct,
                    target_price=target_p,
                    implied_return_pct=implied_ret,
                    implied_cagr_pct=implied_cagr,
                )
            )
        return projections

    # 1. Base Case Scenario (Most Likely)
    base_projections = generate_projections(base_rev_growth, base_net_margin, base_exit_pe)
    base_scenario = ForwardScenario(
        scenario_name="Base Case (Most Likely)",
        scenario_description="Sustainable mean-reverting revenue growth with stable historical net margins and 5Y median valuation multiple.",
        assumed_revenue_growth_pct=base_rev_growth,
        assumed_net_margin_pct=base_net_margin,
        assumed_exit_pe=base_exit_pe,
        projections=base_projections,
    )

    # 2. Bull Case Scenario (Optimistic)
    bull_rev_growth = round(min(45.0, base_rev_growth * 1.25 + 3.0), 2)
    bull_net_margin = round(min(50.0, base_net_margin * 1.12), 2)
    bull_exit_pe = pe_plus_1sigma
    bull_projections = generate_projections(bull_rev_growth, bull_net_margin, bull_exit_pe)
    bull_scenario = ForwardScenario(
        scenario_name="Bull Case (High Growth & Re-rating)",
        scenario_description="Accelerated top-line expansion, operating leverage driving net margin expansion (+12%), and +1σ premium valuation multiple.",
        assumed_revenue_growth_pct=bull_rev_growth,
        assumed_net_margin_pct=bull_net_margin,
        assumed_exit_pe=bull_exit_pe,
        projections=bull_projections,
    )

    # 3. Bear Case Scenario (Conservative)
    bear_rev_growth = round(max(3.0, base_rev_growth * 0.60), 2)
    bear_net_margin = round(max(3.0, base_net_margin * 0.85), 2)
    bear_exit_pe = pe_minus_1sigma
    bear_projections = generate_projections(bear_rev_growth, bear_net_margin, bear_exit_pe)
    bear_scenario = ForwardScenario(
        scenario_name="Bear Case (Macro Slowdown & De-rating)",
        scenario_description="Top-line growth compression, raw material / wage margin headwinds (-15%), and -1σ discounted valuation multiple.",
        assumed_revenue_growth_pct=bear_rev_growth,
        assumed_net_margin_pct=bear_net_margin,
        assumed_exit_pe=bear_exit_pe,
        projections=bear_projections,
    )

    # Driver Attribution breakdown for Base Case 3Y Horizon
    p3 = base_projections[-1]
    eps_growth_total = ((p3.eps - base_eps) / max(0.1, base_eps)) * 100.0
    pe_change_total = ((base_exit_pe - curr_pe) / max(1.0, curr_pe)) * 100.0
    
    total_driver = abs(eps_growth_total) + abs(pe_change_total)
    if total_driver > 0:
        fund_weight = round((abs(eps_growth_total) / total_driver) * 100.0)
        pe_weight = 100 - fund_weight
    else:
        fund_weight = 75
        pe_weight = 25

    attribution_text = (
        f"{fund_weight}% of 3-Year expected return is driven by fundamental earnings growth (PAT compounding from ₹{base_pat:,.0f} Cr to ₹{p3.pat_cr:,.0f} Cr), "
        f"and {pe_weight}% from P/E valuation adjustment (from {curr_pe:.1f}x CMP to {base_exit_pe:.1f}x Historical Median)."
    )

    return ForwardGrowthEstimates(
        ticker=ticker.upper(),
        base_year_label=f"{base_year_str} (Latest Audited/TTM)",
        base_revenue_cr=base_rev,
        base_pat_cr=base_pat,
        base_eps=base_eps,
        base_cmp=cmp,
        historical_cagr_3y_rev=cagr_3y_rev,
        historical_cagr_5y_rev=cagr_5y_rev,
        historical_cagr_3y_pat=cagr_3y_pat,
        historical_cagr_5y_pat=cagr_5y_pat,
        sustainable_growth_rate=sgr,
        median_pe_benchmark=median_pe,
        base_case=base_scenario,
        bull_case=bull_scenario,
        bear_case=bear_scenario,
        driver_attribution=attribution_text,
    )
