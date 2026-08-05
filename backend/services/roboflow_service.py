import base64
import io
import logging
import os
import time
from typing import Any, Dict, List

from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient
from PIL import Image, ImageDraw

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
    Service responsible for executing Roboflow Workflows using the official inference-sdk,
    extracting cocoon segmentation polygons, and rendering segmented output overlays.
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

        # Load image into PIL for output rendering
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
        # Images payload accepts file path, PIL Image, or numpy array
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

        # Calculate statistics
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

        return {
            "count": count,
            "average_confidence": avg_confidence,
            "processing_ms": elapsed_ms,
            "detections": detections,
            "segmented_image": segmented_data_url,
            "success": True,
        }

    @staticmethod
    def _extract_detections(workflow_response: Any) -> List[Dict[str, Any]]:
        """
        Parses Roboflow Workflow response structure to extract detection bounding boxes
        and polygon segmentation coordinates.
        """
        detections: List[Dict[str, Any]] = []

        if not workflow_response:
            return detections

        # Unwrap list if workflow returned a single-element list
        if isinstance(workflow_response, list):
            if len(workflow_response) == 0:
                return detections
            # Check if list contains direct prediction items
            if isinstance(workflow_response[0], dict) and (
                "x" in workflow_response[0] or "points" in workflow_response[0] or "confidence" in workflow_response[0]
            ):
                raw_predictions = workflow_response
            else:
                workflow_response = workflow_response[0]
        else:
            raw_predictions = []

        if isinstance(workflow_response, dict):
            # Known prediction keys in Roboflow Workflows
            candidate_keys = [
                "predictions",
                "detections",
                "output",
                "results",
                "cocoon_predictions",
                "segmentation",
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

            # Fallback scan over all dictionary values for prediction items
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

            # Format polygon coordinates
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
    def _draw_segmentation_overlay(base_img: Image.Image, detections: List[Dict[str, Any]]) -> Image.Image:
        """Renders emerald green pixel-forest translucent segmentation masks and borders on original image."""
        img = base_img.copy()
        draw_img = img.convert("RGBA")

        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw_overlay = ImageDraw.Draw(overlay)
        draw_stroke = ImageDraw.Draw(draw_img)

        fill_color = (16, 185, 129, 90)     # Emerald translucent fill
        stroke_color = (52, 211, 153, 230)  # Mint border outline

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
