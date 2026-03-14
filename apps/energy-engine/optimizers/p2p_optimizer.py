"""
P2P Trading Optimizer — CVXPY-based optimization engine.
Replaces the hand-written order-book matching in p2p-trading.service.ts with
a proper linear-program that minimizes total grid import cost across all nodes.

Academic reference: Optimal Power Flow / P2P energy trading formulations.
"""

import cvxpy as cp
import numpy as np
from dataclasses import dataclass


@dataclass
class TradingNode:
    node_id: str
    surplus_kw: float        # kW available to sell (0 if none)
    deficit_kw: float        # kW needed to buy (0 if none)
    min_price: float         # Seller: minimum acceptable price ($/kWh)
    max_price: float         # Buyer: maximum willingness to pay ($/kWh)


GRID_EXPORT_PRICE = 0.08   # $/kWh — what grid pays for exported energy
GRID_IMPORT_PRICE = 0.25   # $/kWh — what grid charges for imported energy


def optimize_p2p_trades(nodes: list[TradingNode]) -> dict:
    """
    Solves the P2P energy trading allocation problem as a Linear Program.

    Objective: Minimize total cost to the community (import from grid costs
    more than peer trading — so this maximises P2P matching).

    Decision variables:
        - trade[i][j]: kW traded from seller i to buyer j
        - grid_import[j]: kW node j imports from the grid
        - grid_export[i]: kW node i exports to the grid

    Constraints:
        - Supply balance: sum of trades from seller i + grid_export[i] = surplus[i]
        - Demand balance: sum of trades to buyer j + grid_import[j] = deficit[j]
        - Price must be acceptable (dual variable gives clearing price)
        - All variables ≥ 0
    """
    sellers = [n for n in nodes if n.surplus_kw > 0]
    buyers  = [n for n in nodes if n.deficit_kw  > 0]

    n_s = len(sellers)
    n_b = len(buyers)

    if n_s == 0 or n_b == 0:
        return _grid_only_result(buyers, sellers)

    # ---------- Decision Variables ----------
    trade = cp.Variable((n_s, n_b), nonneg=True, name="trade")
    grid_import = cp.Variable(n_b, nonneg=True, name="grid_import")
    grid_export = cp.Variable(n_s, nonneg=True, name="grid_export")

    # ---------- Objective ----------
    # Minimize grid import cost minus grid export revenue
    import_cost  = cp.sum(cp.multiply(GRID_IMPORT_PRICE * np.ones(n_b), grid_import))
    export_rev   = cp.sum(cp.multiply(GRID_EXPORT_PRICE * np.ones(n_s), grid_export))
    # Peer trade clearing price ≈ average of min_price and max_price pairs
    trade_cost = cp.Constant(0)  # Pure community cost view (grid only)
    objective = cp.Minimize(import_cost - export_rev)

    # ---------- Constraints ----------
    constraints = []

    # Supply: each seller's output is fully allocated
    for i, seller in enumerate(sellers):
        constraints.append(
            cp.sum(trade[i, :]) + grid_export[i] == seller.surplus_kw
        )

    # Demand: each buyer's need is fully met
    for j, buyer in enumerate(buyers):
        constraints.append(
            cp.sum(trade[:, j]) + grid_import[j] == buyer.deficit_kw
        )

    # Price feasibility: only allow trades where price overlap exists
    for i, seller in enumerate(sellers):
        for j, buyer in enumerate(buyers):
            if buyer.max_price < seller.min_price:
                # Price incompatibility — no trade between this pair
                constraints.append(trade[i, j] == 0)

    problem = cp.Problem(objective, constraints)

    try:
        problem.solve(solver=cp.GLPK, verbose=False)
    except Exception:
        # Fallback to ECOS if GLPK not installed
        problem.solve(verbose=False)

    if problem.status not in ["optimal", "optimal_inaccurate"]:
        return _grid_only_result(buyers, sellers)

    # ---------- Build Result ----------
    trade_results = []
    total_peer_kwh = 0.0

    for i, seller in enumerate(sellers):
        for j, buyer in enumerate(buyers):
            amt = float(trade.value[i, j])
            if amt > 0.001:
                clearing_price = (seller.min_price + buyer.max_price) / 2
                trade_results.append({
                    "seller_node_id": seller.node_id,
                    "buyer_node_id":  buyer.node_id,
                    "amount_kw":      round(amt, 4),
                    "price_per_kwh":  round(clearing_price, 4),
                    "total_cost":     round(amt * clearing_price, 4),
                    "type": "P2P",
                })
                total_peer_kwh += amt

    # Grid fallbacks
    for j, buyer in enumerate(buyers):
        amt = float(grid_import.value[j])
        if amt > 0.001:
            trade_results.append({
                "seller_node_id": "GRID",
                "buyer_node_id":  buyer.node_id,
                "amount_kw":      round(amt, 4),
                "price_per_kwh":  GRID_IMPORT_PRICE,
                "total_cost":     round(amt * GRID_IMPORT_PRICE, 4),
                "type": "GRID_IMPORT",
            })

    for i, seller in enumerate(sellers):
        amt = float(grid_export.value[i])
        if amt > 0.001:
            trade_results.append({
                "seller_node_id": seller.node_id,
                "buyer_node_id":  "GRID",
                "amount_kw":      round(amt, 4),
                "price_per_kwh":  GRID_EXPORT_PRICE,
                "total_cost":     round(amt * GRID_EXPORT_PRICE, 4),
                "type": "GRID_EXPORT",
            })

    total_demand = sum(b.deficit_kw for b in buyers)
    p2p_ratio = (total_peer_kwh / total_demand * 100) if total_demand > 0 else 0.0

    return {
        "status": "optimal",
        "trades": trade_results,
        "summary": {
            "total_peer_traded_kw": round(total_peer_kwh, 4),
            "p2p_ratio_pct": round(p2p_ratio, 2),
            "objective_value": round(float(problem.value), 6),
            "solver_status": problem.status,
        },
    }


def _grid_only_result(buyers: list[TradingNode], sellers: list[TradingNode]) -> dict:
    """Returns a result where everything falls back to the grid."""
    trades = []
    for buyer in buyers:
        if buyer.deficit_kw > 0:
            trades.append({
                "seller_node_id": "GRID",
                "buyer_node_id":  buyer.node_id,
                "amount_kw":      round(buyer.deficit_kw, 4),
                "price_per_kwh":  GRID_IMPORT_PRICE,
                "total_cost":     round(buyer.deficit_kw * GRID_IMPORT_PRICE, 4),
                "type": "GRID_IMPORT",
            })
    for seller in sellers:
        if seller.surplus_kw > 0:
            trades.append({
                "seller_node_id": seller.node_id,
                "buyer_node_id":  "GRID",
                "amount_kw":      round(seller.surplus_kw, 4),
                "price_per_kwh":  GRID_EXPORT_PRICE,
                "total_cost":     round(seller.surplus_kw * GRID_EXPORT_PRICE, 4),
                "type": "GRID_EXPORT",
            })
    return {
        "status": "grid_only",
        "trades": trades,
        "summary": {
            "total_peer_traded_kw": 0.0,
            "p2p_ratio_pct": 0.0,
            "objective_value": None,
            "solver_status": "no_p2p_possible",
        },
    }
