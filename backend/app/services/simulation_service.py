import math
from typing import List, Dict, Any
from backend.app.schemas import SimulationParams, SimulationResult, HourlyThroughputPoint

class SimulationService:
    """
    SIH 2026 Problem Statement 26038:
    Operational simulation of screening throughput, rural network bandwidth,
    AI processing time, reviewer capacity, and tele-ophthalmology backlog.
    Matches the Simulink discrete-event queue model.
    """

    def run_simulation(self, params: SimulationParams) -> SimulationResult:
        # Total daily patient cohort across participating rural PHCs
        total_screenings = params.daily_patients_per_phc * params.num_phc_centers

        # 1. Network upload delay per image (KB to kbits: size * 8 / bandwidth)
        image_kbits = params.avg_image_size_kb * 8.0
        upload_time_sec = image_kbits / max(params.network_bandwidth_kbps, 1.0)

        # 2. Total AI pipeline duration per image (Image validation + Preprocessing + EfficientNet + Grad-CAM)
        ai_pipeline_sec = params.ai_inference_time_sec + 0.8  # 0.8s for CLAHE and Grad-CAM
        total_ai_processing_time_min = (total_screenings * ai_pipeline_sec) / 60.0

        # 3. Clinical referral filtering:
        # Only referable cases (moderate DR, severe DR, proliferative DR, or borderline quality)
        # require human ophthalmologist intervention. Normal (Grade 0) & Mild (Grade 1) receive automated clearance.
        referable_fraction = (params.dr_prevalence_pct / 100.0)
        total_referable_cases = int(math.ceil(total_screenings * referable_fraction))

        # 4. Specialist Review Capacity
        total_doctor_minutes = params.num_ophthalmologists * (params.work_hours_per_day * 60.0)
        doctor_capacity = int(total_doctor_minutes / max(params.specialist_review_time_min, 0.5))

        # Backlog & Utilization
        daily_backlog = max(0, total_referable_cases - doctor_capacity)
        utilization_pct = min(100.0, (total_referable_cases / max(doctor_capacity, 1)) * 100.0)

        # 5. Bottleneck Analysis
        bottlenecks = []
        if upload_time_sec > 12.0:
            bottlenecks.append(f"Network Uplink Latency ({upload_time_sec:.1f}s/image over {params.network_bandwidth_kbps:.0f} kbps)")
        if total_referable_cases > doctor_capacity:
            bottlenecks.append(f"Ophthalmologist Shortage ({total_referable_cases} referable cases vs {doctor_capacity} doctor capacity)")
        if (total_screenings * ai_pipeline_sec) > (params.work_hours_per_day * 3600.0):
            bottlenecks.append("Inference Compute Saturation (AI pipeline unable to clear real-time stream)")

        primary_bottleneck = " | ".join(bottlenecks) if bottlenecks else "Optimal Throughput (Balanced Capacity)"

        # 6. Turnaround Time P95 (hours)
        if daily_backlog > 0:
            turnaround_time_p95 = round(params.work_hours_per_day + (daily_backlog / max(doctor_capacity / params.work_hours_per_day, 1.0)), 1)
        else:
            # Average queue wait + review
            turnaround_time_p95 = round((upload_time_sec / 3600.0) + 0.5 + (params.specialist_review_time_min / 60.0), 2)

        # 7. Telemedicine Readiness Score (0 to 100)
        readiness_score = 100.0
        if upload_time_sec > 10.0:
            readiness_score -= min(30.0, (upload_time_sec - 10.0) * 2.0)
        if utilization_pct > 85.0:
            readiness_score -= min(40.0, (utilization_pct - 85.0) * 2.5)
        if daily_backlog > 0:
            readiness_score -= min(30.0, daily_backlog * 0.5)
        readiness_score = max(10.0, round(readiness_score, 1))

        # 8. Actionable Recommendations
        recommendations = []
        if upload_time_sec > 10.0:
            recommendations.append("Implement edge-side image compression or async store-and-forward batching during low-traffic windows.")
        if daily_backlog > 0:
            needed_docs = math.ceil(total_referable_cases / (total_doctor_minutes / params.num_ophthalmologists / params.specialist_review_time_min))
            recommendations.append(f"Empanel {needed_docs - params.num_ophthalmologists} additional tele-ophthalmologist(s) or triage Level 2 cases via trained optometrists.")
        if not recommendations:
            recommendations.append("Current infrastructure satisfies daily screening demand without backlog.")

        # 9. Hourly Throughput Profile (8-hour PHC shift: 9:00 AM - 5:00 PM)
        # Rural patient influx follows a bell curve peaking around hours 3-5 (11 AM - 1 PM)
        hourly_weights = [0.08, 0.16, 0.22, 0.24, 0.14, 0.08, 0.05, 0.03]
        hourly_projection: List[HourlyThroughputPoint] = []
        current_queue = 0
        doctor_hourly_capacity = int(doctor_capacity / max(params.work_hours_per_day, 1))

        for hour_idx, weight in enumerate(hourly_weights, start=1):
            incoming = int(round(total_screenings * weight))
            referable_in = int(round(incoming * referable_fraction))
            ai_processed = incoming  # AI processes in near-realtime
            
            # Doctor reviews referable cases from queue
            current_queue += referable_in
            reviewed = min(current_queue, doctor_hourly_capacity)
            current_queue -= reviewed

            hourly_projection.append(HourlyThroughputPoint(
                hour=hour_idx,
                incoming_images=incoming,
                ai_processed=ai_processed,
                doctor_reviewed=reviewed,
                backlog_queue=current_queue
            ))

        return SimulationResult(
            total_screenings_day=total_screenings,
            total_referable_cases=total_referable_cases,
            avg_network_upload_sec=round(upload_time_sec, 2),
            total_ai_processing_time_min=round(total_ai_processing_time_min, 1),
            doctor_review_capacity_cases=doctor_capacity,
            doctor_utilization_pct=round(utilization_pct, 1),
            daily_backlog_cases=daily_backlog,
            turnaround_time_p95_hours=turnaround_time_p95,
            bottleneck_identified=primary_bottleneck,
            telemedicine_readiness_score=readiness_score,
            recommendations=recommendations,
            hourly_projection=hourly_projection
        )

simulation_service = SimulationService()
