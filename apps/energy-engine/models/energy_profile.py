"""
Energy Profile models — Python port of EnergyProfile.ts
Uses NumPy for vectorized calculation of load and solar generation curves.
"""

import numpy as np


class EnergyProfile:
    """
    Simulates organic energy generation and consumption curves
    using NumPy-based vectorized computations.
    """

    @staticmethod
    def generate_load(hour_of_day: float, base_load_kw: float) -> float:
        """
        Generates a realistic load for a suburban house based on the hour.
        High peaks at 7am and 6pm (18:00).

        Args:
            hour_of_day: Hour as a float (0-23.99)
            base_load_kw: Average baseline load for the home
        Returns:
            Current consumption in kW
        """
        multiplier = 1.0

        # Morning peak (6am - 9am)
        if 6 <= hour_of_day <= 9:
            multiplier = 2.5
        # Evening peak (5pm - 10pm)
        elif 17 <= hour_of_day <= 22:
            multiplier = 3.5
        # Deep night low (1am - 5am)
        elif 1 <= hour_of_day <= 5:
            multiplier = 0.4

        # Add noise +/- 20% using NumPy for reproducibility
        noise = float(np.random.uniform(-0.2, 0.2))
        multiplier += noise

        return float(max(0.0, base_load_kw * multiplier))

    @staticmethod
    def generate_solar(hour_of_day: float, max_capacity_kw: float) -> float:
        """
        Generates a realistic solar curve.
        Parabolic curve peaking at 1pm (13:00).

        Args:
            hour_of_day: Hour as a float (0-23.99)
            max_capacity_kw: Nameplate capacity of the solar array
        Returns:
            Current generation in kW
        """
        if hour_of_day < 6 or hour_of_day > 19:
            return 0.0

        # Parabola: vertex at (12.5, 1.0), roots near 6 and 19
        h = 12.5
        a = 1 / (6.5 ** 2)
        multiplier = -a * (hour_of_day - h) ** 2 + 1

        if multiplier < 0:
            multiplier = 0.0

        # Weather noise / cloud cover (-40% to +10%)
        noise = float(np.random.uniform(-0.4, 0.1))
        multiplier += noise

        return float(max(0.0, max_capacity_kw * multiplier))

    @staticmethod
    def generate_daily_profile(
        base_load_kw: float,
        solar_capacity_kw: float,
        resolution_minutes: int = 15,
    ) -> dict:
        """
        Generates a full 24-hour profile for a node at a given resolution.
        Returns a dict with 'hours', 'load_kw', and 'solar_kw' arrays.

        This is the vectorized "investor demo" function — shows real science.
        """
        steps_per_hour = 60 // resolution_minutes
        total_steps = 24 * steps_per_hour
        hours = np.linspace(0, 24, total_steps, endpoint=False)

        load_kw = np.array([
            EnergyProfile.generate_load(h, base_load_kw) for h in hours
        ])
        solar_kw = np.array([
            EnergyProfile.generate_solar(h, solar_capacity_kw) for h in hours
        ])

        net_kw = solar_kw - load_kw  # positive = surplus, negative = deficit

        # NumPy 2.0 compatible integration
        trapezoid = getattr(np, 'trapezoid', getattr(np, 'trapz', None))

        return {
            "hours": hours.round(4).tolist(),
            "load_kw": load_kw.round(4).tolist(),
            "solar_kw": solar_kw.round(4).tolist(),
            "net_kw": net_kw.round(4).tolist(),
            "peak_load_kw": float(np.max(load_kw)),
            "peak_solar_kw": float(np.max(solar_kw)),
            "daily_consumption_kwh": float(trapezoid(load_kw, hours)),
            "daily_generation_kwh": float(trapezoid(solar_kw, hours)),
            "self_sufficiency_pct": float(
                min(100.0, trapezoid(np.minimum(solar_kw, load_kw), hours) / max(0.001, trapezoid(load_kw, hours)) * 100)
            ),
        }
