from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.api.auth import router as auth_router
from backend.app.api.screenings import router as screenings_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.health import router as health_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        f"{settings.DESCRIPTION} | Smart India Hackathon (SIH) 2026 Problem Statement {settings.SIH_PROBLEM_STATEMENT}.\n"
        "Decision-support system for automated diabetic retinopathy grading, optical adequacy validation, "
        "Grad-CAM explainability, and tele-ophthalmology throughput simulation."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for stored images, Grad-CAM overlays, and reports
app.mount(
    f"{settings.API_PREFIX}/storage",
    StaticFiles(directory=str(settings.STORAGE_DIR)),
    name="storage"
)

# Include Routers
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(screenings_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router, prefix=settings.API_PREFIX)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred in the screening platform.",
            "details": str(exc) if settings.DEBUG else None
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
