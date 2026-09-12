import base64
import io
import logging
import os
import time
from typing import Any, Dict, List

from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient
from PIL import Image, ImageDraw

from services.grading_service import GradingService

# Load environment configuration
load_dotenv()

logger = logging.getLogger("roboflow_service")
logging.basicConfig(level=logging.INFO)

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()

# Segmentation Model 1 Configuration (YOLOv11 Workflow)
SEGMENTATION_WORKSPACE = "tanzeel-z7hcs"
SEGMENTATION_WORKFLOW_ID = "mergedcocoon-v1-logic"

# Quality Classification Model 2 Configuration (ResNet18 Workflow)
CLASSIFICATION_WORKSPACE = os.getenv(
    "ROBOFLOW_CLASSIFICATION_WORKSPACE", "tanzeel-ahamed-s-workspace"
).strip()
CLASSIFICATION_WORKFLOW_ID = os.getenv(
    "ROBOFLOW_CLASSIFICATION_WORKFLOW_ID",
    "cocoon-quality-classification-vcocoon-quality-classification-74pao-1-resnet18-t1-logic",
).strip()

ROBOFLOW_CLASSIFICATION_API_KEY = os.getenv("ROBOFLOW_CLASSIFICATION_API_KEY", ROBOFLOW_API_KEY).strip()
ROBOFLOW_API_URL = os.getenv("ROBOFLOW_API_URL", "https://detect.roboflow.com")


