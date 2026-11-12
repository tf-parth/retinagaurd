export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'public' | 'healthcare_professional' | 'admin';
  facility_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface QualityMetrics {
  focus_laplacian_var: number;
  illumination_mean: number;
  illumination_std: number;
  coverage_ratio: number;
  resolution_width: number;
  resolution_height: number;
  is_blurry: boolean;
  is_underexposed: boolean;
  is_overexposed: boolean;
}

export interface LesionFinding {
  id: string;
  lesion_type: string;
  status: 'AVAILABLE' | 'EXPERIMENTAL' | 'UNAVAILABLE';
  detected?: boolean | null;
  confidence?: number | null;
  mask_path?: string | null;
  clinical_description?: string | null;
  metrics?: Record<string, any> | null;
}

export interface ScreeningCase {
  id: string;
  patient_ref?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  eye_laterality?: string | null;
  screening_mode: 'public' | 'professional';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'QUALITY_REJECTED' | 'ERROR';
  quality_status?: 'GOOD' | 'BORDERLINE' | 'UNGRADEABLE' | null;
  quality_score?: number | null;
  quality_metrics?: QualityMetrics | null;
  quality_feedback?: string[] | null;
  predicted_grade?: number | null;
  grade_name?: string | null;
  confidence?: number | null;
  class_scores?: Record<string, number> | null;
  referable_dr?: boolean | null;
  plain_language_summary?: string | null;
  clinical_recommendation?: string | null;
  model_version?: string | null;
  original_image_url: string;
  processed_image_url?: string | null;
  gradcam_image_url?: string | null;
  report_pdf_url?: string | null;
  created_at: string;
  updated_at?: string | null;
  lesion_findings?: LesionFinding[];
}

export interface ScreeningListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ScreeningCase[];
}

export interface SimulationParams {
  daily_patients_per_phc: number;
  num_phc_centers: number;
  network_bandwidth_kbps: number;
  avg_image_size_kb: number;
  ai_inference_time_sec: number;
  num_ophthalmologists: number;
  specialist_review_time_min: number;
  work_hours_per_day: number;
  dr_prevalence_pct: number;
}

export interface HourlyThroughputPoint {
  hour: number;
  incoming_images: number;
  ai_processed: number;
  doctor_reviewed: number;
  backlog_queue: number;
}

export interface SimulationResult {
  total_screenings_day: number;
  total_referable_cases: number;
  avg_network_upload_sec: number;
  total_ai_processing_time_min: number;
  doctor_review_capacity_cases: number;
  doctor_utilization_pct: number;
  daily_backlog_cases: number;
  turnaround_time_p95_hours: number;
  bottleneck_identified: string;
  telemedicine_readiness_score: number;
  recommendations: string[];
  hourly_projection: HourlyThroughputPoint[];
}

export interface DashboardMetrics {
  total_screenings: number;
  awaiting_review: number;
  quality_failures: number;
  referable_cases: number;
  grade_distribution: Record<string, number>;
  daily_volume: { date: string; screenings: number }[];
  recent_screenings: ScreeningCase[];
}
