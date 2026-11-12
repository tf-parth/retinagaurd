import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="public", nullable=False)  # "public", "healthcare_professional", "admin"
    facility_name = Column(String(255), nullable=True)  # e.g., Primary Health Centre (PHC) / Community Health Centre (CHC)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    screenings = relationship("ScreeningCase", back_populates="user")
    audit_logs = relationship("AuditEvent", back_populates="user")

class ScreeningCase(Base):
    __tablename__ = "screening_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    patient_ref = Column(String(100), nullable=True, index=True)  # Pseudonymous patient ID or token
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(20), nullable=True)
    eye_laterality = Column(String(10), nullable=True) # "OD" (Right), "OS" (Left), "OU"
    screening_mode = Column(String(30), default="public")  # "public", "professional"
    
    # Processing pipeline status
    status = Column(String(50), default="PENDING", index=True)  # PENDING, PROCESSING, COMPLETED, QUALITY_REJECTED, ERROR
    error_message = Column(Text, nullable=True)
    
    # Image storage references (relative paths or object URIs)
    original_image_name = Column(String(255), nullable=False)
    original_image_path = Column(String(500), nullable=False)
    processed_image_path = Column(String(500), nullable=True)
    gradcam_image_path = Column(String(500), nullable=True)
    report_pdf_path = Column(String(500), nullable=True)
    
    # Image Quality Assessment
    quality_status = Column(String(50), nullable=True)  # "GOOD", "BORDERLINE", "UNGRADEABLE"
    quality_score = Column(Float, nullable=True)        # 0.0 to 1.0 composite usability
    quality_metrics = Column(JSON, nullable=True)       # {focus_score, illumination_score, coverage_ratio, dimensions}
    quality_feedback = Column(JSON, nullable=True)      # List of user-facing feedback strings
    
    # DR Classification (0: No DR, 1: Mild NPDR, 2: Moderate NPDR, 3: Severe NPDR, 4: Proliferative DR)
    predicted_grade = Column(Integer, nullable=True, index=True)
    grade_name = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    class_scores = Column(JSON, nullable=True)          # Dict of class index to probability
    referable_dr = Column(Boolean, nullable=True, index=True)  # True if grade >= 2
    
    # Clinical and Explainability Decision Support
    plain_language_summary = Column(Text, nullable=True)
    clinical_recommendation = Column(Text, nullable=True)
    model_version = Column(String(50), default="EfficientNet-B0-v1.0")
    notes = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="screenings")
    lesion_findings = relationship("LesionFinding", back_populates="screening", cascade="all, delete-orphan")

class LesionFinding(Base):
    __tablename__ = "lesion_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screening_cases.id"), nullable=False, index=True)
    lesion_type = Column(String(100), nullable=False)  # "optic_disc", "fovea", "microaneurysms", "exudates", "hemorrhages", "neovascularization"
    status = Column(String(50), default="UNAVAILABLE") # "AVAILABLE", "EXPERIMENTAL", "UNAVAILABLE"
    detected = Column(Boolean, nullable=True)
    confidence = Column(Float, nullable=True)
    mask_path = Column(String(500), nullable=True)
    clinical_description = Column(Text, nullable=True)
    metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    screening = relationship("ScreeningCase", back_populates="lesion_findings")

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False, unique=True)
    architecture = Column(String(100), nullable=False)
    input_resolution = Column(String(20), default="224x224")
    training_dataset = Column(String(255), nullable=False)
    val_accuracy = Column(Float, nullable=True)
    val_sensitivity_referable = Column(Float, nullable=True)
    val_specificity_referable = Column(Float, nullable=True)
    weights_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # "LOGIN", "UPLOAD_SCREENING", "VIEW_CASE", "EXPORT_REPORT"
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
