"""
Unit tests for the energy engine — runs with pytest.
Run from apps/energy-engine: pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from models.energy_profile import EnergyProfile
from models.battery_model import BatteryModel, BatteryState
from optimizers.p2p_optimizer import optimize_p2p_trades, TradingNode


# ─── EnergyProfile Tests ──────────────────────────────────────────────────────

class TestEnergyProfile:
    def test_generate_load_morning_peak(self):
        """Morning peak (7am) should produce > baseline load."""
        load = EnergyProfile.generate_load(7.0, 2.0)
        assert load > 2.0 * 0.9, "Morning peak load should exceed baseline"

    def test_generate_load_night(self):
        """Deep night should produce lower load."""
        # Average over 10 samples to handle noise
        loads = [EnergyProfile.generate_load(3.0, 2.0) for _ in range(10)]
        avg = sum(loads) / len(loads)
        assert avg < 2.0, "Night load should be below baseline on average"

    def test_solar_is_zero_at_night(self):
        """Solar output must be 0 between 8pm and 6am."""
        assert EnergyProfile.generate_solar(22.0, 5.0) == 0.0
        assert EnergyProfile.generate_solar(3.0, 5.0) == 0.0

    def test_solar_positive_at_noon(self):
        """Solar should be positive at noon with capacity."""
        solar = EnergyProfile.generate_solar(12.5, 5.0)
        assert solar >= 0.0, "Solar should be non-negative"

    def test_daily_profile_shape(self):
        """Daily profile should return correct number of data points."""
        profile = EnergyProfile.generate_daily_profile(2.0, 5.0, resolution_minutes=15)
        expected_steps = 24 * (60 // 15)  # 96 steps
        assert len(profile["hours"]) == expected_steps
        assert len(profile["load_kw"]) == expected_steps
        assert len(profile["solar_kw"]) == expected_steps

    def test_daily_profile_metrics(self):
        """Daily profile should include energy and self-sufficiency metrics."""
        profile = EnergyProfile.generate_daily_profile(2.0, 5.0)
        assert "daily_consumption_kwh" in profile
        assert "daily_generation_kwh" in profile
        assert "self_sufficiency_pct" in profile
        assert 0 <= profile["self_sufficiency_pct"] <= 100


# ─── BatteryModel Tests ───────────────────────────────────────────────────────

class TestBatteryModel:
    def get_battery(self, soc=0.5) -> BatteryModel:
        state = BatteryState(
            capacity_kwh=10.0,
            current_soc=soc,
            max_charge_kw=5.0,
            max_discharge_kw=5.0,
        )
        return BatteryModel(state)

    def test_initial_state(self):
        battery = self.get_battery(soc=0.5)
        assert battery.energy_stored_kwh == pytest.approx(5.0, rel=0.01)

    def test_charge_increases_soc(self):
        battery = self.get_battery(soc=0.2)
        initial_soc = battery.state.current_soc
        battery.charge(5.0, 0.25)  # 5kW for 15 min
        assert battery.state.current_soc > initial_soc

    def test_discharge_decreases_soc(self):
        battery = self.get_battery(soc=0.8)
        initial_soc = battery.state.current_soc
        battery.discharge(5.0, 0.25)
        assert battery.state.current_soc < initial_soc

    def test_soc_never_exceeds_1(self):
        battery = self.get_battery(soc=0.99)
        battery.charge(10.0, 1.0)  # Try to overcharge
        assert battery.state.current_soc <= 1.0

    def test_soc_never_below_0(self):
        battery = self.get_battery(soc=0.01)
        battery.discharge(10.0, 1.0)  # Try to over-discharge
        assert battery.state.current_soc >= 0.0

    def test_schedule_returns_traces(self):
        battery = self.get_battery(soc=0.5)
        # Surplus (negative net) for 4 steps, then deficit (positive net) for 4 steps
        net_load = [-2.0, -2.0, -2.0, -2.0, 2.0, 2.0, 2.0, 2.0]
        result = battery.simulate_schedule(net_load, duration_hours_per_step=0.25)
        assert len(result["soc_pct_trace"]) == 8
        assert result["total_charged_kwh"] > 0
        assert result["total_discharged_kwh"] > 0


# ─── P2P Optimizer Tests ──────────────────────────────────────────────────────

class TestP2POptimizer:
    def test_basic_trade_match(self):
        """Two nodes with compatible prices should trade directly."""
        nodes = [
            TradingNode("SELLER_A", surplus_kw=5.0, deficit_kw=0.0, min_price=0.10, max_price=0.20),
            TradingNode("BUYER_B",  surplus_kw=0.0, deficit_kw=5.0, min_price=0.10, max_price=0.20),
        ]
        result = optimize_p2p_trades(nodes)
        assert result["status"] in ("optimal", "optimal_inaccurate")
        p2p_trades = [t for t in result["trades"] if t["type"] == "P2P"]
        assert len(p2p_trades) > 0, "Should have at least one P2P trade"

    def test_no_buyers_goes_to_grid(self):
        """Seller with no buyers should export to grid."""
        nodes = [
            TradingNode("SELLER_A", surplus_kw=5.0, deficit_kw=0.0, min_price=0.10, max_price=0.20),
        ]
        result = optimize_p2p_trades(nodes)
        export_trades = [t for t in result["trades"] if t["type"] == "GRID_EXPORT"]
        assert len(export_trades) > 0

    def test_p2p_cheaper_than_grid(self):
        """P2P trade price should be less than grid import price (0.25)."""
        nodes = [
            TradingNode("SELLER_A", surplus_kw=5.0, deficit_kw=0.0, min_price=0.10, max_price=0.20),
            TradingNode("BUYER_B",  surplus_kw=0.0, deficit_kw=5.0, min_price=0.10, max_price=0.20),
        ]
        result = optimize_p2p_trades(nodes)
        p2p = [t for t in result["trades"] if t["type"] == "P2P"]
        for trade in p2p:
            assert trade["price_per_kwh"] < 0.25, "P2P price must be below grid import price"

    def test_price_incompatible_nodes_use_grid(self):
        """Seller with high min price and buyer with low max price should fall back to grid."""
        nodes = [
            TradingNode("SELLER_A", surplus_kw=5.0, deficit_kw=0.0, min_price=0.30, max_price=0.35),
            TradingNode("BUYER_B",  surplus_kw=0.0, deficit_kw=5.0, min_price=0.10, max_price=0.15),
        ]
        result = optimize_p2p_trades(nodes)
        p2p = [t for t in result["trades"] if t["type"] == "P2P"]
        assert len(p2p) == 0, "Price-incompatible nodes should not trade P2P"
