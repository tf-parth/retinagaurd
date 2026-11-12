import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env file if present
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "RetinaGuard AI"
    VERSION: str = "1.0.0"
    SIH_PROBLEM_STATEMENT: str = "26038"
    DESCRIPTION: str = "Explainable AI for Diabetic Retinopathy Screening in Rural India"
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    API_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "retinaguard-sih2026-secret-key-32chars-minimum")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Database
    # Defaults to local SQLite, or PostgreSQL URL if provided
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./retinaguard.db")
    
    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")
    STORAGE_DIR: Path = Path(os.getenv("STORAGE_DIR", str(BASE_DIR / "storage")))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))
    ALLOWED_EXTENSIONS: set = set(
        [ext.strip().lower() for ext in os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,tif,tiff").split(",")]
    )
    
    # Machine Learning & Explainability
    MODEL_ARCHITECTURE: str = os.getenv("MODEL_ARCHITECTURE", "efficientnet_b0")
    MODEL_WEIGHTS_PATH: Path = Path(os.getenv("MODEL_WEIGHTS_PATH", str(BASE_DIR / "ml" / "weights" / "retinaguard_efficientnet_b0.pth")))
    MODEL_DEVICE: str = os.getenv("MODEL_DEVICE", "cpu")
    ENABLE_GRADCAM: bool = os.getenv("ENABLE_GRADCAM", "True").lower() in ("true", "1", "yes")
    
    # Screening Thresholds
    # Levels: 0=No DR, 1=Mild NPDR, 2=Moderate NPDR, 3=Severe NPDR, 4=Proliferative DR
    # Referable DR is typically Moderate NPDR or worse (Levels 2-4)
    REFERABLE_THRESHOLD_GRADE: int = 2
    CONFIDENCE_THRESHOLD_REFERABLE: float = float(os.getenv("CONFIDENCE_THRESHOLD_REFERABLE", "0.50"))
    
    # CORS
    CORS_ORIGINS: list = [
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    ]

settings = Settings()

# Ensure storage directories exist
for subdir in ["original", "processed", "gradcam", "reports", "masks"]:
    (settings.STORAGE_DIR / subdir).mkdir(parents=True, exist_ok=True)
