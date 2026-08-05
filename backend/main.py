import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers.analyze import router as analyze_router

# Initialize FastAPI app
app = FastAPI(
    title="Silk Cocoon AI — Backend API",
    description="FastAPI backend powered by Roboflow Hosted Segmentation model for AI cocoon counting and analysis.",
    version="1.0.0",
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust origin whitelist for production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure required runtime directories exist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
MODELS_DIR = os.path.join(BASE_DIR, "models")

for d in [UPLOADS_DIR, OUTPUTS_DIR, MODELS_DIR]:
    os.makedirs(d, exist_ok=True)

# Mount static asset folders for direct URL access to saved images
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

# Register routers
app.include_router(analyze_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "Silk Cocoon AI — FastAPI Backend",
        "version": "1.0.0",
        "endpoint": "POST /api/analyze",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    print(f"Starting Silk Cocoon AI FastAPI server on http://{host}:{port}...")
    uvicorn.run("main:app", host=host, port=port, reload=True)
