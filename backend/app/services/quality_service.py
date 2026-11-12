import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from pathlib import Path
from backend.app.schemas import QualityAssessmentResult, QualityMetrics

class QualityService:
    """
    Evaluates retinal fundus image adequacy using measurable computer vision metrics:
    - Laplacian variance for focus / blur detection
    - Non-background retinal intensity distribution for illumination & exposure
    - Circular fundus field-of-view (FOV) segmentation and coverage ratio
    - Pixel resolution adequacy
    """
    
    # Established computer vision thresholds for fundus imagery
    BLUR_THRESHOLD_UNGRADEABLE = 18.0
    BLUR_THRESHOLD_BORDERLINE = 50.0
    MIN_RESOLUTION_PIXELS = 400
    RECOMMENDED_RESOLUTION = 800
    
    UNDEREXPOSED_MEAN_THRESHOLD = 30.0
    OVEREXPOSED_MEAN_THRESHOLD = 215.0
    MIN_COVERAGE_RATIO = 0.25

    def assess_image(self, image_path: Path) -> QualityAssessmentResult:
        img_bgr = cv2.imread(str(image_path))
        if img_bgr is None:
            return QualityAssessmentResult(
                quality_status="UNGRADEABLE",
                quality_score=0.0,
                metrics=QualityMetrics(
                    focus_laplacian_var=0.0,
                    illumination_mean=0.0,
                    illumination_std=0.0,
                    coverage_ratio=0.0,
                    resolution_width=0,
                    resolution_height=0,
                    is_blurry=True,
                    is_underexposed=False,
                    is_overexposed=False
                ),
                feedback=["The uploaded image could not be decoded. Please upload an intact image file."],
                recapture_guidance="Please verify the image file format and upload a readable JPEG or PNG file.",
                can_proceed=False
            )

        h, w = img_bgr.shape[:2]
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        green_channel = img_bgr[:, :, 1]  # Retinal blood vessels have highest contrast in green channel

        # 1. Focus / Sharpness via Laplacian Variance on green channel & gray
        laplacian = cv2.Laplacian(green_channel, cv2.CV_64F)
        focus_var = float(laplacian.var())
        is_blurry = focus_var < self.BLUR_THRESHOLD_BORDERLINE

        # 2. Retinal Field of View (FOV) Mask
        # Background of fundus images is typically near-black (intensity < 15)
        retina_mask = (gray > 12).astype(np.uint8)
        retina_pixel_count = int(np.sum(retina_mask))
        total_pixels = h * w
        coverage_ratio = float(retina_pixel_count / max(total_pixels, 1))

        # 3. Illumination and Exposure within Retinal Area
        if retina_pixel_count > 100:
            retina_intensities = gray[retina_mask > 0]
            illumination_mean = float(np.mean(retina_intensities))
            illumination_std = float(np.std(retina_intensities))
        else:
            illumination_mean = float(np.mean(gray))
            illumination_std = float(np.std(gray))

        is_underexposed = illumination_mean < self.UNDEREXPOSED_MEAN_THRESHOLD
        is_overexposed = illumination_mean > self.OVEREXPOSED_MEAN_THRESHOLD

        # 4. Synthesize Feedback and Classification
        feedback: List[str] = []
        recapture_tips: List[str] = []
        status = "GOOD"
        can_proceed = True

        # Check resolution
        if min(h, w) < self.MIN_RESOLUTION_PIXELS:
            status = "UNGRADEABLE"
            can_proceed = False
            feedback.append(f"Image resolution ({w}x{h}) is below the minimum required ({self.MIN_RESOLUTION_PIXELS}px).")
            recapture_tips.append("Capture with a higher resolution fundus camera setting.")

        # Check blur
        if focus_var < self.BLUR_THRESHOLD_UNGRADEABLE:
            status = "UNGRADEABLE"
            can_proceed = False
            feedback.append(f"Severe motion blur or loss of optical focus detected (Laplacian: {focus_var:.1f}).")
            recapture_tips.append("Ask patient to fixate on the internal camera target and hold the device steady.")
        elif focus_var < self.BLUR_THRESHOLD_BORDERLINE:
            if status != "UNGRADEABLE":
                status = "BORDERLINE"
            feedback.append(f"Moderate blur detected (Laplacian: {focus_var:.1f}). Controlled edge sharpening applied.")
            recapture_tips.append("Ensure optimal diopter focus adjustment before image capture.")

        # Check exposure
        if is_underexposed:
            if illumination_mean < 18.0:
                status = "UNGRADEABLE"
                can_proceed = False
                feedback.append(f"Retina is severely underexposed (mean brightness: {illumination_mean:.1f}/255).")
                recapture_tips.append("Increase illumination flash or darken the screening room to allow natural pupil dilation.")
            else:
                if status != "UNGRADEABLE":
                    status = "BORDERLINE"
                feedback.append(f"Retina is somewhat dark (mean brightness: {illumination_mean:.1f}). Contrast enhancement applied.")
        elif is_overexposed:
            if illumination_mean > 230.0:
                status = "UNGRADEABLE"
                can_proceed = False
                feedback.append("Severe glare or overexposure detected obscuring retinal details.")
                recapture_tips.append("Reposition camera angle to avoid corneal reflections.")
            else:
                if status != "UNGRADEABLE":
                    status = "BORDERLINE"
                feedback.append("High brightness/glare detected in parts of the retinal disc.")

        # Check coverage
        if coverage_ratio < self.MIN_COVERAGE_RATIO:
            status = "UNGRADEABLE"
            can_proceed = False
            feedback.append(f"Retinal coverage ({coverage_ratio*100:.1f}%) is too low to evaluate peripheral and macular zones.")
            recapture_tips.append("Re-center the fundus camera lens on the optic disc and macula.")

        # Composite Usability Score (0.0 to 1.0)
        focus_norm = min(1.0, focus_var / 150.0)
        illum_norm = 1.0 - min(1.0, abs(illumination_mean - 120.0) / 120.0)
        coverage_norm = min(1.0, coverage_ratio / 0.65)
        quality_score = round(float(0.45 * focus_norm + 0.35 * illum_norm + 0.20 * coverage_norm), 3)

        if not feedback:
            feedback.append("Image meets optical adequacy criteria for diabetic retinopathy evaluation.")

        recapture_guidance = " | ".join(recapture_tips) if recapture_tips else None

        metrics = QualityMetrics(
            focus_laplacian_var=round(focus_var, 2),
            illumination_mean=round(illumination_mean, 2),
            illumination_std=round(illumination_std, 2),
            coverage_ratio=round(coverage_ratio, 3),
            resolution_width=w,
            resolution_height=h,
            is_blurry=is_blurry,
            is_underexposed=is_underexposed,
            is_overexposed=is_overexposed
        )

        return QualityAssessmentResult(
            quality_status=status,
            quality_score=quality_score,
            metrics=metrics,
            feedback=feedback,
            recapture_guidance=recapture_guidance,
            can_proceed=can_proceed
        )

quality_service = QualityService()