class RoboflowService:
    """
    Service responsible for executing the two-stage vision pipeline:
    1. Running Roboflow YOLOv11 Segmentation Workflow to detect & count cocoons.
    2. Extracting mask-isolated crops of each detected cocoon.
    3. Executing Roboflow ResNet18 Quality Classification Workflow for each cocoon crop.
    4. Aggregating class statistics, tray grades, and rendering color-coded output overlays.
    """

    @staticmethod
    async def analyze_image(
        image_bytes: bytes,
        filename: str,
        outputs_dir: str,
        image_path: str = None,
    ) -> Dict[str, Any]:
        """Legacy combined endpoint kept for existing integrations."""
        segmentation = await RoboflowService.segment_image(image_bytes, filename, outputs_dir, image_path)
        return await RoboflowService.classify_detections(
            image_bytes, filename, outputs_dir, segmentation["detections"], segmentation
        )

    @staticmethod
    async def segment_image(
        image_bytes: bytes, filename: str, outputs_dir: str, image_path: str = None
    ) -> Dict[str, Any]:
        """Run the authoritative YOLO stage only. No ResNet calls occur here."""
        start_time = time.perf_counter()

        if not ROBOFLOW_API_KEY or ROBOFLOW_API_KEY == "YOUR_ROBOFLOW_API_KEY":
            raise ValueError(
                "ROBOFLOW_API_KEY is missing or invalid in environment. Please configure ROBOFLOW_API_KEY in backend/.env"
            )

        # Load image into PIL for cropping & output rendering
        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            logger.error(f"Failed to decode uploaded image bytes: {e}")
            raise ValueError("Invalid image file provided.")

        # Initialize only the segmentation client. Counting is YOLO's responsibility.
        client = InferenceHTTPClient(
            api_url=ROBOFLOW_API_URL,
            api_key=ROBOFLOW_API_KEY,
        )

        # STAGE 1: Execute YOLOv11 Instance Segmentation Workflow
        image_input = image_path if (image_path and os.path.exists(image_path)) else pil_image

        try:
            logger.info(
                f"Calling YOLOv11 Workflow '{SEGMENTATION_WORKFLOW_ID}' in workspace '{SEGMENTATION_WORKSPACE}'..."
            )
            workflow_response = client.run_workflow(
                workspace_name=SEGMENTATION_WORKSPACE,
                workflow_id=SEGMENTATION_WORKFLOW_ID,
                images={"image": image_input},
            )
        except Exception as e:
            logger.error(f"YOLOv11 Workflow execution error: {e}")
            raise RuntimeError(f"YOLOv11 Segmentation Workflow execution failed: {str(e)}")

        # Extract predictions from YOLO response
        detections = RoboflowService._extract_detections(workflow_response)

        # Authoritative cocoon count from YOLOv11
        count = len(detections)
        if count > 0:
            avg_confidence = round(
                sum(d.get("confidence", 0.0) for d in detections) / count * 100, 2
            )
        else:
            avg_confidence = 0.0

        # Stage-one overlay deliberately uses neutral masks: quality is unknown until
        # the user explicitly requests classification.
        segmented_pil = RoboflowService._draw_segmentation_overlay(pil_image, detections)
        buffered = io.BytesIO()
        segmented_pil.save(buffered, format="JPEG", quality=88)
        segmented_data_url = f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
        return {
            "count": count,
            "average_confidence": avg_confidence,
            "processing_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "detections": detections,
            "segmented_image": segmented_data_url,
            "success": True,
        }

    @staticmethod
    async def classify_detections(
        image_bytes: bytes,
        filename: str,
        outputs_dir: str,
        detections: List[Dict[str, Any]],
        segmentation: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Classify exactly the detections created by a prior YOLO segmentation."""
        start_time = time.perf_counter()
        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            logger.error(f"Failed to decode stored image bytes: {e}")
            raise ValueError("Stored tray image is invalid.")

        # Never derive a count here; classification iterates over the supplied YOLO set.
        detections = [dict(det) for det in detections]
        count = len(detections)
        classification_client = InferenceHTTPClient(api_url=ROBOFLOW_API_URL, api_key=ROBOFLOW_CLASSIFICATION_API_KEY)
        quality_counts = {
            "normal": 0,
            "fugongiya": 0,
            "sunken": 0,
            "surface_defect": 0,
            "unclassified": 0,
        }

        for idx, det in enumerate(detections):
            crop_pil = RoboflowService._extract_mask_isolated_crop(pil_image, det)
            
            try:
                logger.info(
                    f"Classifying cocoon crop {idx + 1}/{count} via ResNet18 workflow '{CLASSIFICATION_WORKFLOW_ID}'..."
                )
                class_response = classification_client.run_workflow(
                    workspace_name=CLASSIFICATION_WORKSPACE,
                    workflow_id=CLASSIFICATION_WORKFLOW_ID,
                    images={"image": crop_pil},
                )
                
                quality_cls, quality_conf = RoboflowService._parse_classification_response(class_response)
                det["quality_class"] = quality_cls
                det["quality_confidence"] = quality_conf
                
                if quality_cls in quality_counts:
                    quality_counts[quality_cls] += 1
                else:
                    quality_counts["unclassified"] += 1

            except Exception as crop_err:
                logger.warning(
                    f"ResNet18 classification failed for crop {idx + 1}/{count}: {crop_err}"
                )
                det["quality_class"] = "unclassified"
                det["quality_confidence"] = 0.0
                quality_counts["unclassified"] += 1

        # Summary uses the original YOLO total so failures remain unclassified.
        summary = GradingService.compute_quality_summary(quality_counts, count)

        # STAGE 4: Draw Color-Coded Quality Segmentation Overlay
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
            "average_confidence": (segmentation or {}).get("average_confidence", 0.0),
            "processing_ms": elapsed_ms,
            "quality_breakdown": summary["quality_breakdown"],
            "classification_success_rate": summary["classification_success_rate"],
            "grade_estimate": summary["grade_estimate"],
            "detections": detections,
            "segmented_image": segmented_data_url,
            "success": True,
        }

    @staticmethod
    def _extract_mask_isolated_crop(base_img: Image.Image, det: Dict[str, Any]) -> Image.Image:
        """
        Extracts a cocoon crop using the YOLO segmentation polygon coordinates to mask out
        neighboring cocoons and background clutter.
        """
        img_w, img_h = base_img.size
        points = det.get("points", [])

        # Calculate bounding box bounds around polygon or bounding box center
        if points and len(points) >= 3:
            xs = [pt["x"] for pt in points]
            ys = [pt["y"] for pt in points]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
        else:
            cx, cy = det.get("x", 0.0), det.get("y", 0.0)
            w, h = det.get("width", 0.0), det.get("height", 0.0)
            min_x, max_x = cx - w / 2, cx + w / 2
            min_y, max_y = cy - h / 2, cy + h / 2

        # Apply safety margin (5 pixels or 5% of dimensions)
        margin = 5
        xmin = max(0, int(min_x - margin))
        ymin = max(0, int(min_y - margin))
        xmax = min(img_w, int(max_x + margin))
        ymax = min(img_h, int(max_y + margin))

        # Ensure valid crop dimensions
        if xmax <= xmin or ymax <= ymin:
            xmin, ymin, xmax, ymax = 0, 0, img_w, img_h

        # Crop area from original base image
        crop_base = base_img.crop((xmin, ymin, xmax, ymax))

        # If valid polygon points exist, mask non-polygon background pixels to black
        if points and len(points) >= 3:
            crop_w, crop_h = crop_base.size
            mask = Image.new("L", (crop_w, crop_h), 0)
            draw_mask = ImageDraw.Draw(mask)

            # Adjust polygon points relative to crop origin (xmin, ymin)
            rel_points = [(pt["x"] - xmin, pt["y"] - ymin) for pt in points]
            draw_mask.polygon(rel_points, fill=255)

            # Apply mask to set pixels outside polygon to neutral black
            isolated_crop = Image.new("RGB", (crop_w, crop_h), (0, 0, 0))
            isolated_crop.paste(crop_base, mask=mask)
            return isolated_crop

        return crop_base

    @staticmethod
    def _parse_classification_response(workflow_response: Any) -> tuple[str, float]:
        """
        Parses Roboflow ResNet18 workflow classification response to extract top predicted class and confidence.
        Standardizes labels to ['normal', 'fugongiya', 'sunken', 'surface_defect'].
        """
        if not workflow_response:
            return "unclassified", 0.0

        if isinstance(workflow_response, list) and len(workflow_response) > 0:
            workflow_response = workflow_response[0]

        top_class = ""
        top_conf = 0.0

        if isinstance(workflow_response, dict):
            # Scan dictionary for predictions or classification labels
            candidates = ["predictions", "output", "results", "classification", "top", "predictions_1"]
            raw_pred = None
            for key in candidates:
                if key in workflow_response:
                    raw_pred = workflow_response[key]
                    break

            if raw_pred is None:
                raw_pred = workflow_response

            if isinstance(raw_pred, list) and len(raw_pred) > 0:
                first = raw_pred[0]
                if isinstance(first, dict):
                    top_class = str(first.get("class", first.get("label", first.get("class_name", ""))))
                    top_conf = float(first.get("confidence", first.get("score", 0.0)))
            elif isinstance(raw_pred, dict):
                if "top" in raw_pred:
                    top_class = str(raw_pred["top"])
                    top_conf = float(raw_pred.get("confidence", 0.0))
                elif "class" in raw_pred or "predicted_class" in raw_pred:
                    top_class = str(raw_pred.get("class", raw_pred.get("predicted_class", "")))
                    top_conf = float(raw_pred.get("confidence", raw_pred.get("score", 0.0)))
                elif "predictions" in raw_pred and isinstance(raw_pred["predictions"], dict):
                    preds = raw_pred["predictions"]
                    top_class = str(preds.get("top", preds.get("class", "")))
                    top_conf = float(preds.get("confidence", 0.0))

        # Standardize class name
        cls_lower = top_class.lower().strip().replace("-", "_").replace(" ", "_")
        if "normal" in cls_lower:
            norm_class = "normal"
        elif "fugongiya" in cls_lower:
            norm_class = "fugongiya"
        elif "sunken" in cls_lower:
            norm_class = "sunken"
        elif "defect" in cls_lower or "surface" in cls_lower:
            norm_class = "surface_defect"
        elif cls_lower != "":
            norm_class = cls_lower
        else:
            norm_class = "unclassified"

        return norm_class, round(top_conf, 4)

    @staticmethod
    def _extract_detections(workflow_response: Any) -> List[Dict[str, Any]]:
        """
        Parses Roboflow Workflow response structure to extract detection bounding boxes
        and polygon segmentation coordinates.
        """
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
                "quality_class": "unclassified",
                "quality_confidence": 0.0,
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
        """
        Renders quality color-coded segmentation masks and borders on original image:
        - Normal: Emerald Green
        - Fugongiya: Royal Purple
        - Sunken: Rose Red
        - Surface Defect: Amber Yellow
        - Unclassified: Slate Gray
        """
        img = base_img.copy()
        draw_img = img.convert("RGBA")

        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw_overlay = ImageDraw.Draw(overlay)
        draw_stroke = ImageDraw.Draw(draw_img)

        # Color mapping palette
        color_palette = {
            "normal": {"fill": (16, 185, 129, 90), "stroke": (52, 211, 153, 230)},
            "fugongiya": {"fill": (139, 92, 246, 90), "stroke": (167, 139, 250, 230)},
            "sunken": {"fill": (244, 63, 94, 90), "stroke": (251, 113, 133, 230)},
            "surface_defect": {"fill": (245, 158, 11, 90), "stroke": (251, 191, 36, 230)},
            "unclassified": {"fill": (100, 116, 139, 90), "stroke": (148, 163, 184, 230)},
        }

        for det in detections:
            q_cls = det.get("quality_class", "unclassified")
            palette = color_palette.get(q_cls, color_palette["unclassified"])
            fill_color = palette["fill"]
            stroke_color = palette["stroke"]

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
