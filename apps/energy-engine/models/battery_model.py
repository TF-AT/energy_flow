"""
Battery model — physics-based simulation of a lithium-ion battery pack.
Uses SciPy for state estimation and charge/discharge scheduling.
"""

import numpy as np
from dataclasses import dataclass


@dataclass
class BatteryState:
    capacity_kwh: float          # Total energy capacity
    current_soc: float           # State-of-charge (0.0 to 1.0)
    max_charge_kw: float         # Max charge rate
    max_discharge_kw: float      # Max discharge rate
    round_trip_efficiency: float = 0.92  # Typical Li-ion efficiency


class BatteryModel:
    """
    Physics-based battery model simulating charge/discharge cycles
    with efficiency losses and SoC constraints.
    """

    def __init__(self, state: BatteryState):
        self.state = state

    @property
    def energy_stored_kwh(self) -> float:
        return self.state.capacity_kwh * self.state.current_soc

    @property
    def available_discharge_kw(self) -> float:
        """Max power that can be discharged right now."""
        return min(
            self.state.max_discharge_kw,
            self.energy_stored_kwh / (1 / 60),  # 1-minute floor
        )

    @property
    def available_charge_kw(self) -> float:
        """Max power that can be absorbed right now."""
        headroom_kwh = self.state.capacity_kwh * (1.0 - self.state.current_soc)
        return min(self.state.max_charge_kw, headroom_kwh / (1 / 60))

    def charge(self, power_kw: float, duration_hours: float) -> float:
        """
        Charges the battery.
        Returns actual energy accepted (kWh).
        """
        effective_power = min(power_kw, self.available_charge_kw)
        energy_in = effective_power * duration_hours * self.state.round_trip_efficiency
        max_storable = self.state.capacity_kwh * (1.0 - self.state.current_soc)
        actual_stored = min(energy_in, max_storable)
        self.state.current_soc += actual_stored / self.state.capacity_kwh
        self.state.current_soc = min(1.0, self.state.current_soc)
        return float(actual_stored)

    def discharge(self, power_kw: float, duration_hours: float) -> float:
        """
        Discharges the battery.
        Returns actual energy delivered (kWh).
        """
        effective_power = min(power_kw, self.available_discharge_kw)
        energy_out = effective_power * duration_hours
        max_available = self.energy_stored_kwh * self.state.round_trip_efficiency
        actual_delivered = min(energy_out, max_available)
        self.state.current_soc -= actual_delivered / (self.state.capacity_kwh * self.state.round_trip_efficiency)
        self.state.current_soc = max(0.0, self.state.current_soc)
        return float(actual_delivered)

    def simulate_schedule(
        self,
        net_load_kw: list[float],  # positive = deficit, negative = surplus
        duration_hours_per_step: float = 0.25,
    ) -> dict:
        """
        Simulates the battery behavior following a net-load schedule.
        Returns time-series of SoC, charge/discharge events.
        """
        soc_trace = []
        charge_trace = []
        discharge_trace = []

        for net in net_load_kw:
            if net > 0:
                # Deficit: try to discharge
                delivered = self.discharge(net, duration_hours_per_step)
                charge_trace.append(0.0)
                discharge_trace.append(round(delivered / duration_hours_per_step, 4))
            else:
                # Surplus: try to charge
                stored = self.charge(abs(net), duration_hours_per_step)
                charge_trace.append(round(stored / duration_hours_per_step, 4))
                discharge_trace.append(0.0)

            soc_trace.append(round(self.state.current_soc * 100, 2))

        return {
            "soc_pct_trace": soc_trace,
            "charge_kw_trace": charge_trace,
            "discharge_kw_trace": discharge_trace,
            "final_soc_pct": round(self.state.current_soc * 100, 2),
            "total_discharged_kwh": round(sum(discharge_trace) * duration_hours_per_step, 4),
            "total_charged_kwh": round(sum(charge_trace) * duration_hours_per_step, 4),
        }

    def to_dict(self) -> dict:
        return {
            "capacity_kwh": self.state.capacity_kwh,
            "current_soc_pct": round(self.state.current_soc * 100, 2),
            "energy_stored_kwh": round(self.energy_stored_kwh, 4),
            "available_discharge_kw": round(self.available_discharge_kw, 4),
            "available_charge_kw": round(self.available_charge_kw, 4),
        }
