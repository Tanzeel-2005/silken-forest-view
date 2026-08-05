import os
import time
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from services.roboflow_service import RoboflowService

router = APIRouter(prefix="/api", tags=["Analysis"])


class DetectionItem(BaseModel):
    class_name: str = Field(alias="class", default="cocoon")
    confidence: float
    x: float
    y: float
    width: float
    height: float
    points: List[Dict[str, float]] = []

    class Config:
        populate_by_name = True


class AnalyzeResponse(BaseModel):
    count: int
    average_confidence: float
    processing_ms: float
    detections: List[Dict[str, Any]]
    segmented_image: str
    success: bool = True


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze tray image for silk cocoon segmentation",
    description="Receives tray image, runs Roboflow Workflow via InferenceSDK, and returns count, confidence, detections, and segmented image.",
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
        # Run inference via Roboflow Service using InferenceSDK Workflow
        result = await RoboflowService.analyze_image(
            image_bytes=contents,
            filename=image.filename or "tray.jpg",
            outputs_dir=outputs_dir,
            image_path=upload_path,
        )

        return AnalyzeResponse(
            count=result["count"],
            average_confidence=result["average_confidence"],
            processing_ms=result["processing_ms"],
            detections=result["detections"],
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
