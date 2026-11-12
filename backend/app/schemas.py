from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & User Schemas -----------------
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = Field(default="public", pattern="^(public|healthcare_professional|admin)$")
    facility_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

# ----------------- Image Quality Schemas -----------------
class QualityMetrics(BaseModel):
    focus_laplacian_var: float
    illumination_mean: float
    illumination_std: float
    coverage_ratio: float
    resolution_width: int
    resolution_height: int
    is_blurry: bool
    is_underexposed: bool
    is_overexposed: bool

class QualityAssessmentResult(BaseModel):
    quality_status: str  # "GOOD", "BORDERLINE", "UNGRADEABLE"
    quality_score: float  # 0.0 to 1.0
    metrics: QualityMetrics
    feedback: List[str]
    recapture_guidance: Optional[str] = None
    can_proceed: bool

# ----------------- Lesion Finding Schemas -----------------
class LesionFindingResponse(BaseModel):
    id: str
    lesion_type: str
    status: str  # "AVAILABLE", "EXPERIMENTAL", "UNAVAILABLE"
    detected: Optional[bool] = None
    confidence: Optional[float] = None
    mask_path: Optional[str] = None
    clinical_description: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# ----------------- Screening Schemas -----------------
class ScreeningCreateMetadata(BaseModel):
    patient_ref: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    eye_laterality: Optional[str] = "OD"
    screening_mode: Optional[str] = "public"  # "public", "professional"

class ScreeningResponse(BaseModel):
    id: str
    patient_ref: Optional[str]
    patient_age: Optional[int]
    patient_gender: Optional[str]
    eye_laterality: Optional[str]
    screening_mode: str
    status: str
    quality_status: Optional[str]
    quality_score: Optional[float]
    quality_metrics: Optional[Dict[str, Any]]
    quality_feedback: Optional[List[str]]
    predicted_grade: Optional[int]
    grade_name: Optional[str]
    confidence: Optional[float]
    class_scores: Optional[Dict[str, float]]
    referable_dr: Optional[bool]
    plain_language_summary: Optional[str]
    clinical_recommendation: Optional[str]
    model_version: Optional[str]
    original_image_url: str
    processed_image_url: Optional[str]
    gradcam_image_url: Optional[str]
    report_pdf_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ScreeningDetailResponse(ScreeningResponse):
    lesion_findings: List[LesionFindingResponse] = []

class ScreeningListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ScreeningResponse]

# ----------------- Grad-CAM Schema -----------------
class GradCamExplanationResponse(BaseModel):
    screening_id: str
    predicted_grade: int
    grade_name: str
    confidence: float
    heatmap_url: str
    overlay_url: str
    target_layer: str
    explanation_text: str
    medical_interpretation_caveat: str

# ----------------- Simulink & Operations Simulation Schemas -----------------
class SimulationParams(BaseModel):
    daily_patients_per_phc: int = Field(default=35, ge=1, le=500, description="Patients screened per PHC per day")
    num_phc_centers: int = Field(default=10, ge=1, le=100, description="Number of participating rural health centers")
    network_bandwidth_kbps: float = Field(default=512.0, ge=64.0, le=100000.0, description="Uplink bandwidth in kbps (2G/3G/4G/Broadband)")
    avg_image_size_kb: float = Field(default=2200.0, ge=200.0, le=20000.0, description="Raw fundus image size in KB")
    ai_inference_time_sec: float = Field(default=1.2, ge=0.1, le=60.0, description="Edge/Server AI inference duration in seconds")
    num_ophthalmologists: int = Field(default=2, ge=1, le=50, description="Number of specialist reviewers available")
    specialist_review_time_min: float = Field(default=4.5, ge=1.0, le=30.0, description="Minutes spent per referable review")
    work_hours_per_day: float = Field(default=7.0, ge=1.0, le=16.0, description="Doctor shift hours per day")
    dr_prevalence_pct: float = Field(default=22.0, ge=1.0, le=80.0, description="Expected DR prevalence rate in diabetic cohort (%)")

class HourlyThroughputPoint(BaseModel):
    hour: int
    incoming_images: int
    ai_processed: int
    doctor_reviewed: int
    backlog_queue: int

class SimulationResult(BaseModel):
    total_screenings_day: int
    total_referable_cases: int
    avg_network_upload_sec: float
    total_ai_processing_time_min: float
    doctor_review_capacity_cases: int
    doctor_utilization_pct: float
    daily_backlog_cases: int
    turnaround_time_p95_hours: float
    bottleneck_identified: str
    telemedicine_readiness_score: float  # 0 to 100
    recommendations: List[str]
    hourly_projection: List[HourlyThroughputPoint]

# ----------------- Dashboard & Health Schemas -----------------
class DashboardMetricsResponse(BaseModel):
    total_screenings: int
    awaiting_review: int
    quality_failures: int
    referable_cases: int
    grade_distribution: Dict[str, int]
    daily_volume: List[Dict[str, Any]]
    recent_screenings: List[ScreeningResponse]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    model_loaded: bool
    model_version: str
    device: str
    uptime_seconds: float
