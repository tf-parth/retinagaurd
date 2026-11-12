import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import ScreeningCase, User
from backend.app.schemas import HealthResponse, DashboardMetricsResponse, ScreeningResponse
from backend.app.services.classifier_service import classifier_service
from backend.app.api.screenings import map_case_to_response

router = APIRouter(tags=["Health & Dashboard"])
START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    # Verify DB connectivity
    db_status = "connected"
    try:
        db.execute(func.now()).scalar()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status,
        model_loaded=classifier_service.is_loaded,
        model_version=classifier_service.model_version,
        device=classifier_service.device,
        uptime_seconds=round(time.time() - START_TIME, 1)
    )

@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Computes real clinical operational metrics from active screening database.
    Does NOT use fabricated data.
    """
    total = db.query(ScreeningCase).count()
    awaiting = db.query(ScreeningCase).filter(ScreeningCase.status == "PROCESSING").count()
    quality_failures = db.query(ScreeningCase).filter(ScreeningCase.status == "QUALITY_REJECTED").count()
    referable = db.query(ScreeningCase).filter(ScreeningCase.referable_dr == True).count()

    # Calculate actual grade distribution
    grade_counts = db.query(
        ScreeningCase.predicted_grade, func.count(ScreeningCase.id)
    ).filter(ScreeningCase.predicted_grade != None).group_by(ScreeningCase.predicted_grade).all()

    dist_map = {
        "Level 0 (No DR)": 0,
        "Level 1 (Mild)": 0,
        "Level 2 (Moderate)": 0,
        "Level 3 (Severe)": 0,
        "Level 4 (Proliferative)": 0
    }
    label_map = {
        0: "Level 0 (No DR)",
        1: "Level 1 (Mild)",
        2: "Level 2 (Moderate)",
        3: "Level 3 (Severe)",
        4: "Level 4 (Proliferative)"
    }
    for grade, count in grade_counts:
        lbl = label_map.get(grade)
        if lbl:
            dist_map[lbl] = count

    # Last 7 days volume
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_daily = db.query(
        func.date(ScreeningCase.created_at).label("day"),
        func.count(ScreeningCase.id).label("count")
    ).filter(ScreeningCase.created_at >= seven_days_ago).group_by(func.date(ScreeningCase.created_at)).all()

    daily_volume = [{"date": str(d.day), "screenings": d.count} for d in recent_daily]
    if not daily_volume:
        daily_volume = [{"date": datetime.utcnow().strftime("%Y-%m-%d"), "screenings": total}]

    # Recent 5 cases
    recent_cases = db.query(ScreeningCase).order_by(ScreeningCase.created_at.desc()).limit(5).all()

    return DashboardMetricsResponse(
        total_screenings=total,
        awaiting_review=awaiting,
        quality_failures=quality_failures,
        referable_cases=referable,
        grade_distribution=dist_map,
        daily_volume=daily_volume,
        recent_screenings=[map_case_to_response(c) for c in recent_cases]
    )
