"""
Simulation router — Exposes endpoints to run node ticks and generate daily profiles.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from models.energy_profile import EnergyProfile
from schemas import (
    NodeTickRequest,
    NodeTickResponse,
    DailyProfileRequest,
    GridSimulationRequest,
    GridSimulationResponse,
)

router = APIRouter()


@router.post("/tick", response_model=GridSimulationResponse)
def simulate_grid_tick(request: GridSimulationRequest):
    """
    Run a single simulation tick for all nodes in a microgrid.
    Returns current load, solar generation, and net power for each node.
    """
    node_results = []
    grid_net = 0.0

    for node in request.nodes:
        load_kw = EnergyProfile.generate_load(
            node.current_virtual_hour, node.base_load_kw
        )
        solar_kw = (
            EnergyProfile.generate_solar(
                node.current_virtual_hour, node.solar_capacity_kw
            )
            if node.has_solar
            else 0.0
        )
        net_kw = round(solar_kw - load_kw, 4)
        grid_net += net_kw

        node_results.append(
            NodeTickResponse(
                node_id=node.node_id,
                hour=round(node.current_virtual_hour, 2),
                load_kw=round(load_kw, 4),
                solar_kw=round(solar_kw, 4),
                net_kw=net_kw,
            )
        )

    return GridSimulationResponse(
        microgrid_id=request.microgrid_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        nodes=node_results,
        grid_net_kw=round(grid_net, 4),
    )


@router.post("/daily-profile")
def generate_daily_profile(request: DailyProfileRequest):
    """
    Generate a full 24-hour energy profile for a node.
    Shows load curves, solar generation, net power, and efficiency metrics.
    """
    profile = EnergyProfile.generate_daily_profile(
        base_load_kw=request.base_load_kw,
        solar_capacity_kw=request.solar_capacity_kw,
        resolution_minutes=request.resolution_minutes,
    )

    return {
        "node_id": request.node_id,
        "resolution_minutes": request.resolution_minutes,
        **profile,
    }
