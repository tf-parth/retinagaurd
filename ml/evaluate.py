import os
import time
from pathlib import Path
from typing import Dict, Any, List
import numpy as np

def compute_screening_metrics(y_true: List[int], y_pred: List[int], y_scores: List[float], referable_threshold: int = 2) -> Dict[str, Any]:
    """
    Computes clinical screening metrics for Diabetic Retinopathy:
    - Referable DR Sensitivity (target: >90% per SIH 2026 specifications)
    - Referable DR Specificity (target: >85% per SIH 2026 specifications)
    - Precision, Recall, F1-Score
    - 5x5 Confusion Matrix
    """
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    
    # Binary conversion for referable classification (Grade >= 2)
    binary_true = (y_true >= referable_threshold).astype(int)
    binary_pred = (y_pred >= referable_threshold).astype(int)

    tp = int(np.sum((binary_true == 1) & (binary_pred == 1)))
    fp = int(np.sum((binary_true == 0) & (binary_pred == 1)))
    tn = int(np.sum((binary_true == 0) & (binary_pred == 0)))
    fn = int(np.sum((binary_true == 1) & (binary_pred == 0)))

    sensitivity = tp / max(tp + fn, 1)
    specificity = tn / max(tn + fp, 1)
    precision = tp / max(tp + fp, 1)
    f1 = 2 * (precision * sensitivity) / max(precision + sensitivity, 1e-6)
    accuracy = (tp + tn) / max(len(binary_true), 1)

    # 5-class confusion matrix
    conf_matrix = np.zeros((5, 5), dtype=int)
    for t, p in zip(y_true, y_pred):
        if 0 <= t < 5 and 0 <= p < 5:
            conf_matrix[t, p] += 1

    return {
        "referable_sensitivity": round(float(sensitivity), 4),
        "referable_specificity": round(float(specificity), 4),
        "precision": round(float(precision), 4),
        "f1_score": round(float(f1), 4),
        "overall_accuracy": round(float(accuracy), 4),
        "confusion_matrix_5class": conf_matrix.tolist(),
        "sih_sensitivity_target_met": bool(sensitivity >= 0.90),
        "sih_specificity_target_met": bool(specificity >= 0.85)
    }

if __name__ == "__main__":
    print("RetinaGuard AI Clinical Metric Evaluator")
    # Demonstration benchmark calculation
    sample_true = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]
    sample_pred = [0, 0, 1, 2, 2, 2, 3, 3, 4, 4]
    sample_scores = [0.1, 0.1, 0.3, 0.6, 0.8, 0.85, 0.92, 0.95, 0.98, 0.99]
    metrics = compute_screening_metrics(sample_true, sample_pred, sample_scores)
    print(metrics)
