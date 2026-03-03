from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.schema_models import Counselor,Category 

from app.schemas import counselor
router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 상담사 로그인 
@router.post("/login")
def login(request: counselor.CounselorLoginRequest, db: Session = Depends(get_db)):
    counselor = db.query(Counselor).filter(
        Counselor.login_id == request.login_id
    ).first()

    if not counselor:
        return {"success": False, "message": "존재하지 않는 아이디입니다."}

    if counselor.pw != request.pw:
        return {"success": False, "message": "비밀번호가 일치하지 않습니다."}

    if counselor.active_yn != 'Y':
        return {"success": False, "message": "비활성화된 계정입니다."}


    if counselor:
        # 로그인 성공
        return {
            "success": True,
            "message": f"{counselor.name}님 환영합니다!",
            "name": counselor.name,
            "counselor_id": counselor.counselor_id
        }
    else:
        # 로그인 실패
        return {"success": False, "message": "아이디 또는 비밀번호가 일치하지 않습니다."}
    

# 카테고리 url 추가
@router.post("/category")
def create_or_update_category(request: counselor.CategoryCreateRequest, db: Session = Depends(get_db)):
    try:
        existing_category = db.query(Category).filter(Category.title == request.title).first()
        
        if existing_category:
            existing_category.url = request.url
            existing_category.kind = request.kind
            existing_category.survey = request.survey
        else:
            new_category = Category(
                title=request.title,
                url=request.url,
                kind=request.kind,
                survey=request.survey
            )
            db.add(new_category)
            
        db.commit()
        return {"success": True, "message": "카테고리가 성공적으로 저장되었습니다."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"저장 중 오류 발생: {str(e)}")

# 상담사 정보 수정 API 추가 
@router.put("/{counselor_id}")
def update_counselor(
    counselor_id: int,
    request: counselor.CounselorModifyInfo,
    db: Session = Depends(get_db)
):
    counselor_obj = db.query(Counselor).filter(
        Counselor.counselor_id == counselor_id
    ).first()

    if not counselor_obj:
        return {"success": False, "message": "존재하지 않는 상담사입니다."}

    counselor_obj.name = request.name
    counselor_obj.phone_num = request.phone
    counselor_obj.email = request.email

    db.commit()

    return {"success": True, "message": "회원정보가 수정되었습니다."}


# 정보 저장(?)
@router.get("/{counselor_id}")
def get_counselor(counselor_id: int, db: Session = Depends(get_db)):
    counselor_obj = db.query(Counselor).filter(
        Counselor.counselor_id == counselor_id
    ).first()

    if not counselor_obj:
        return {"success": False, "message": "존재하지 않는 상담사입니다."}

    return {
        "success": True,
        "name": counselor_obj.name,
        "phone": counselor_obj.phone_num,
        "email": counselor_obj.email
    }