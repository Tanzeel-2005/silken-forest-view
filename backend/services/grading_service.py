import os
from typing import Any, Dict


class GradingService:
    """
    Configurable business logic service for cocoon tray grading,
    demo financial valuation estimation, and class breakdown aggregation.
    """

    @staticmethod
    def compute_quality_summary(
        quality_counts: Dict[str, int],
        total_yolo_count: int,
    ) -> Dict[str, Any]:
        """
        Computes percentages (using total YOLO count as denominator),
        classification success rate, overall tray grade, and demo price estimate.
        """
        if total_yolo_count <= 0:
            return {
                "quality_breakdown": {
                    "normal": {"count": 0, "percentage": 0.0},
                    "fugongiya": {"count": 0, "percentage": 0.0},
                    "sunken": {"count": 0, "percentage": 0.0},
                    "surface_defect": {"count": 0, "percentage": 0.0},
                    "unclassified": {"count": 0, "percentage": 0.0},
                },
                "classification_success_rate": 100.0,
                "grade_estimate": {
                    "grade": "N/A (No Cocoons)",
                    "grade_code": "N/A",
                    "estimated_price_demo": 0.0,
                    "currency": "INR",
                    "disclaimer": "Demo assumption rules only — configurable parameters",
                },
            }

        normal_cnt = quality_counts.get("normal", 0)
        fugongiya_cnt = quality_counts.get("fugongiya", 0)
        sunken_cnt = quality_counts.get("sunken", 0)
        defect_cnt = quality_counts.get("surface_defect", 0)
        unclassified_cnt = quality_counts.get("unclassified", 0)

        # Calculate percentages using total YOLO detection count as denominator
        normal_pct = round((normal_cnt / total_yolo_count) * 100, 1)
        fugongiya_pct = round((fugongiya_cnt / total_yolo_count) * 100, 1)
        sunken_pct = round((sunken_cnt / total_yolo_count) * 100, 1)
        defect_pct = round((defect_cnt / total_yolo_count) * 100, 1)
        unclassified_pct = round((unclassified_cnt / total_yolo_count) * 100, 1)

        # Classification success rate
        successful_classifications = total_yolo_count - unclassified_cnt
        success_rate = round((successful_classifications / total_yolo_count) * 100, 1)

        # Grading rule based on normal cocoon percentage ratio
        if normal_pct >= 85.0:
            grade_name = "Grade A (Premium)"
            grade_code = "A"
        elif normal_pct >= 70.0:
            grade_name = "Grade B (Standard)"
            grade_code = "B"
        elif normal_pct >= 50.0:
            grade_name = "Grade C (Commercial)"
            grade_code = "C"
        else:
            grade_name = "Grade D (Low Grade)"
            grade_code = "D"

        # Configurable demo price estimation formula
        base_normal_price = float(os.getenv("DEMO_BASE_NORMAL_PRICE_INR", "2.50"))
        fugongiya_price = float(os.getenv("DEMO_FUGONGIYA_PRICE_INR", "1.00"))
        defect_price = float(os.getenv("DEMO_DEFECT_PRICE_INR", "1.00"))
        sunken_price = float(os.getenv("DEMO_SUNKEN_PRICE_INR", "0.50"))

        estimated_price_demo = round(
            (normal_cnt * base_normal_price)
            + (fugongiya_cnt * fugongiya_price)
            + (defect_cnt * defect_price)
            + (sunken_cnt * sunken_price),
            2,
        )

        return {
            "quality_breakdown": {
                "normal": {"count": normal_cnt, "percentage": normal_pct},
                "fugongiya": {"count": fugongiya_cnt, "percentage": fugongiya_pct},
                "sunken": {"count": sunken_cnt, "percentage": sunken_pct},
                "surface_defect": {"count": defect_cnt, "percentage": defect_pct},
                "unclassified": {"count": unclassified_cnt, "percentage": unclassified_pct},
            },
            "classification_success_rate": success_rate,
            "grade_estimate": {
                "grade": grade_name,
                "grade_code": grade_code,
                "estimated_price_demo": estimated_price_demo,
                "currency": "INR",
                "disclaimer": "Demo assumption rules only — configurable project parameters",
            },
        }
