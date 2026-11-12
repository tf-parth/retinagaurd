import os
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import ScreeningCase, LesionFinding, AuditEvent, User
from backend.app.schemas import (
    ScreeningResponse,
    ScreeningDetailResponse,
    ScreeningListResponse,
    GradCamExplanationResponse,
    LesionFindingResponse
)
from backend.app.services.auth_service import get_current_user_optional, require_healthcare_professional
from backend.app.services.storage_service import storage_service
from backend.app.services.quality_service import quality_service
from backend.app.services.preprocessing_service import preprocessing_service
from backend.app.services.classifier_service import classifier_service
from backend.app.services.explainability_service import explainability_service
from backend.app.services.lesion_service import lesion_service
from backend.app.services.report_service import report_service

router = APIRouter(prefix="/screenings", tags=["Screenings"])

def map_case_to_response(case: ScreeningCase) -> ScreeningResponse:
    return ScreeningResponse(
        id=case.id,
        patient_ref=case.patient_ref,
        patient_age=case.patient_age,
        patient_gender=case.patient_gender,
        eye_laterality=case.eye_laterality,
        screening_mode=case.screening_mode,
        status=case.status,
        quality_status=case.quality_status,
        quality_score=case.quality_score,
        quality_metrics=case.quality_metrics,
        quality_feedback=case.quality_feedback,
        predicted_grade=case.predicted_grade,
        grade_name=case.grade_name,
        confidence=case.confidence,
        class_scores=case.class_scores,
        referable_dr=case.referable_dr,
        plain_language_summary=case.plain_language_summary,
        clinical_recommendation=case.clinical_recommendation,
        model_version=case.model_version,
        original_image_url=storage_service.get_public_url(case.original_image_path),
        processed_image_url=storage_service.get_public_url(case.processed_image_path) if case.processed_image_path else None,
        gradcam_image_url=storage_service.get_public_url(case.gradcam_image_path) if case.gradcam_image_path else None,
        report_pdf_url=storage_service.get_public_url(case.report_pdf_path) if case.report_pdf_path else None,
        created_at=case.created_at,
        updated_at=case.updated_at
    )

