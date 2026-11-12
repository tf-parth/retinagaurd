import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

client = TestClient(app)

def create_synthetic_fundus_image(width=512, height=512, corrupt=False) -> bytes:
    """Generates a test PNG image byte buffer"""
    if corrupt:
        return b"NOT_A_VALID_IMAGE_HEADER_12345"

    img = Image.new("RGB", (width, height), color=(180, 80, 30))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["service"] == settings.PROJECT_NAME
    assert "version" in data

def test_auth_workflow():
    test_email = "test.doctor@ruralclinic.org"
    test_password = "SecurePassword123!"

    # 1. Register
    reg_payload = {
        "email": test_email,
        "password": test_password,
        "full_name": "Dr. Test Clinician",
        "role": "healthcare_professional",
        "facility_name": "Test Primary Health Centre"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code in (201, 400)  # 400 if already exists

    # 2. Login
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == test_email

def test_simulation_endpoint():
    payload = {
        "daily_patients_per_phc": 40,
        "num_phc_centers": 5,
        "network_bandwidth_kbps": 512.0,
        "avg_image_size_kb": 2200.0,
        "ai_inference_time_sec": 1.2,
        "num_ophthalmologists": 2,
        "specialist_review_time_min": 4.0,
        "work_hours_per_day": 7.0,
        "dr_prevalence_pct": 22.0
    }
    response = client.post("/api/simulation/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_screenings_day"] == 200
    assert "telemedicine_readiness_score" in data
    assert "bottleneck_identified" in data
    assert len(data["hourly_projection"]) == 8

def test_image_upload_corrupt_rejection():
    corrupt_bytes = create_synthetic_fundus_image(corrupt=True)
    files = {"file": ("corrupt.png", corrupt_bytes, "image/png")}
    response = client.post("/api/screenings", files=files)
    # Should be rejected with 400 Bad Request
    assert response.status_code == 400
    assert "corrupt" in response.json()["detail"].lower() or "unsupported" in response.json()["detail"].lower()

def test_valid_screening_pipeline_end_to_end():
    image_bytes = create_synthetic_fundus_image(512, 512)
    files = {"file": ("sample_fundus.png", image_bytes, "image/png")}
    data = {
        "patient_ref": "TEST-PATIENT-001",
        "patient_age": "55",
        "eye_laterality": "OD",
        "screening_mode": "professional"
    }
    response = client.post("/api/screenings", files=files, data=data)
    assert response.status_code == 201
    result = response.json()
    
    assert "id" in result
    screening_id = result["id"]
    assert result["status"] in ("COMPLETED", "QUALITY_REJECTED")
    assert result["quality_status"] in ("GOOD", "BORDERLINE", "UNGRADEABLE")

    if result["status"] == "COMPLETED":
        assert result["predicted_grade"] in (0, 1, 2, 3, 4)
        assert result["confidence"] is not None
        assert "0" in result["class_scores"]
        assert result["original_image_url"] is not None

        # Test Grad-CAM explanation endpoint
        grad_res = client.get(f"/api/screenings/{screening_id}/explanation")
        if grad_res.status_code == 200:
            grad_data = grad_res.json()
            assert "overlay_url" in grad_data

        # Test PDF Report Download
        report_res = client.get(f"/api/screenings/{screening_id}/report")
        assert report_res.status_code == 200
        assert report_res.headers["content-type"] == "application/pdf"
