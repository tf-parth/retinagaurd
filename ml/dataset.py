import os
from pathlib import Path
from typing import Tuple, Optional, Callable
from PIL import Image
import pandas as pd
import numpy as np

class FundusDRDataset:
    """
    Dataset loader for Diabetic Retinopathy datasets (APTOS 2019, IDRiD, Messidor-2).
    Enforces patient-level splitting to prevent data leakage across left/right eyes.
    """

    def __init__(
        self,
        csv_file: Path,
        image_dir: Path,
        transform: Optional[Callable] = None,
        image_col: str = "id_code",
        label_col: str = "diagnosis"
    ):
        self.df = pd.read_csv(csv_file)
        self.image_dir = Path(image_dir)
        self.transform = transform
        self.image_col = image_col
        self.label_col = label_col

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[Any, int]:
        row = self.df.iloc[idx]
        img_name = str(row[self.image_col])
        if not (img_name.endswith(".png") or img_name.endswith(".jpg")):
            # Check file presence
            img_path = self.image_dir / f"{img_name}.png"
            if not img_path.exists():
                img_path = self.image_dir / f"{img_name}.jpg"
        else:
            img_path = self.image_dir / img_name

        image = Image.open(img_path).convert("RGB")
        label = int(row[self.label_col])

        if self.transform:
            image = self.transform(image)

        return image, label

def split_patient_groups(df: pd.DataFrame, patient_col: str = "patient_id", test_size: float = 0.20, random_state: int = 42):
    """
    Groups by patient ID so that OD (right) and OS (left) images of the same individual
    always reside in either the training set or the test set, NEVER split across both.
    """
    unique_patients = df[patient_col].unique()
    np.random.seed(random_state)
    np.random.shuffle(unique_patients)

    n_test = int(len(unique_patients) * test_size)
    test_patients = set(unique_patients[:n_test])

    train_df = df[~df[patient_col].isin(test_patients)].reset_index(drop=True)
    test_df = df[df[patient_col].isin(test_patients)].reset_index(drop=True)

    return train_df, test_df
