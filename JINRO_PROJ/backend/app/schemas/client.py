from pydantic import BaseModel, EmailStr, field_validator
from typing import Dict, Any, List
import re

class ClientCreate(BaseModel):
    name: str
    birthdate: str  # 주민번호 7자리 (숫자만)
    phone_num: str  # 핸드폰 11자리 (숫자만)
    email: str      # 전체 이메일 주소

    @field_validator('birthdate')
    def validate_ssn(cls, v):
        # 숫자만 추출하고 7자리인지 확인
        clean_v = re.sub(r'[^0-9]', '', v)
        if len(clean_v) != 7:
            raise ValueError('주민등록번호는 숫자 7자리여야 합니다.')
        return clean_v

    @field_validator('phone_num')
    def validate_phone(cls, v):
        # 숫자만 추출하고 11자리인지 확인
        clean_v = re.sub(r'[^0-9]', '', v)
        if len(clean_v) != 11:
            raise ValueError('핸드폰 번호는 숫자 11자리여야 합니다.')
        return clean_v

class SurveySubmitRequest(BaseModel):
    counseling_id: int
    category: str
    url: str
    answer: Dict[str, Any]

class SelectedVideo(BaseModel):
    id: str             

class CounselingCreateRequest(BaseModel):
    videos: List[SelectedVideo]

class ReportCompleteRequest(BaseModel):
    counseling_id: int
    report_id: int
    answer: Dict[str, Any]
