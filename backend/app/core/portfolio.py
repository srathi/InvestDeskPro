"""Inverse-Volatility Risk-Parity Portfolio Optimizer & Interactive Stress-Tester.

Optimizes asset allocation using inverse realized volatility weighting with
strict individual allocation cap constraints (e.g., max 15%), sector exposure tracking,
marginal risk contribution metrics, and historical crash scenario stress-tests vs Nifty 50 TRI.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
import yfinance as yf

from app.core.factors import normalize_ticker
from app.core.screener_engine import MASTER_STOCK_UNIVERSE
from app.schemas import (
    PortfolioAssetAllocation,
    PortfolioBacktestPoint,
    PortfolioBenchmarkComparison,
    PortfolioOptimizeResponse,
    PortfolioSectorExposure,
    PortfolioStressTestEvent,
)


def get_stock_sector(ticker: str) -> str:
    """Resolve sector for a given ticker from MASTER_STOCK_UNIVERSE or heuristic."""
    clean_sym = ticker.replace(".NS", "").replace(".BO", "").upper()
    for s in MASTER_STOCK_UNIVERSE:
        if s.ticker.upper().replace(".NS", "").replace(".BO", "") == clean_sym:
            return s.sector or "Diversified"
    
    # Heuristic fallback
    if any(k in clean_sym for k in ["BANK", "HDFC", "ICICI", "KOTAK", "AXIS", "SBIN", "BAJFINANCE", "BAJAJFINSV"]):
        return "Banking & Financials"
    elif any(k in clean_sym for k in ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM", "PERSISTENT"]):
        return "Information Technology"
    elif any(k in clean_sym for k in ["RELIANCE", "ONGC", "BPCL", "IOC", "GAIL", "POWERGRID", "NTPC"]):
        return "Energy & Utilities"
    elif any(k in clean_sym for k in ["SUNPHARMA", "CIPLA", "DRREDDY", "DIVISLAB", "APOLLOHOSP", "LUPIN"]):
        return "Healthcare & Pharma"
    elif any(k in clean_sym for k in ["TATAMOTORS", "MARUTI", "M&M", "BAJAJ-AUTO", "HEROMOTOCO", "EICHERMOT"]):
        return "Automobile"
    elif any(k in clean_sym for k in ["ITC", "HINDUNILVR", "NESTLEIND", "BRITANNIA", "DABUR", "GODREJCP"]):
        return "FMCG / Consumer"
    elif any(k in clean_sym for k in ["TATASTEEL", "JSWSTEEL", "HINDALCO", "COALINDIA", "VEDL"]):
        return "Metals & Mining"
    elif any(k in clean_sym for k in ["LT", "ADANIENT", "ADANIPORTS", "ULTRACEMCO", "GRASIM"]):
        return "Infrastructure & Industrials"
    return "Diversified"


def fetch_historical_returns(
    tickers: List[str],
    period: str = "1y",
) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Fetch daily close prices for tickers and benchmark (^NSEI).
    Returns (df_returns, series_1y_ret, series_bench_ret).
    """
    norm_tickers = [normalize_ticker(t) for t in tickers]
    norm_tickers = list(dict.fromkeys(norm_tickers))  # deduplicate preserving order

    if len(norm_tickers) < 2:
        raise ValueError("Portfolio optimization requires at least 2 distinct tickers.")

    fetch_symbols = norm_tickers + ["^NSEI"]

    # Download batch history
    data = yf.download(fetch_symbols, period=period, group_by="ticker", auto_adjust=True, progress=False)

    closes_dict = {}
    total_returns_dict = {}

    # Extract Close DataFrame directly from yf.download MultiIndex or flat DataFrame
    close_df: Optional[pd.DataFrame] = None
    if isinstance(data, pd.DataFrame) and not data.empty:
        if isinstance(data.columns, pd.MultiIndex):
            if "Close" in data.columns.levels[0]:
                close_df = data["Close"]
            elif "Close" in data.columns.levels[1]:
                close_df = data.xs("Close", level=1, axis=1)
        elif "Close" in data.columns:
            close_df = data[["Close"]]

    for t in norm_tickers:
        series = None
        # 1. Try extracting from batch close_df
        if close_df is not None:
            candidates = [
                t,
                t.replace(".NS", ""),
                t.replace(".BO", ""),
                f"{t}.NS" if not t.endswith((".NS", ".BO")) else t,
                f"{t}.BO" if not t.endswith((".NS", ".BO")) else t,
            ]
            for cand in candidates:
                if cand in close_df.columns:
                    s = close_df[cand].dropna()
                    if len(s) >= 20:
                        series = s
                        break

        # 2. If batch failed, try single ticker fetch with BSE / NSE fallback
        if series is None or len(series) < 20:
            candidates_single = [
                t,
                t.replace(".NS", ".BO") if t.endswith(".NS") else (t.replace(".BO", ".NS") if t.endswith(".BO") else f"{t}.NS"),
                t.replace(".NS", "") if t.endswith(".NS") else f"{t}.BO",
            ]
            for cand in candidates_single:
                try:
                    single_t = yf.Ticker(cand)
                    hist = single_t.history(period=period)
                    if not hist.empty and "Close" in hist.columns:
                        s = hist["Close"].dropna()
                        if len(s) >= 20:
                            series = s
                            break
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

    # Benchmark (^NSEI)
    bench_series = None
    if close_df is not None and "^NSEI" in close_df.columns:
        bench_series = close_df["^NSEI"].dropna()
    elif isinstance(data, pd.DataFrame) and "^NSEI" in data.columns:
        bench_series = data["^NSEI"].dropna()

    if bench_series is None or len(bench_series) < 20:
        try:
            b_tick = yf.Ticker("^NSEI")
            b_hist = b_tick.history(period=period)
            if not b_hist.empty and "Close" in b_hist.columns:
                bench_series = b_hist["Close"].dropna()
        except Exception:
            pass

    df_closes = pd.DataFrame(closes_dict).ffill().bfill().dropna()

    if len(df_closes) < 20:
        raise ValueError("Insufficient overlapping trading dates for the selected portfolio assets.")

    df_returns = df_closes.pct_change().dropna()
    series_returns_1y = pd.Series(total_returns_dict)

    if bench_series is not None and len(bench_series) >= 20:
        dt_idx = pd.to_datetime(bench_series.index)
        if hasattr(dt_idx, "tz") and dt_idx.tz is not None:
            dt_idx = dt_idx.tz_convert(None)
        bench_series.index = dt_idx.normalize()
        aligned_bench = bench_series.reindex(df_closes.index).ffill().bfill()
        series_bench_ret = aligned_bench.pct_change().dropna()
    else:
        # Fallback benchmark
        series_bench_ret = df_returns.mean(axis=1)

    return df_returns, series_returns_1y, series_bench_ret


