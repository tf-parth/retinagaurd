import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from PIL import Image
from backend.app.config import settings

# Supported file signatures (magic bytes)
MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"II*\x00": "tiff",
    b"MM\x00*": "tiff",
}

class StorageService:
    def __init__(self):
        self.base_dir = Path(settings.STORAGE_DIR).resolve()
        self.max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    def validate_file_signature(self, header: bytes) -> str:
        for magic, ext in MAGIC_SIGNATURES.items():
            if header.startswith(magic):
                return ext
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported or corrupt image format. Please upload a valid JPEG, PNG, or TIFF retinal fundus image."
        )

    def secure_save_upload(self, upload_file: UploadFile) -> Tuple[str, Path, str]:
        """
        Validates and safely persists an uploaded fundus image using a randomized UUID filename.
        Returns: (file_id, absolute_path, original_filename)
        """
        original_name = Path(upload_file.filename).name  # Prevent path traversal
        file_id = str(uuid.uuid4())
        
        # Read header for signature validation
        header = upload_file.file.read(16)
        if len(header) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty or corrupted file uploaded."
            )
        
        detected_ext = self.validate_file_signature(header)
        upload_file.file.seek(0)
        
        # Check size without loading entire file in memory
        content = upload_file.file.read(self.max_size_bytes + 1)
        if len(content) > self.max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )
        
        # Verify valid image decoding
        try:
            from io import BytesIO
            img = Image.open(BytesIO(content))
            img.verify()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image decoding failed: File appears malformed or corrupted."
            )

        # Secure destination path
        safe_filename = f"{file_id}.{detected_ext}"
        destination = (self.base_dir / "original" / safe_filename).resolve()
        
        # Ensure path traversal check
        if not str(destination).startswith(str(self.base_dir)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid destination path.")

        with open(destination, "wb") as f:
            f.write(content)

        return file_id, destination, original_name

    def get_public_url(self, relative_path: str) -> str:
        """Converts storage relative path to an API media URL"""
        if not relative_path:
            return ""
        # normalize forward slashes
        clean_path = relative_path.replace("\\", "/").lstrip("/")
        return f"{settings.API_PREFIX}/storage/{clean_path}"

storage_service = StorageService()
