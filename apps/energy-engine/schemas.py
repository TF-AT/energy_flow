"""
Pydantic schemas for request and response validation in the energy engine API.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ──────────────────────────────────────────────────────────────────────────────
# Simulation Schemas
# ──────────────────────────────────────────────────────────────────────────────

class NodeTickRequest(BaseModel):
    node_id: str
    has_solar: bool = False
    base_load_kw: float = Field(..., gt=0, description="Baseline load in kW")
    solar_capacity_kw: float = Field(0.0, ge=0)
    current_virtual_hour: float = Field(..., ge=0, lt=24)


class NodeTickResponse(BaseModel):
    node_id: str
    hour: float
    load_kw: float
    solar_kw: float
    net_kw: float              # Positive = surplus, negative = deficit
    battery_soc_pct: Optional[float] = None


class DailyProfileRequest(BaseModel):
    node_id: str
    base_load_kw: float = Field(..., gt=0)
    solar_capacity_kw: float = Field(0.0, ge=0)
    resolution_minutes: int = Field(15, ge=5, le=60)


class GridSimulationRequest(BaseModel):
    microgrid_id: str
    nodes: list[NodeTickRequest]


class GridSimulationResponse(BaseModel):
    microgrid_id: str
    timestamp: str
    nodes: list[NodeTickResponse]
    grid_net_kw: float          # Community-level surplus / deficit


# ──────────────────────────────────────────────────────────────────────────────
# Optimization Schemas
# ──────────────────────────────────────────────────────────────────────────────

class TradingNodeInput(BaseModel):
    node_id: str
    surplus_kw: float = 0.0
    deficit_kw: float = 0.0
    min_price: float = Field(0.10, description="Seller min price $/kWh")
    max_price: float = Field(0.20, description="Buyer max price $/kWh")


class P2POptimizationRequest(BaseModel):
    microgrid_id: str
    nodes: list[TradingNodeInput]


class TradeResult(BaseModel):
    seller_node_id: str
    buyer_node_id: str
    amount_kw: float
    price_per_kwh: float
    total_cost: float
    type: str   # "P2P" | "GRID_IMPORT" | "GRID_EXPORT"


class OptimizationSummary(BaseModel):
    total_peer_traded_kw: float
    p2p_ratio_pct: float
    objective_value: Optional[float]
    solver_status: str


class P2POptimizationResponse(BaseModel):
    microgrid_id: str
    status: str
    trades: list[TradeResult]
    summary: OptimizationSummary


# ──────────────────────────────────────────────────────────────────────────────
# Battery Schemas
# ──────────────────────────────────────────────────────────────────────────────

class BatteryScheduleRequest(BaseModel):
    node_id: str
    capacity_kwh: float = Field(..., gt=0)
    initial_soc_pct: float = Field(..., ge=0, le=100)
    max_charge_kw: float = Field(..., gt=0)
    max_discharge_kw: float = Field(..., gt=0)
    net_load_kw: list[float]   # Positive = deficit, negative = surplus; one value per time step
    resolution_minutes: int = Field(15, ge=5, le=60)