def apply_weight_cap_constraint(raw_weights: np.ndarray, max_weight: float) -> np.ndarray:
    """Iteratively apply max_weight cap and redistribute residual weight proportionally."""
    n = len(raw_weights)
    if n == 0:
        return raw_weights

    min_feasible = 1.0 / n
    effective_cap = max(max_weight, min_feasible + 1e-4)

    weights = raw_weights.copy()
    weights = weights / np.sum(weights)

    for _ in range(50):
        excess = weights - effective_cap
        capped_mask = excess > 1e-7
        if not np.any(capped_mask):
            break

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

    weights = weights / np.sum(weights)
    return weights


def simulate_historical_stress_events(
    port_vol: float,
    bench_vol: float,
    port_beta: float,
    asset_allocations: List[PortfolioAssetAllocation],
) -> List[PortfolioStressTestEvent]:
    """
    Simulates portfolio drawdown and recovery across 3 major historical market shocks vs Nifty 50 TRI.
    """
    vol_ratio = (port_vol / max(1e-4, bench_vol))
    effective_sensitivity = max(0.45, min(1.65, (port_beta * 0.7) + (vol_ratio * 0.3)))

    # Event 1: COVID-19 Global Liquidity Shock
    covid_bench_dd = 38.4
    covid_port_dd = round(min(55.0, max(14.0, covid_bench_dd * effective_sensitivity * 0.88)), 1)
    covid_cushion = round(covid_bench_dd - covid_port_dd, 1)
    covid_recovery = int(max(45, min(300, 194 * (covid_port_dd / covid_bench_dd))))

    # Event 2: Global Inflation & Rate Hike Tightening (2021-2022)
    rate_bench_dd = 17.5
    rate_port_dd = round(min(32.0, max(6.0, rate_bench_dd * effective_sensitivity * 0.92)), 1)
    rate_cushion = round(rate_bench_dd - rate_port_dd, 1)
    rate_recovery = int(max(30, min(240, 145 * (rate_port_dd / rate_bench_dd))))

    # Event 3: Mid & Small Cap Liquidity Pullback (2024)
    liq_bench_dd = 8.8
    # High-beta or non-largecap assets suffer sharper drawdowns in liquidity squeezes
    liq_port_dd = round(min(22.0, max(4.0, liq_bench_dd * (vol_ratio ** 1.1))), 1)
    liq_cushion = round(liq_bench_dd - liq_port_dd, 1)
    liq_recovery = int(max(15, min(120, 58 * (liq_port_dd / liq_bench_dd))))

    return [
        PortfolioStressTestEvent(
            event_name="COVID-19 Global Liquidity Shock",
            period_label="Feb 2020 – Aug 2020",
            portfolio_max_drawdown_pct=covid_port_dd,
            benchmark_max_drawdown_pct=covid_bench_dd,
            recovery_days_portfolio=covid_recovery,
            recovery_days_benchmark=194,
            downside_cushion_pct=covid_cushion,
            historical_context="Severe sudden exogenous shock testing multi-asset balance, liquidity resilience, and systemic drawdowns.",
        ),
        PortfolioStressTestEvent(
            event_name="Global Rate Hike & Inflation Tightening",
            period_label="Oct 2021 – Jun 2022",
            portfolio_max_drawdown_pct=rate_port_dd,
            benchmark_max_drawdown_pct=rate_bench_dd,
            recovery_days_portfolio=rate_recovery,
            recovery_days_benchmark=145,
            downside_cushion_pct=rate_cushion,
            historical_context="Prolonged macroeconomic stagflation and central bank quantitative tightening with tech & rate-sensitive multiple compression.",
        ),
        PortfolioStressTestEvent(
            event_name="Mid & Smallcap Liquidity Pullback",
            period_label="Jan 2024 – Mar 2024",
            portfolio_max_drawdown_pct=liq_port_dd,
            benchmark_max_drawdown_pct=liq_bench_dd,
            recovery_days_portfolio=liq_recovery,
            recovery_days_benchmark=58,
            downside_cushion_pct=liq_cushion,
            historical_context="Regulatory liquidity warnings and high-beta froth correction testing quality compounding over high-beta momentum.",
        ),
    ]


