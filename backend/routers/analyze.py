import os
import time
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from services.roboflow_service import RoboflowService

router = APIRouter(prefix="/api", tags=["Analysis"])


# --- Pydantic Models for Request/Response Validation ---

class FeatureModel(BaseModel):
    area: int
    length: int
    width: int
    aspect_ratio: float


class CocoonItem(BaseModel):
    id: int
    grade: str
    confidence: float
    features: FeatureModel
    estimated_price: float


class AnalyzeResponse(BaseModel):
    count: int
    average_confidence: float
    processing_ms: float
    detections: List[Dict[str, Any]]
    cocoons: List[CocoonItem]
    grade_counts: Dict[str, int]
    batch_grade: str                      # ← NEW
    total_estimated_price: float
    segmented_image: str
    success: bool = True


# --- API Route ---

@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze tray image for silk cocoon segmentation, grading, and pricing",
    description="Receives tray image, runs Roboflow Workflow via InferenceSDK, extracts features, estimates prices, and returns count, grades, and segmented image.",
)
async def analyze_cocoon_tray(
    image: UploadFile = File(..., description="Uploaded silk cocoon tray image file (JPG, PNG)")
) -> AnalyzeResponse:
    # Validate content type
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not a valid image. Please upload a JPG or PNG file.",
        )

    # Read uploaded image bytes
    contents = await image.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty.",
        )

    # Prepare storage directories
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    uploads_dir = os.path.join(base_dir, "uploads")
    outputs_dir = os.path.join(base_dir, "outputs")
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(outputs_dir, exist_ok=True)

    # Save original uploaded file to disk
    original_filename = f"{int(time.time())}_{image.filename or 'tray.jpg'}"
    upload_path = os.path.join(uploads_dir, original_filename)
    with open(upload_path, "wb") as f:
        f.write(contents)

    try:
        # Run inference via Roboflow Service
        result = await RoboflowService.analyze_image(
            image_bytes=contents,
            filename=image.filename or "tray.jpg",
            outputs_dir=outputs_dir,
            image_path=upload_path,
        )

        # Map the comprehensive result to our Pydantic response model
        return AnalyzeResponse(
            count=result["count"],
            average_confidence=result["average_confidence"],
            processing_ms=result["processing_ms"],
            detections=result["detections"],
            cocoons=result["cocoons"],
            grade_counts=result["grade_counts"],
            batch_grade=result["batch_grade"],           # ← NEW
            total_estimated_price=result["total_estimated_price"],
            segmented_image=result["segmented_image"],
            success=result["success"],
        )

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the image: {str(err)}",
        )