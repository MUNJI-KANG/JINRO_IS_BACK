from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.schema_models import Counselor # 모델 임포트 (경로 확인해주세요)

router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])

# DB 세션을 가져오는 의존성 주입 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CounselorLoginRequest(BaseModel):
    login_id: str
    pw: str

@router.post("/login")
def login(request: CounselorLoginRequest, db: Session = Depends(get_db)):
    counselor = db.query(Counselor).filter(
        Counselor.login_id == request.login_id,
        Counselor.pw == request.pw
    ).first()

    if counselor:
        # 로그인 성공
        return {"success": True, "message": f"{counselor.name}님 환영합니다!", "name": counselor.name}
    else:
        # 로그인 실패
        return {"success": False, "message": "아이디 또는 비밀번호가 일치하지 않습니다."}