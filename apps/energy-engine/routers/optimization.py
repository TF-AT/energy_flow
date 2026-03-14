"""
Optimization router — Exposes P2P trading optimization and battery scheduling.
"""

from fastapi import APIRouter, HTTPException

from optimizers.p2p_optimizer import optimize_p2p_trades, TradingNode
from models.battery_model import BatteryModel, BatteryState
from schemas import (
    P2POptimizationRequest,
    P2POptimizationResponse,
    BatteryScheduleRequest,
)

router = APIRouter()


@router.post("/p2p-trade", response_model=P2POptimizationResponse)
def optimize_trading(request: P2POptimizationRequest):
    """
    Solve the P2P energy trading allocation using a CVXPY Linear Program.
    Minimizes total grid import cost across all nodes in the microgrid.
    Returns optimal trade pairs and grid fallback assignments.
    """
    trading_nodes = [
        TradingNode(
            node_id=n.node_id,
            surplus_kw=n.surplus_kw,
            deficit_kw=n.deficit_kw,
            min_price=n.min_price,
            max_price=n.max_price,
        )
        for n in request.nodes
    ]

    result = optimize_p2p_trades(trading_nodes)

    return P2POptimizationResponse(
        microgrid_id=request.microgrid_id,
        status=result["status"],
        trades=result["trades"],
        summary=result["summary"],
    )


@router.post("/battery-schedule")
def schedule_battery(request: BatteryScheduleRequest):
    """
    Simulate battery charge/discharge behavior over a given load schedule.
    Uses a physics-based model with efficiency losses and SoC constraints.
    """
    state = BatteryState(
        capacity_kwh=request.capacity_kwh,
        current_soc=request.initial_soc_pct / 100.0,
        max_charge_kw=request.max_charge_kw,
        max_discharge_kw=request.max_discharge_kw,
    )

    battery = BatteryModel(state)
    duration_hours = request.resolution_minutes / 60.0
    schedule_result = battery.simulate_schedule(
        net_load_kw=request.net_load_kw,
        duration_hours_per_step=duration_hours,
    )

    return {
        "node_id": request.node_id,
        "initial_state": {
            "capacity_kwh": request.capacity_kwh,
            "initial_soc_pct": request.initial_soc_pct,
        },
        "schedule": schedule_result,
    }
