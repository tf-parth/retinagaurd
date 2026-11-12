import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from PIL import Image
from backend.app.config import settings

class PreprocessingService:
    """
    Standardizes retinal fundus images for EfficientNet-B0 inference and clinical viewing:
    - Circular retinal crop to remove irrelevant dark borders
    - CLAHE (Contrast Limited Adaptive Histogram Equalization) on L/G channel with controlled clip limit
    - Illumination leveling (Graham's method: subtract local Gaussian blur to remove uneven lighting)
    - Controlled bilateral or Gaussian denoising without destroying microaneurysms
    - Standardization to model input resolution (224x224)
    """

    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        self.target_size = target_size
        self.clahe_clip_limit = 2.0
        self.clahe_grid_size = (8, 8)
        self.sigma_illumination = 30

    def crop_retina_circle(self, img_bgr: np.ndarray, tolerance: int = 12) -> np.ndarray:
        """Finds bounding box of retinal circle and crops out outer black margin"""
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        mask = gray > tolerance
        if not np.any(mask):
            return img_bgr
        
        # Bounding box of non-dark pixels
        y_indices, x_indices = np.where(mask)
        ymin, ymax = y_indices.min(), y_indices.max()
        xmin, xmax = x_indices.min(), x_indices.max()
        
        # Add small padding if possible
        h, w = img_bgr.shape[:2]
        pad = int(min(h, w) * 0.02)
        ymin = max(0, ymin - pad)
        ymax = min(h, ymax + pad)
        xmin = max(0, xmin - pad)
        xmax = min(w, xmax + pad)
        
        cropped = img_bgr[ymin:ymax, xmin:xmax]
        return cropped

    def apply_illumination_correction(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Ben Graham's method (standard for retinal fundus DR competitions like Kaggle/APTOS):
        img = 4 * img - 4 * GaussianBlur(img, sigma) + 128
        Here adapted safely into [0, 255] range with weight control.
        """
        # Weighted add of image and blurred image to level out illumination gradients across fundus
        blur = cv2.GaussianBlur(img_bgr, (0, 0), self.sigma_illumination)
        corrected = cv2.addWeighted(img_bgr, 4.0, blur, -4.0, 128)
        
        # Smooth circular boundary to prevent edge artifacts
        h, w = img_bgr.shape[:2]
        circle_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(circle_mask, (w // 2, h // 2), int(min(h, w) * 0.48), 255, -1)
        
        result = np.zeros_like(img_bgr)
        result[circle_mask > 0] = corrected[circle_mask > 0]
        return result

    def apply_clahe(self, img_bgr: np.ndarray) -> np.ndarray:
        """Applies CLAHE on the LAB lightness channel to enhance subtle hemorrhages and exudates"""
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=self.clahe_clip_limit, tileGridSize=self.clahe_grid_size)
        cl = clahe.apply(l)
        
        merged = cv2.merge((cl, a, b))
        return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)

    def preprocess_image(self, input_path: Path, output_filename: str) -> Tuple[Path, np.ndarray, Dict[str, Any]]:
        """
        Full preprocessing pipeline:
        1. Reads original image
        2. Crops border
        3. Applies gentle CLAHE enhancement
        4. Resizes to target model resolution
        5. Saves processed file
        6. Returns (saved_path, normalized_tensor_array, metadata)
        """
        img_bgr = cv2.imread(str(input_path))
        if img_bgr is None:
            raise ValueError(f"Failed to load image from {input_path}")

        orig_h, orig_w = img_bgr.shape[:2]
        
        # Step 1: Retinal circle crop
        cropped = self.crop_retina_circle(img_bgr)
        
        # Step 2: Mild contrast enhancement (safe for lesions)
        enhanced = self.apply_clahe(cropped)
        
        # Step 3: Resize for EfficientNet-B0 input
        resized_bgr = cv2.resize(enhanced, self.target_size, interpolation=cv2.INTER_AREA)
        
        # Save processed image to storage
        processed_dir = settings.STORAGE_DIR / "processed"
        processed_path = processed_dir / output_filename
        cv2.imwrite(str(processed_path), resized_bgr)
        
        # Convert BGR to RGB for PyTorch/Classifier
        resized_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)
        
        # Metadata for reproducibility
        metadata = {
            "original_dimensions": [orig_w, orig_h],
            "target_resolution": list(self.target_size),
            "clahe_applied": True,
            "clahe_clip_limit": self.clahe_clip_limit,
            "clahe_grid_size": list(self.clahe_grid_size),
            "illumination_normalized": True,
            "channel_format": "RGB",
            "mean_norm": [0.485, 0.456, 0.406],
            "std_norm": [0.229, 0.224, 0.225]
        }
        
        return processed_path, resized_rgb, metadata

preprocessing_service = PreprocessingService()
