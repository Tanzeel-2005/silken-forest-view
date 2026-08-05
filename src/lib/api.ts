export interface BackendDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
}

export interface BackendAnalyzeResponse {
  count: number;
  average_confidence: number;
  processing_ms: number;
  detections: BackendDetection[];
  segmented_image: string;
  success: boolean;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "https://silken-forest-api.onrender.com";

/**
 * Sends an uploaded tray image file to the FastAPI backend POST /api/analyze endpoint.
 */
export async function analyzeCocoonTrayImage(file: File): Promise<BackendAnalyzeResponse> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = `Server returned status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errorDetail);
    }

    const data: BackendAnalyzeResponse = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "TypeError" || err.message.includes("Failed to fetch")) {
        throw new Error(
          `Unable to connect to the backend at ${API_BASE_URL}.`
        );
      }
      throw err;
    }
    throw new Error("An unexpected network error occurred.");
  }
}
