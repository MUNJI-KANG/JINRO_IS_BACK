from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.schema_models import Counselor, Category
from app.schemas import counselor
from pydantic import BaseModel

router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===============================
# 🔹 카테고리 관련 API (위에 배치)
# ===============================

# 카테고리 저장
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


# 카테고리 전체 조회
@router.get("/category")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()

    result = []
    for cat in categories:
        result.append({
            "c_id": cat.c_id,
            "title": cat.title,
            "url": cat.url,
            "kind": cat.kind,
            "survey": cat.survey
        })

    return {"success": True, "data": result}


# ===============================
# 🔹 상담사 관련 API
# ===============================

# 상담사 로그인
@router.post("/login")
def login(request: counselor.CounselorLoginRequest, db: Session = Depends(get_db)):
    counselor_obj = db.query(Counselor).filter(
        Counselor.login_id == request.login_id
    ).first()

    if not counselor_obj:
        return {"success": False, "message": "존재하지 않는 아이디입니다."}

    if counselor_obj.pw != request.pw:
        return {"success": False, "message": "비밀번호가 일치하지 않습니다."}

    if counselor_obj.active_yn != 'Y':
        return {"success": False, "message": "비활성화된 계정입니다."}

    return {
        "success": True,
        "message": f"{counselor_obj.name}님 환영합니다!",
        "name": counselor_obj.name,
        "counselor_id": counselor_obj.counselor_id
    }


# 상담사 정보 수정
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


# 상담사 정보 조회 (🔥 맨 아래)
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