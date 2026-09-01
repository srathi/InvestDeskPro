"""Unit tests for Inverse-Volatility Risk-Parity Optimizer."""

import numpy as np
import pytest
from app.core.portfolio import apply_weight_cap_constraint


def test_weights_sum_to_one_standard():
    # 10 assets with varying raw inverse-vol weights
    np.random.seed(42)
    raw_vols = np.array([0.12, 0.15, 0.18, 0.22, 0.25, 0.30, 0.35, 0.14, 0.16, 0.28])
    inv_vols = 1.0 / raw_vols
    raw_weights = inv_vols / np.sum(inv_vols)

    # Max weight constraint = 15% (0.15)
    max_w = 0.15
    capped_weights = apply_weight_cap_constraint(raw_weights, max_w)

    # 1. Weights must sum to 1.0 within 1e-6 tolerance
    assert pytest.approx(np.sum(capped_weights), abs=1e-6) == 1.0

    # 2. No weight should exceed max_w + tolerance
    assert np.all(capped_weights <= max_w + 1e-5)

    # 3. Lowest volatility asset (index 0, 12% vol) had highest raw weight and got capped or remains highest
    assert capped_weights[0] >= capped_weights[5]  # vs 30% vol asset


def test_weights_sum_to_one_small_basket():
    # 3 assets where max_w = 15% is infeasible since 3 * 0.15 = 0.45 < 1.0
    raw_vols = np.array([0.15, 0.20, 0.25])
    inv_vols = 1.0 / raw_vols
    raw_weights = inv_vols / np.sum(inv_vols)

    capped_weights = apply_weight_cap_constraint(raw_weights, 0.15)

    # Weights must still sum to 1.0
    assert pytest.approx(np.sum(capped_weights), abs=1e-6) == 1.0
    assert len(capped_weights) == 3
    assert np.all(capped_weights > 0.0)


def test_risk_contribution_sum():
    # Verify math of risk contributions
    cov_matrix = np.array([
        [0.04, 0.01, 0.015],
        [0.01, 0.0625, 0.02],
        [0.015, 0.02, 0.09]
    ])
    weights = np.array([0.45, 0.32, 0.23])
    weights = weights / np.sum(weights)

    port_var = float(weights.T @ cov_matrix @ weights)
    port_vol = np.sqrt(port_var)
    mrc = (cov_matrix @ weights) / port_vol
    prc = (weights * mrc) / port_vol * 100.0

    # Total percentage risk contribution should sum to 100%
    assert pytest.approx(np.sum(prc), abs=1e-4) == 100.0
