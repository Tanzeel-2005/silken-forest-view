import io
import logging
import os
import time
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from inference_sdk import InferenceHTTPClient
from PIL import Image
from pydantic import BaseModel

from services.roboflow_service import RoboflowService

logger = logging.getLogger("classify_router")
logging.basicConfig(level=logging.INFO)

router = APIRouter(prefix="/api", tags=["Model 2: Grading"])

# --- ACTUAL MODEL 2 ID FROM ROBOFLOW ---
MODEL_ID = "tanzeel-ahamed-s-workspace/cocoon-quality-classification-74pao-1-resnet18-t1"
ROBOFLOW_API_URL = os.getenv("ROBOFLOW_API_URL", "https://detect.roboflow.com")
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()


class ClassifyResponse(BaseModel):
    grade: str
    confidence: float
    estimated_price: float
    processing_ms: float
    success: bool = True


@router.post("/classify", response_model=ClassifyResponse)
async def classify_single_cocoon(
    image: UploadFile = File(..., description="Upload a SINGLE cocoon image")
) -> ClassifyResponse:
    """
    Standalone endpoint to test Model 2 (Grading) without needing Model 1.
    Takes a single cocoon crop, sends it directly to Model 2, returns the grade + price.
    """
    # --- Validate ---
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    contents = await image.read()
    if not contents:
        raise HTTPException(400, "Empty file")

    if not ROBOFLOW_API_KEY:
        raise HTTPException(500, "ROBOFLOW_API_KEY is missing in .env file")

    if not MODEL_ID or MODEL_ID == "your-project-id/1":
        raise HTTPException(
            500,
            "MODEL_ID is not set. Please configure it in backend/routers/classify.py",
        )

    start = time.perf_counter()

    # Save image to a safe temp path so Roboflow SDK can read it
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", f"temp_classify_{int(time.time())}.jpg")

    try:
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Initialize Roboflow client
        client = InferenceHTTPClient(
            api_url=ROBOFLOW_API_URL,
            api_key=ROBOFLOW_API_KEY,
        )

        logger.info(f"Calling Model 2 '{MODEL_ID}' directly...")
        result = client.infer(temp_path, model_id=MODEL_ID)

        # Extract top prediction
        predictions = result.get("predictions", [])
        if predictions:
            top = max(predictions, key=lambda p: p.get("confidence", 0))
            grade = top.get("class", "unknown")
            confidence = float(top.get("confidence", 0.0))
        else:
            grade = "unknown"
            confidence = 0.0

        logger.info(f"Model 2 prediction: {grade} ({confidence:.2f})")

        # Extract area via OpenCV for pricing
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        features = RoboflowService._extract_features(pil_image)

        # Estimate price
        price = RoboflowService._estimate_price(grade, features["area"])

        elapsed = round((time.perf_counter() - start) * 1000, 2)

        return ClassifyResponse(
            grade=grade,
            confidence=round(confidence, 4),
            estimated_price=price,
            processing_ms=elapsed,
            success=True,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        raise HTTPException(500, f"Classification failed: {str(e)}")

    finally:
        # Always clean up temp file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as cleanup_err:
                logger.warning(f"Failed to remove temp file {temp_path}: {cleanup_err}")