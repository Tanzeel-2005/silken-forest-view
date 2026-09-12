import base64
import io
import logging
import os
import time
from typing import Any, Dict, List

import cv2
import numpy as np
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient
from PIL import Image, ImageDraw

from services.pricing_service import PricingService

# Load environment configuration
load_dotenv()

logger = logging.getLogger("roboflow_service")
logging.basicConfig(level=logging.INFO)

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()
WORKSPACE_NAME = "tanzeel-z7hcs"
WORKFLOW_ID = "mergedcocoon-v1-logic"
ROBOFLOW_API_URL = os.getenv("ROBOFLOW_API_URL", "https://detect.roboflow.com")


class RoboflowService:
    """
    Service responsible for executing Roboflow Workflows, extracting cocoon segmentation
    polygons, applying black-background preprocessing, calculating physical features,
    estimating prices, and rendering overlays.
    """

    @staticmethod
    async def analyze_image(
        image_bytes: bytes,
        filename: str,
        outputs_dir: str,
        image_path: str = None,
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()

        if not ROBOFLOW_API_KEY or ROBOFLOW_API_KEY == "YOUR_ROBOFLOW_API_KEY":
            raise ValueError(
                "ROBOFLOW_API_KEY is missing or invalid in environment. Please configure ROBOFLOW_API_KEY in backend/.env"
            )

        # Load image into PIL for output rendering and cropping
        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            logger.error(f"Failed to decode uploaded image bytes: {e}")
            raise ValueError("Invalid image file provided.")

        # Initialize Roboflow InferenceHTTPClient
        client = InferenceHTTPClient(
            api_url=ROBOFLOW_API_URL,
            api_key=ROBOFLOW_API_KEY,
        )

        # Execute Roboflow Workflow
        image_input = image_path if (image_path and os.path.exists(image_path)) else pil_image

        try:
            logger.info(f"Calling Roboflow Workflow '{WORKFLOW_ID}' in workspace '{WORKSPACE_NAME}'...")
            workflow_response = client.run_workflow(
                workspace_name=WORKSPACE_NAME,
                workflow_id=WORKFLOW_ID,
                images={"image": image_input},
            )
        except Exception as e:
            logger.error(f"Roboflow Workflow execution error: {e}")
            raise RuntimeError(f"Roboflow Workflow execution failed: {str(e)}")

        # Extract predictions from workflow output
        detections = RoboflowService._extract_detections(workflow_response)

        # Process each detection: crop, apply black background, extract features, estimate price
        graded_cocoons = []
        grade_counts = {}
        total_price = 0.0

        for i, det in enumerate(detections):
            # Get bounding box coordinates
            x, y, w, h = det["x"], det["y"], det["width"], det["height"]

            # Calculate crop box with padding
            x1 = max(0, int(x - w / 2) - 10)
            y1 = max(0, int(y - h / 2) - 10)
            x2 = min(pil_image.width, int(x + w / 2) + 10)
            y2 = min(pil_image.height, int(y + h / 2) + 10)

            # Apply black background using the segmentation mask
            points = det.get("points", [])
            if points and len(points) >= 3:
                crop = RoboflowService._make_black_background_crop(
                    pil_image, points, (x1, y1, x2, y2)
                )
            else:
                crop = pil_image.crop((x1, y1, x2, y2))

            # Extract physical features using OpenCV
            features = RoboflowService._extract_features(crop)

            # Get the grade (class name from the workflow)
            grade = det.get("class", "unknown")

            # Estimate price using PricingService
            price = PricingService.estimate_price(grade, features["area"])

            # Update statistics
            grade_counts[grade] = grade_counts.get(grade, 0) + 1
            total_price += price

            graded_cocoons.append({
                "id": i + 1,
                "grade": grade,
                "confidence": det["confidence"],
                "features": features,
                "estimated_price": price,
            })

        # Calculate average confidence
        count = len(detections)
        if count > 0:
            avg_confidence = round(
                sum(d.get("confidence", 0.0) for d in detections) / count * 100, 2
            )
        else:
            avg_confidence = 0.0

        # Draw segmentation mask overlay on the original image
        segmented_pil = RoboflowService._draw_segmentation_overlay(pil_image, detections)

        # Save segmented output artifact to disk
        output_filename = f"segmented_{int(time.time())}_{filename}"
        output_filepath = os.path.join(outputs_dir, output_filename)
        segmented_pil.save(output_filepath, format="JPEG", quality=90)

        # Encode segmented image to Base64 JPEG data URL
        buffered = io.BytesIO()
        segmented_pil.save(buffered, format="JPEG", quality=88)
        base64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        segmented_data_url = f"data:image/jpeg;base64,{base64_str}"

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Compute overall batch grade (A/B/C/D) from grade distribution
        batch_grade = PricingService.batch_grade(grade_counts)

        # Return comprehensive payload for the frontend dashboard
        return {
            "count": count,
            "average_confidence": avg_confidence,
            "processing_ms": elapsed_ms,
            "detections": detections,
            "cocoons": graded_cocoons,
            "grade_counts": grade_counts,
            "batch_grade": batch_grade,
            "total_estimated_price": round(total_price, 2),
            "segmented_image": segmented_data_url,
            "success": True,
        }

    @staticmethod
    def _make_black_background_crop(
        base_img: Image.Image,
        points: List[Dict[str, float]],
        bbox: tuple,
    ) -> Image.Image:
        """
        Crops a cocoon from the tray image and applies a black background
        using the segmentation polygon mask.
        """
        x1, y1, x2, y2 = bbox

        # Crop the region from the original image
        crop = base_img.crop((x1, y1, x2, y2))
        crop_array = np.array(crop)

        # Build a mask from the polygon, shifted to crop-local coordinates
        mask = np.zeros(crop_array.shape[:2], dtype=np.uint8)
        shifted_points = np.array(
            [[int(pt["x"]) - x1, int(pt["y"]) - y1] for pt in points],
            dtype=np.int32,
        )
        cv2.fillPoly(mask, [shifted_points], 255)

        # Create a black canvas and copy only the masked pixels
        black_bg = np.zeros_like(crop_array)
        masked_crop = np.where(mask[:, :, None] == 255, crop_array, black_bg)

        return Image.fromarray(masked_crop)

    @staticmethod
    def _extract_detections(workflow_response: Any) -> List[Dict[str, Any]]:
        """Parses Roboflow Workflow response to extract bounding boxes, classes, and polygons."""
        detections: List[Dict[str, Any]] = []

        if not workflow_response:
            return detections

        if isinstance(workflow_response, list):
            if len(workflow_response) == 0:
                return detections
            if isinstance(workflow_response[0], dict) and (
                "x" in workflow_response[0] or "points" in workflow_response[0] or "confidence" in workflow_response[0]
            ):
                raw_predictions = workflow_response
            else:
                workflow_response = workflow_response[0]
        else:
            raw_predictions = []

        if isinstance(workflow_response, dict):
            candidate_keys = [
                "predictions", "detections", "output", "results",
                "cocoon_predictions", "segmentation",
            ]
            raw_predictions = []
            for key in candidate_keys:
                if key in workflow_response:
                    val = workflow_response[key]
                    if isinstance(val, list):
                        raw_predictions = val
                        break
                    elif isinstance(val, dict) and "predictions" in val:
                        raw_predictions = val["predictions"]
                        break

            if not raw_predictions:
                for k, v in workflow_response.items():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                        if any(field in v[0] for field in ["confidence", "class", "points", "x", "score"]):
                            raw_predictions = v
                            break
                    elif isinstance(v, dict) and "predictions" in v and isinstance(v["predictions"], list):
                        raw_predictions = v["predictions"]
                        break

        for item in raw_predictions:
            if not isinstance(item, dict):
                continue

            raw_pts = item.get("points", [])
            formatted_pts: List[Dict[str, float]] = []

            if isinstance(raw_pts, list):
                for pt in raw_pts:
                    if isinstance(pt, dict) and "x" in pt and "y" in pt:
                        formatted_pts.append({"x": float(pt["x"]), "y": float(pt["y"])})
                    elif isinstance(pt, (list, tuple)) and len(pt) >= 2:
                        formatted_pts.append({"x": float(pt[0]), "y": float(pt[1])})

            confidence_val = float(item.get("confidence", item.get("score", 0.0)))

            det = {
                "class": str(item.get("class", item.get("class_name", "cocoon"))),
                "confidence": round(confidence_val, 4),
                "x": float(item.get("x", 0.0)),
                "y": float(item.get("y", 0.0)),
                "width": float(item.get("width", 0.0)),
                "height": float(item.get("height", 0.0)),
                "points": formatted_pts,
            }
            detections.append(det)

        return detections

    @staticmethod
    def _extract_features(pil_crop: Image.Image) -> Dict[str, Any]:
        """Extract physical features using OpenCV from a PIL image crop."""
        img = cv2.cvtColor(np.array(pil_crop), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            c = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(c)
            area = cv2.contourArea(c)
            return {
                "area": int(area),
                "length": max(w, h),
                "width": min(w, h),
                "aspect_ratio": round(max(w, h) / min(w, h), 2) if min(w, h) > 0 else 0,
            }
        return {"area": 0, "length": 0, "width": 0, "aspect_ratio": 0}

    @staticmethod
    def _draw_segmentation_overlay(base_img: Image.Image, detections: List[Dict[str, Any]]) -> Image.Image:
        """Renders emerald green translucent segmentation masks and borders on original image."""
        img = base_img.copy()
        draw_img = img.convert("RGBA")

        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw_overlay = ImageDraw.Draw(overlay)
        draw_stroke = ImageDraw.Draw(draw_img)

        fill_color = (16, 185, 129, 90)
        stroke_color = (52, 211, 153, 230)

        for det in detections:
            points = det.get("points", [])
            if points and len(points) >= 3:
                poly_tuples = [(pt["x"], pt["y"]) for pt in points]
                draw_overlay.polygon(poly_tuples, fill=fill_color)
                draw_stroke.polygon(poly_tuples, outline=stroke_color, width=2)
            else:
                cx, cy = det.get("x", 0), det.get("y", 0)
                w, h = det.get("width", 0), det.get("height", 0)
                if w > 0 and h > 0:
                    box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
                    draw_overlay.ellipse(box, fill=fill_color)
                    draw_stroke.ellipse(box, outline=stroke_color, width=2)

        final_img = Image.alpha_composite(draw_img, overlay).convert("RGB")
        return final_img