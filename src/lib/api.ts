export interface BackendDetection {
  class: string;
  confidence: number;
  quality_class?: "normal" | "fugongiya" | "sunken" | "surface_defect" | "unclassified";
  quality_confidence?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
}

export interface ClassStat {
  count: number;
  percentage: number;
}
export interface QualityBreakdown {
  normal: ClassStat;
  fugongiya: ClassStat;
  sunken: ClassStat;
  surface_defect: ClassStat;
  unclassified: ClassStat;
}
export interface GradeEstimate {
  grade: string;
  grade_code: string;
  estimated_price_demo: number;
  currency: string;
  disclaimer: string;
}
export interface SegmentResponse {
  analysis_id: string;
  count: number;
  average_confidence: number;
  processing_ms: number;
  detections: BackendDetection[];
  segmented_image: string;
  success: boolean;
}
export interface BackendAnalyzeResponse extends SegmentResponse {
  quality_breakdown: QualityBreakdown;
  classification_success_rate: number;
  grade_estimate: GradeEstimate;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, init);
    if (!response.ok) {
      let detail = `Server returned status ${response.status}`;
      try {
        const data = await response.json();
        detail = data.detail || detail;
      } catch {
        /* response was not JSON */
      }
      throw new Error(detail);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TypeError" || error.message.includes("Failed to fetch"))
    ) {
      throw new Error(
        `Unable to connect to the backend at ${API_BASE_URL}. Ensure the FastAPI server is running.`,
      );
    }
    throw error;
  }
}

/** Stage 1. YOLOv11 is the only counting authority. */
export function segmentCocoonTrayImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  return request<SegmentResponse>("/api/segment", { method: "POST", body: form });
}

/** Stage 2. ResNet18 receives exactly the stored YOLO mask-isolated crops. */
export function classifySegmentedCocoons(analysisId: string) {
  return request<BackendAnalyzeResponse>(`/api/classify/${encodeURIComponent(analysisId)}`, {
    method: "POST",
  });
}

/** Legacy compatibility API for integrations still using one request. */
export function analyzeCocoonTrayImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  return request<BackendAnalyzeResponse>("/api/analyze", { method: "POST", body: form });
}
