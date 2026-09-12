import os
import time
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from services.roboflow_service import RoboflowService

router = APIRouter(prefix="/api", tags=["Analysis"])
_analysis_sessions: Dict[str, Dict[str, Any]] = {}


class DetectionItem(BaseModel):
    class_name: str = Field(alias="class", default="cocoon")
    confidence: float
    quality_class: str = "unclassified"
    quality_confidence: float = 0.0
    x: float
    y: float
    width: float
    height: float
    points: List[Dict[str, float]] = []

    class Config:
        populate_by_name = True


class ClassStat(BaseModel):
    count: int
    percentage: float


class QualityBreakdownModel(BaseModel):
    normal: ClassStat
    fugongiya: ClassStat
    sunken: ClassStat
    surface_defect: ClassStat
    unclassified: ClassStat


class GradeEstimateModel(BaseModel):
    grade: str
    grade_code: str
    estimated_price_demo: float
    currency: str = "INR"
    disclaimer: str = "Demo assumption rules only — configurable project parameters"


class SegmentResponse(BaseModel):
    analysis_id: str
    count: int
    average_confidence: float
    processing_ms: float
    detections: List[Dict[str, Any]]
    segmented_image: str
    success: bool = True


class AnalyzeResponse(SegmentResponse):
    quality_breakdown: QualityBreakdownModel
    classification_success_rate: float
    grade_estimate: GradeEstimateModel


def _validate_image(image: UploadFile, contents: bytes) -> None:
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not a valid image. Please upload a JPG or PNG file.")
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")


@router.post("/segment", response_model=SegmentResponse, status_code=status.HTTP_200_OK,
             summary="Count cocoons with YOLOv11 segmentation only")
async def segment_cocoon_tray(image: UploadFile = File(...)) -> SegmentResponse:
    contents = await image.read()
    _validate_image(image, contents)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    uploads_dir, outputs_dir = os.path.join(base_dir, "uploads"), os.path.join(base_dir, "outputs")
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(outputs_dir, exist_ok=True)
    filename = image.filename or "tray.jpg"
    upload_path = os.path.join(uploads_dir, f"{int(time.time())}_{filename}")
    with open(upload_path, "wb") as file_handle:
        file_handle.write(contents)
    try:
        result = await RoboflowService.segment_image(contents, filename, outputs_dir, upload_path)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(err)}")
    analysis_id = str(uuid.uuid4())
    _analysis_sessions[analysis_id] = {"contents": contents, "filename": filename, "outputs_dir": outputs_dir, "segmentation": result}
    return SegmentResponse(analysis_id=analysis_id, **result)


@router.post("/classify/{analysis_id}", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK,
             summary="Classify exactly the YOLOv11-generated cocoon crops")
async def classify_cocoon_tray(analysis_id: str) -> AnalyzeResponse:
    session = _analysis_sessions.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="This segmentation session is unavailable. Please run counting again.")
    try:
        result = await RoboflowService.classify_detections(
            session["contents"], session["filename"], session["outputs_dir"],
            session["segmentation"]["detections"], session["segmentation"]
        )
        return AnalyzeResponse(analysis_id=analysis_id, **result)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Quality analysis failed: {str(err)}")


@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK,
             summary="Legacy combined analysis endpoint")
async def analyze_cocoon_tray(image: UploadFile = File(...)) -> AnalyzeResponse:
    """Compatibility endpoint; new clients call /segment then /classify/{analysis_id}."""
    segment = await segment_cocoon_tray(image)
    return await classify_cocoon_tray(segment.analysis_id)
