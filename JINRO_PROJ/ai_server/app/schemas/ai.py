from pydantic import BaseModel, EmailStr, field_validator
from typing import Dict, Any, List

class VideoAnalyze(BaseModel):
    video_path: str