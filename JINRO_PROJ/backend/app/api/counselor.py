from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.schema_models import Counselor 

from app.schemas import counselor
router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login")
def login(request: counselor.CounselorLoginRequest, db: Session = Depends(get_db)):
    counselor = db.query(Counselor).filter(
        Counselor.login_id == request.login_id,
        Counselor.pw == request.pw,
        Counselor.active_yn == 'Y'
    ).first()

    if counselor:
        # 로그인 성공
        return {"success": True, "message": f"{counselor.name}님 환영합니다!", "name": counselor.name}
    else:
        # 로그인 실패
        return {"success": False, "message": "아이디 또는 비밀번호가 일치하지 않습니다."}