"""Inverse-Volatility Risk-Parity Portfolio Optimizer.

Optimizes asset allocation using inverse realized volatility weighting with
strict individual allocation cap constraints (e.g., max 15%) and marginal risk contribution metrics.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf

from app.core.factors import normalize_ticker
from app.schemas import (
    PortfolioAssetAllocation,
    PortfolioOptimizeResponse,
)


def fetch_historical_returns(tickers: List[str], period: str = "1y") -> Tuple[pd.DataFrame, pd.Series]:
    """Fetch daily close prices for tickers and compute daily percentage returns and 1Y total return."""
    norm_tickers = [normalize_ticker(t) for t in tickers]
    norm_tickers = list(dict.fromkeys(norm_tickers))  # deduplicate preserving order

    if len(norm_tickers) < 2:
        raise ValueError("Portfolio optimization requires at least 2 distinct tickers.")

    # Download batch history
    data = yf.download(norm_tickers, period=period, group_by="ticker", auto_adjust=True, progress=False)

    closes_dict = {}
    total_returns_dict = {}

    for t in norm_tickers:
        series = None
        if isinstance(data.columns, pd.MultiIndex):
            if t in data.columns.levels[0]:
                series = data[t]["Close"].dropna()
        else:
            if "Close" in data.columns:
                series = data["Close"].dropna()

        # If batch didn't return ticker data, try single ticker fetch
        if series is None or len(series) < 20:
            try:
                single_t = yf.Ticker(t)
                hist = single_t.history(period=period)
                if not hist.empty and "Close" in hist.columns:
                    series = hist["Close"].dropna()
            except Exception:
                pass

        if series is not None and len(series) >= 20:
            dt_idx = pd.to_datetime(series.index)
            if hasattr(dt_idx, "tz") and dt_idx.tz is not None:
                dt_idx = dt_idx.tz_convert(None)
            series.index = dt_idx.normalize()
            closes_dict[t] = series
            ret_1y = float((series.iloc[-1] / series.iloc[0]) - 1.0) * 100.0
            total_returns_dict[t] = ret_1y

    if len(closes_dict) < 2:
        raise ValueError(f"Could not retrieve sufficient historical price data for provided tickers. Found: {list(closes_dict.keys())}")

    df_closes = pd.DataFrame(closes_dict).dropna()
    if len(df_closes) < 30:
        # Fallback to forward/backward fill to retain rows
        df_closes = pd.DataFrame(closes_dict).ffill().bfill().dropna()

    if len(df_closes) < 20:
        raise ValueError("Insufficient overlapping trading dates for the selected portfolio assets.")

    df_returns = df_closes.pct_change().dropna()
    series_returns_1y = pd.Series(total_returns_dict)

    return df_returns, series_returns_1y


def apply_weight_cap_constraint(raw_weights: np.ndarray, max_weight: float) -> np.ndarray:
    """Iteratively apply max_weight cap and redistribute residual weight proportionally."""
    n = len(raw_weights)
    if n == 0:
        return raw_weights

    # Feasible cap check: If N assets, min feasible cap is 1/N. We relax cap if too restrictive
    min_feasible = 1.0 / n
    effective_cap = max(max_weight, min_feasible + 1e-4)

    weights = raw_weights.copy()
    weights = weights / np.sum(weights)

    # Iterative clipping & redistribution
    for _ in range(50):
        excess = weights - effective_cap
        capped_mask = excess > 1e-7
        if not np.any(capped_mask):
            break
        
        # Lock capped weights
        weights[capped_mask] = effective_cap
        uncapped_mask = ~capped_mask
        
        if not np.any(uncapped_mask):
            weights = np.full(n, 1.0 / n)
            break
            
        remaining_sum = 1.0 - np.sum(weights[capped_mask])
        current_uncapped_sum = np.sum(weights[uncapped_mask])
        
        if current_uncapped_sum > 1e-8:
            weights[uncapped_mask] = weights[uncapped_mask] * (remaining_sum / current_uncapped_sum)
        else:
            weights[uncapped_mask] = remaining_sum / np.sum(uncapped_mask)

    # Final normalization
    weights = weights / np.sum(weights)
    return weights


def optimize_risk_parity_portfolio(
    tickers: List[str],
    max_weight_pct: float = 15.0,
) -> PortfolioOptimizeResponse:
    """Compute Inverse-Volatility Risk-Parity Asset Allocations and Risk Contributions."""
    df_returns, series_1y_ret = fetch_historical_returns(tickers)
    valid_tickers = df_returns.columns.tolist()
    n_assets = len(valid_tickers)

    # Compute Sample Covariance Matrix (Annualized)
    cov_matrix_daily = df_returns.cov().values
    cov_matrix_ann = cov_matrix_daily * 252.0

    # Realized Annualized Asset Volatilities
    variances = np.diag(cov_matrix_ann)
    asset_vols = np.sqrt(np.maximum(variances, 1e-8))

    # Raw Inverse Volatility Weights: w_i ~ 1 / sigma_i
    inv_vols = 1.0 / asset_vols
    raw_weights = inv_vols / np.sum(inv_vols)

    # Apply Allocation Cap Constraint
    max_weight_decimal = max_weight_pct / 100.0
    final_weights = apply_weight_cap_constraint(raw_weights, max_weight_decimal)

    # Portfolio Total Realized Volatility: sigma_p = sqrt(w^T * Sigma * w)
    port_variance = float(final_weights.T @ cov_matrix_ann @ final_weights)
    port_vol = float(np.sqrt(max(port_variance, 1e-8)))

    # Marginal Risk Contributions: MRC_i = (Sigma * w)_i / sigma_p
    mrc = (cov_matrix_ann @ final_weights) / port_vol
    # Percentage Risk Contribution: PRC_i = (w_i * MRC_i) / sigma_p * 100%
    prc = (final_weights * mrc) / port_vol * 100.0

    # Baseline Equal Weight Volatility
    ew_weights = np.full(n_assets, 1.0 / n_assets)
    ew_variance = float(ew_weights.T @ cov_matrix_ann @ ew_weights)
    ew_vol = float(np.sqrt(max(ew_variance, 1e-8)))
    vol_reduction = max(0.0, float((ew_vol - port_vol) / ew_vol * 100.0)) if ew_vol > 1e-4 else 0.0

    # Expected Return (Weighted historical 1Y returns)
    hist_returns_vec = np.array([series_1y_ret.get(t, 12.0) for t in valid_tickers])
    port_expected_return = float(np.sum(final_weights * hist_returns_vec))

    # Sharpe Ratio (6.5% Indian Risk-Free Rate)
    rf_rate = 6.5
    sharpe = round((port_expected_return - rf_rate) / (port_vol * 100.0), 2) if port_vol > 1e-4 else 0.0

    # Effective Number of Assets (1 / sum(w^2))
    enb = round(1.0 / float(np.sum(final_weights ** 2)), 2)

    # Build Asset Allocations
    allocations: List[PortfolioAssetAllocation] = []
    for i, t in enumerate(valid_tickers):
        allocations.append(
            PortfolioAssetAllocation(
                ticker=t,
                name=t.replace(".NS", "").replace(".BO", ""),
                weight_pct=round(float(final_weights[i] * 100.0), 2),
                raw_weight_pct=round(float(raw_weights[i] * 100.0), 2),
                realized_volatility=round(float(asset_vols[i] * 100.0), 2),
                risk_contribution_pct=round(float(prc[i]), 2),
                expected_return_1y=round(float(hist_returns_vec[i]), 2),
            )
        )

    # Build Covariance Matrix Dict for JSON response
    cov_dict: Dict[str, Dict[str, float]] = {}
    for i, t_row in enumerate(valid_tickers):
        cov_dict[t_row] = {}
        for j, t_col in enumerate(valid_tickers):
            cov_dict[t_row][t_col] = round(float(cov_matrix_ann[i, j]), 4)

    return PortfolioOptimizeResponse(
        tickers=valid_tickers,
        allocations=allocations,
        total_portfolio_volatility=round(port_vol * 100.0, 2),
        equal_weight_volatility=round(ew_vol * 100.0, 2),
        volatility_reduction_pct=round(vol_reduction, 2),
        portfolio_expected_return=round(port_expected_return, 2),
        portfolio_sharpe_ratio=sharpe,
        max_weight_constraint=round(max_weight_pct, 1),
        covariance_matrix=cov_dict,
        effective_number_of_assets=enb,
    )