@router.post("", response_model=ScreeningDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    file: UploadFile = File(...),
    patient_ref: Optional[str] = Form(None),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    eye_laterality: Optional[str] = Form("OD"),
    screening_mode: Optional[str] = Form("public"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    End-to-End AI Diabetic Retinopathy Screening Pipeline:
    1. Safe file ingestion & validation
    2. Measurable optical quality assessment
    3. Quality gateway (rejection if ungradeable)
    4. Standardization and CLAHE preprocessing
    5. EfficientNet-B0 five-class DR inference
    6. Grad-CAM visual explainability heatmap overlay
    7. Retinal structure and lesion module analysis
    8. Clinical PDF report generation
    """
    user_id = current_user.id if current_user else None

    # Step 1: Ingestion
    file_id, original_abs_path, original_filename = storage_service.secure_save_upload(file)
    original_rel_path = f"original/{original_abs_path.name}"

    # Initialize Case in DB
    screening_case = ScreeningCase(
        id=file_id,
        user_id=user_id,
        patient_ref=patient_ref,
        patient_age=patient_age,
        patient_gender=patient_gender,
        eye_laterality=eye_laterality,
        screening_mode=screening_mode,
        status="PROCESSING",
        original_image_name=original_filename,
        original_image_path=original_rel_path,
        model_version=classifier_service.model_version
    )
    db.add(screening_case)
    db.commit()

    # Step 2: Quality Assessment
    quality_result = quality_service.assess_image(original_abs_path)
    screening_case.quality_status = quality_result.quality_status
    screening_case.quality_score = quality_result.quality_score
    screening_case.quality_metrics = quality_result.metrics.model_dump()
    screening_case.quality_feedback = quality_result.feedback

    # Step 3: Quality Gateway
    if not quality_result.can_proceed:
        screening_case.status = "QUALITY_REJECTED"
        screening_case.plain_language_summary = (
            "The uploaded retinal photo does not have sufficient clarity, focus, or lighting for reliable screening. "
            f"Guidance: {quality_result.recapture_guidance or 'Please recapture in a steady, dimly lit setting.'}"
        )
        screening_case.clinical_recommendation = (
            "Ungradeable fundus photograph. Repeat photography recommended following pupil dilation or diopter focus correction."
        )
        db.commit()
        db.refresh(screening_case)
        
        resp_data = map_case_to_response(screening_case)
        return ScreeningDetailResponse(**resp_data.model_dump(), lesion_findings=[])

    # Step 4: Preprocessing
    processed_filename = f"prep_{file_id}.png"
    try:
        processed_path, preprocessed_rgb, prep_meta = preprocessing_service.preprocess_image(
            original_abs_path,
            processed_filename
        )
        screening_case.processed_image_path = f"processed/{processed_filename}"
    except Exception as e:
        screening_case.status = "ERROR"
        screening_case.error_message = f"Preprocessing failure: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Image preprocessing failed: {str(e)}")

    # Step 5: DR Classification (EfficientNet-B0)
    pred_result = classifier_service.predict(preprocessed_rgb)
    screening_case.predicted_grade = pred_result["predicted_grade"]
    screening_case.grade_name = pred_result["grade_name"]
    screening_case.confidence = pred_result["confidence"]
    screening_case.class_scores = pred_result["class_scores"]
    screening_case.referable_dr = pred_result["referable_dr"]
    screening_case.plain_language_summary = pred_result["plain_language_summary"]
    screening_case.clinical_recommendation = pred_result["clinical_recommendation"]

    # Step 6: Grad-CAM Explainability
    try:
        gradcam_filename = f"gradcam_{file_id}.png"
        overlay_path, heatmap_path, grad_meta = explainability_service.generate_gradcam(
            original_abs_path,
            preprocessed_rgb,
            pred_result["predicted_grade"],
            gradcam_filename,
            classifier_service
        )
        screening_case.gradcam_image_path = f"gradcam/{overlay_path.name}"
    except Exception as e:
        print(f"[GradCAM Generation Notice] {e}")
        screening_case.gradcam_image_path = None

    # Step 7: Retinal structures & lesions
    lesion_results = lesion_service.analyze_structures_and_lesions(original_abs_path, file_id)
    lesion_entities = []
    for item in lesion_results:
        lf = LesionFinding(
            screening_id=file_id,
            lesion_type=item["lesion_type"],
            status=item["status"],
            detected=item["detected"],
            confidence=item["confidence"],
            mask_path=item["mask_path"],
            clinical_description=item["clinical_description"],
            metrics=item["metrics"]
        )
        db.add(lf)
        lesion_entities.append(lf)

    # Step 8: PDF Report Generation
    try:
        report_filename = f"report_{file_id}.pdf"
        report_path = report_service.generate_pdf_report(screening_case, report_filename)
        screening_case.report_pdf_path = f"reports/{report_filename}"
    except Exception as e:
        print(f"[Report Generation Notice] {e}")
        screening_case.report_pdf_path = None

    screening_case.status = "COMPLETED"
    
    # Audit log
    audit = AuditEvent(
        user_id=user_id,
        action="SCREENING_COMPLETED",
        resource_type="SCREENING",
        resource_id=file_id,
        details={
            "predicted_grade": screening_case.predicted_grade,
            "referable": screening_case.referable_dr,
            "quality": screening_case.quality_status
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(screening_case)

    base_response = map_case_to_response(screening_case)
    lesion_responses = [
        LesionFindingResponse(
            id=lf.id,
            lesion_type=lf.lesion_type,
            status=lf.status,
            detected=lf.detected,
            confidence=lf.confidence,
            mask_path=storage_service.get_public_url(lf.mask_path) if lf.mask_path else None,
            clinical_description=lf.clinical_description,
            metrics=lf.metrics
        )
        for lf in lesion_entities
    ]

    return ScreeningDetailResponse(**base_response.model_dump(), lesion_findings=lesion_responses)

@router.get("", response_model=ScreeningListResponse)
def list_screenings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    referable_only: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(ScreeningCase)

    # If public user, restrict to their own screenings; if healthcare professional, show all
    if current_user and current_user.role not in ("healthcare_professional", "admin"):
        query = query.filter(ScreeningCase.user_id == current_user.id)
    elif not current_user:
        # Public unauthenticated listing only returns recent public sessions
        query = query.filter(ScreeningCase.screening_mode == "public")

    if status:
        query = query.filter(ScreeningCase.status == status)
    if referable_only is not None:
        query = query.filter(ScreeningCase.referable_dr == referable_only)
    if search:
        query = query.filter(
            (ScreeningCase.patient_ref.ilike(f"%{search}%")) |
            (ScreeningCase.original_image_name.ilike(f"%{search}%")) |
            (ScreeningCase.id.ilike(f"%{search}%"))
        )

    total = query.count()
    items = query.order_by(ScreeningCase.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return ScreeningListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[map_case_to_response(item) for item in items]
    )

@router.get("/{screening_id}", response_model=ScreeningDetailResponse)
def get_screening_detail(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    case = db.query(ScreeningCase).filter(ScreeningCase.id == screening_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Screening record not found.")

    base_response = map_case_to_response(case)
    lesions = db.query(LesionFinding).filter(LesionFinding.screening_id == screening_id).all()
    lesion_responses = [
        LesionFindingResponse(
            id=lf.id,
            lesion_type=lf.lesion_type,
            status=lf.status,
            detected=lf.detected,
            confidence=lf.confidence,
            mask_path=storage_service.get_public_url(lf.mask_path) if lf.mask_path else None,
            clinical_description=lf.clinical_description,
            metrics=lf.metrics
        )
        for lf in lesions
    ]

    return ScreeningDetailResponse(**base_response.model_dump(), lesion_findings=lesion_responses)

@router.get("/{screening_id}/explanation", response_model=GradCamExplanationResponse)
def get_screening_explanation(
    screening_id: str,
    db: Session = Depends(get_db)
):
    case = db.query(ScreeningCase).filter(ScreeningCase.id == screening_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Screening record not found.")

    if not case.gradcam_image_path:
        raise HTTPException(status_code=404, detail="Grad-CAM visualization not available for this case.")

    return GradCamExplanationResponse(
        screening_id=case.id,
        predicted_grade=case.predicted_grade or 0,
        grade_name=case.grade_name or "Unknown",
        confidence=case.confidence or 0.0,
        heatmap_url=storage_service.get_public_url(case.gradcam_image_path),
        overlay_url=storage_service.get_public_url(case.gradcam_image_path),
        target_layer="EfficientNet-B0 final convolutional stage",
        explanation_text=(
            "The Grad-CAM overlay displays convolutional feature saliency. Warm red and yellow regions indicate "
            "where deep neural activations most strongly influenced the diabetic retinopathy classification score."
        ),
        medical_interpretation_caveat=(
            "Grad-CAM represents model attention rather than clinical lesion segmentation. "
            "It must not be interpreted as definitive microvascular pathology boundaries."
        )
    )

@router.get("/{screening_id}/report")
def download_screening_report(
    screening_id: str,
    db: Session = Depends(get_db)
):
    case = db.query(ScreeningCase).filter(ScreeningCase.id == screening_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Screening record not found.")

    if not case.report_pdf_path:
        # Generate on demand if missing
        try:
            report_filename = f"report_{case.id}.pdf"
            report_service.generate_pdf_report(case, report_filename)
            case.report_pdf_path = f"reports/{report_filename}"
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate report PDF: {str(e)}")

    abs_report_path = (settings.STORAGE_DIR / "reports" / Path(case.report_pdf_path).name).resolve()
    if not abs_report_path.exists():
        raise HTTPException(status_code=404, detail="Report PDF file not found on disk.")

    return FileResponse(
        path=str(abs_report_path),
        filename=f"RetinaGuard_Report_{case.id[:8]}.pdf",
        media_type="application/pdf"
    )
