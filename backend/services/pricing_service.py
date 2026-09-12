"""
Pricing and batch-grading service for silk cocoons.

Loads configuration from backend/config/pricing.yaml and provides:
- Per-cocoon price estimation based on grade + average weight
- Overall batch grade (A/B/C/D) based on % of normal cocoons
"""

import logging
import os
from typing import Any, Dict

import yaml

logger = logging.getLogger("pricing_service")
logging.basicConfig(level=logging.INFO)


# ------------------------------------------------------------
# Fallback defaults (used if pricing.yaml is missing or broken)
# ------------------------------------------------------------
DEFAULT_CONFIG: Dict[str, Any] = {
    "average_cocoon_weight_grams": 1.8,
    "market_rates_per_kg": {
        "normal": 850,
        "sunken": 500,
        "surface defect": 350,
        "fugongiya": 200,
    },
    "default_rate_per_kg": 300,
    "batch_grade_thresholds": {
        "A": 0.80,
        "B": 0.60,
        "C": 0.40,
    },
}


# ------------------------------------------------------------
# Config loading
# ------------------------------------------------------------
def _load_config() -> Dict[str, Any]:
    """
    Load pricing.yaml from backend/config/.
    Falls back to DEFAULT_CONFIG if the file is missing or invalid.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config", "pricing.yaml")

    if not os.path.exists(config_path):
        logger.warning(
            f"pricing.yaml not found at {config_path}. Using fallback defaults."
        )
        return DEFAULT_CONFIG

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f) or {}
        logger.info(f"Loaded pricing config from {config_path}")
        return {**DEFAULT_CONFIG, **config}
    except Exception as e:
        logger.error(
            f"Failed to load pricing.yaml ({e}). Using fallback defaults."
        )
        return DEFAULT_CONFIG


# Load once at import time
CONFIG = _load_config()


# ------------------------------------------------------------
# Helper: normalize class names
# ------------------------------------------------------------
def _normalize_grade(grade: str) -> str:
    """
    Normalize a class name so 'surface_defect' and 'Surface Defect'
    both become 'surface defect'.
    """
    if not grade:
        return ""
    return grade.strip().lower().replace("_", " ")


# ------------------------------------------------------------
# Public API
# ------------------------------------------------------------
class PricingService:
    """Handles pricing and batch grading for silk cocoons."""

    @staticmethod
    def estimate_price(grade: str, area: int = 0) -> float:
        """
        Estimate the price of a SINGLE cocoon based on its grade.

        Args:
            grade: Quality class (e.g., 'normal', 'surface_defect').
            area: Pixel area (currently unused but kept for future use).

        Returns:
            Estimated price in ₹ (INR), rounded to 2 decimals.
        """
        grade_key = _normalize_grade(grade)

        weight_g = CONFIG.get("average_cocoon_weight_grams", 1.8)
        weight_kg = weight_g / 1000.0

        rates = CONFIG.get("market_rates_per_kg", {})
        default_rate = CONFIG.get("default_rate_per_kg", 300)

        rate_per_kg = rates.get(grade_key, default_rate)

        price = weight_kg * rate_per_kg
        return round(price, 2)

    @staticmethod
    def batch_grade(grade_counts: Dict[str, int]) -> str:
        """
        Compute an overall batch grade (A/B/C/D) from grade distribution.

        Rule: based on the percentage of 'normal' cocoons.
            ≥ 80% normal → A
            60–79%       → B
            40–59%       → C
            < 40%        → D
        """
        if not grade_counts:
            return "N/A"

        # Normalize keys in case the workflow returns "Normal" or "normal " etc.
        normalized_counts: Dict[str, int] = {}
        for grade, count in grade_counts.items():
            key = _normalize_grade(grade)
            normalized_counts[key] = normalized_counts.get(key, 0) + count

        total = sum(normalized_counts.values())
        if total == 0:
            return "N/A"

        normal_count = normalized_counts.get("normal", 0)
        normal_pct = normal_count / total

        thresholds = CONFIG.get(
            "batch_grade_thresholds", {"A": 0.80, "B": 0.60, "C": 0.40}
        )

        if normal_pct >= thresholds.get("A", 0.80):
            return "A"
        if normal_pct >= thresholds.get("B", 0.60):
            return "B"
        if normal_pct >= thresholds.get("C", 0.40):
            return "C"
        return "D"

    @staticmethod
    def get_config() -> Dict[str, Any]:
        """Expose the loaded config for debugging / frontend display."""
        return CONFIG