from pydantic import BaseModel
from typing import Dict, Any, List

class ClientCreate(BaseModel):
    name: str
    birthdate: str  # 프론트엔드의 ssn(주민번호 7자리) 매핑
    phone_num: str  # 프론트엔드의 phone 매핑
    email: str

class SurveySubmitRequest(BaseModel):
    counseling_id: int
    category: str
    url: str
    answer: Dict[str, Any]

class SelectedVideo(BaseModel):
    id: str             # video.c_id (DB에서는 url 또는 영상 식별자로 사용)

class CounselingCreateRequest(BaseModel):
    videos: List[SelectedVideo]

