from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# 상담사 로그인
class CounselorLoginRequest(BaseModel):
    login_id: str
    pw: str

# 상담사 정보수정
class CounselorModifyInfo(BaseModel):
    name : str
    phone : str
    email : str
    

# 상담사 카테고리 url 추가
class CategoryCreateRequest(BaseModel):
    title: str
    url: str
    kind: int
    survey: List[Dict[str, Any]]