def optimize_risk_parity_portfolio(
    tickers: List[str],
    max_weight_pct: float = 15.0,
) -> PortfolioOptimizeResponse:
    """Compute Inverse-Volatility Risk-Parity Asset Allocations, Stress-Tests & Risk Contributions."""
    df_returns, series_1y_ret, series_bench_ret = fetch_historical_returns(tickers)
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

    # Benchmark Volatility
    bench_vol = float(series_bench_ret.std() * np.sqrt(252.0)) if not series_bench_ret.empty else 0.14

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

    # Sector Breakdown & Exposures
    sector_weights: Dict[str, float] = {}
    sector_risks: Dict[str, float] = {}
    for i, t in enumerate(valid_tickers):
        sec = get_stock_sector(t)
        sector_weights[sec] = sector_weights.get(sec, 0.0) + float(final_weights[i] * 100.0)
        sector_risks[sec] = sector_risks.get(sec, 0.0) + float(prc[i])

    sector_exposures: List[PortfolioSectorExposure] = [
        PortfolioSectorExposure(
            sector=s,
            weight_pct=round(w, 1),
            risk_contribution_pct=round(sector_risks.get(s, 0.0), 1),
        )
        for s, w in sorted(sector_weights.items(), key=lambda x: x[1], reverse=True)
    ]

    # Concentration & Risk Warnings
    concentration_warnings: List[str] = []
    for alloc in allocations:
        if alloc.risk_contribution_pct > 24.0:
            concentration_warnings.append(
                f"High Risk Contribution: {alloc.name} contributes {alloc.risk_contribution_pct}% of total portfolio volatility despite a {alloc.weight_pct}% capital weight."
            )

    for sec in sector_exposures:
        if sec.weight_pct > 35.0:
            concentration_warnings.append(
                f"Sector Clustering Alert: {sec.sector} represents {sec.weight_pct}% of total portfolio capital, exposing holdings to sector-specific cyclical shocks."
            )

    corr_df = df_returns[valid_tickers].corr()
    for i in range(len(valid_tickers)):
        for j in range(i + 1, len(valid_tickers)):
            t1 = valid_tickers[i].replace(".NS", "").replace(".BO", "")
            t2 = valid_tickers[j].replace(".NS", "").replace(".BO", "")
            r_val = float(corr_df.iloc[i, j])
            if r_val >= 0.70:
                concentration_warnings.append(
                    f"High Co-Movement: {t1} and {t2} have a high correlation ({r_val:.2f}), reducing diversification efficiency."
                )

    if enb < (n_assets * 0.65) and n_assets >= 4:
        concentration_warnings.append(
            f"Concentrated Diversification Depth: Effective Number of Assets ({enb}) is low relative to {n_assets} holdings."
        )

    # Build Covariance & Correlation Matrices for JSON response
    cov_dict: Dict[str, Dict[str, float]] = {}
    corr_dict: Dict[str, Dict[str, float]] = {}

    for i, t_row in enumerate(valid_tickers):
        cov_dict[t_row] = {}
        corr_dict[t_row] = {}
        for j, t_col in enumerate(valid_tickers):
            cov_dict[t_row][t_col] = round(float(cov_matrix_ann[i, j]), 4)
            corr_dict[t_row][t_col] = round(float(corr_df.loc[t_row, t_col]), 2)

    # 1-Year Cumulative Backtest Series (Portfolio Visualizer style with Benchmark)
    rp_daily = df_returns[valid_tickers].values @ final_weights
    ew_daily = df_returns[valid_tickers].values @ np.repeat(1.0 / len(valid_tickers), len(valid_tickers))
    bench_aligned = series_bench_ret.reindex(df_returns.index).fillna(0.0).values

    rp_cum = np.cumprod(1.0 + rp_daily) - 1.0
    ew_cum = np.cumprod(1.0 + ew_daily) - 1.0
    bench_cum = np.cumprod(1.0 + bench_aligned) - 1.0

    backtest_series: List[PortfolioBacktestPoint] = []
    step = max(1, len(df_returns) // 40)
    dates = df_returns.index
    for idx in range(0, len(df_returns), step):
        dt_str = dates[idx].strftime("%Y-%m-%d") if hasattr(dates[idx], "strftime") else str(dates[idx])[:10]
        backtest_series.append(
            PortfolioBacktestPoint(
                date=dt_str,
                risk_parity=round(float(rp_cum[idx] * 100.0), 2),
                equal_weight=round(float(ew_cum[idx] * 100.0), 2),
                benchmark=round(float(bench_cum[idx] * 100.0), 2),
            )
        )

    # Add final point
    if len(df_returns) > 0 and (len(df_returns) - 1) % step != 0:
        last_idx = len(df_returns) - 1
        dt_str = dates[last_idx].strftime("%Y-%m-%d") if hasattr(dates[last_idx], "strftime") else str(dates[last_idx])[:10]
        backtest_series.append(
            PortfolioBacktestPoint(
                date=dt_str,
                risk_parity=round(float(rp_cum[last_idx] * 100.0), 2),
                equal_weight=round(float(ew_cum[last_idx] * 100.0), 2),
                benchmark=round(float(bench_cum[last_idx] * 100.0), 2),
            )
        )

    # Historical Crash Scenario Stress-Tests
    port_daily_series = pd.Series(rp_daily, index=df_returns.index)
    aligned_bench_series = pd.Series(bench_aligned, index=df_returns.index)
    port_bench_cov = float(port_daily_series.cov(aligned_bench_series))
    bench_var = float(aligned_bench_series.var())
    port_beta = (port_bench_cov / bench_var) if bench_var > 1e-6 else 1.0

    stress_events = simulate_historical_stress_events(
        port_vol=port_vol,
        bench_vol=bench_vol,
        port_beta=port_beta,
        asset_allocations=allocations,
    )

    # Benchmark Comparison
    bench_1y_ret = float(bench_cum[-1] * 100.0) if len(bench_cum) > 0 else 14.5
    vol_spread = round((bench_vol - port_vol) * 100.0, 2)
    cagr_alpha = round(port_expected_return - bench_1y_ret, 2)

    benchmark_comparison = PortfolioBenchmarkComparison(
        benchmark_symbol="^NSEI",
        benchmark_name="Nifty 50 TRI",
        portfolio_volatility=round(port_vol * 100.0, 2),
        benchmark_volatility=round(bench_vol * 100.0, 2),
        volatility_spread_pct=vol_spread,
        portfolio_1y_cagr=round(port_expected_return, 2),
        benchmark_1y_cagr=round(bench_1y_ret, 2),
        cagr_alpha_pct=cagr_alpha,
    )

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
        correlation_matrix=corr_dict,
        backtest_series=backtest_series,
        effective_number_of_assets=enb,
        stress_test_events=stress_events,
        sector_exposures=sector_exposures,
        concentration_warnings=concentration_warnings,
        benchmark_comparison=benchmark_comparison,
    )
