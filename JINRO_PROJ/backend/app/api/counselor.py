from fastapi import Request, APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.schema_models import Counselor, Category
from app.schemas import counselor
from pydantic import BaseModel
from app.models.schema_models import ReportAiV, AiVideoAnalyze, ReCommentEnum
from sqlalchemy import func
from app.models.schema_models import ReportFinal

router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.post("/login")
def login(
    login_data: counselor.CounselorLoginRequest,
    request: Request,                            
    db: Session = Depends(get_db)):

    counselor_obj = db.query(Counselor).filter(
        Counselor.login_id == login_data.login_id
    ).first()

    if not counselor_obj:
        return {"success": False, "message": "존재하지 않는 아이디입니다."}

    if counselor_obj.pw != login_data.pw:
        return {"success": False, "message": "비밀번호가 일치하지 않습니다."}

    if counselor_obj.active_yn != 'Y':
        return {"success": False, "message": "비활성화된 계정입니다."}

    request.session['counselor_id'] = counselor_obj.counselor_id
    request.session['counselor_name'] = counselor_obj.name 

    return {
        "success": True,
        "message": f"{counselor_obj.name}님 환영합니다!",
        "name": counselor_obj.name,
        "counselor_id": counselor_obj.counselor_id
    }



# ===============================
# 🔹 카테고리 API
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

        return {"success": True, "message": "카테고리 저장 완료"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# 전체 카테고리 조회
@router.get("/category")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()

    return {
        "success": True,
        "data": [
            {
                "c_id": c.c_id,
                "title": c.title,
                "url": c.url,
                "kind": c.kind,
                "survey": c.survey
            }
            for c in categories
        ]
    }


# 🔹 중분류 기준 조회
@router.get("/category/kind/{kind}")
def get_category_by_kind(kind: int, db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.kind == kind).all()

    return {
        "success": True,
        "data": [
            {
                "c_id": c.c_id,
                "title": c.title,
                "url": c.url,
                "kind": c.kind,
                "survey": c.survey
            }
            for c in categories
        ]
    }


# 🔹 카테고리 상세 조회
@router.get("/category/detail/{c_id}")
def get_category_detail(c_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.c_id == c_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    return {
        "success": True,
        "data": {
            "c_id": category.c_id,
            "title": category.title,
            "url": category.url,
            "kind": category.kind,
            "survey": category.survey
        }
    }


# 카테고리 수정
@router.put("/category/{c_id}")
def update_category(
        c_id: int,
        request: counselor.CategoryCreateRequest,
        db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.c_id == c_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    category.title = request.title
    category.url = request.url
    category.kind = request.kind
    category.survey = request.survey

    db.commit()

    return {"success": True, "message": "카테고리 수정 완료"}


# ===============================
# 🔹 상담사 API
# ===============================
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

    return {"success": True}

# ===============================
# 🔹 상담 최종 리포트 조회
# ===============================

@router.get("/report/final/{counseling_id}")
def get_final_report(counseling_id: int, db: Session = Depends(get_db)):

    videos = db.query(ReportAiV).filter(
        ReportAiV.counseling_id == counseling_id
    ).all()

    focus_data = []
    interest_data = []
    alerts = []

    for v in videos:

        analyze = db.query(AiVideoAnalyze).filter(
            AiVideoAnalyze.ai_v_erp_id == v.ai_v_erp_id
        ).first()

        # 1️⃣ 집중도 평균 계산
        avg_focus = 0

        if analyze and analyze.emotion_v_score:

            scores = analyze.emotion_v_score

            total = sum(item["value"] for item in scores)
            avg_focus = round(total / len(scores), 2)

        # 2️⃣ 영상별 집중도 그래프
        focus_data.append({
            "subject": v.category,
            "value": avg_focus
        })

        # 3️⃣ 관심도 그래프 (기존 유지)
        interest_data.append({
            "subject": v.category,
            "관심도": 70,
            "자신감": 65,
            "수행도": 75
        })

        # 4️⃣ 실패 알림
        if v.re_comment == ReCommentEnum.ANALYZE_FAIL:
            alerts.append({
                "id": v.ai_v_erp_id,
                "time": "[영상]",
                "level": "높음",
                "msg": f"{v.category} 영상 AI 분석 실패",
                "videoId": v.ai_v_erp_id
            })

    return {
        "success": True,
        "focus": focus_data,
        "interest": interest_data,
        "alerts": alerts
    }

# 최종 리포트 조회 API
@router.get("/report/final/comment/{counseling_id}")
def get_final_comment(counseling_id: int, db: Session = Depends(get_db)):

    report = db.query(ReportFinal).filter(
        ReportFinal.counseling_id == counseling_id
    ).first()

    if not report:
        return {
            "success": True,
            "comment": "",
            "complete": "N"
        }

    return {
        "success": True,
        "comment": report.final_comment,
        "complete": report.complete_yn
    }

# ===============================
# 🔹 최종 리포트 저장/완료 API
# ===============================

class FinalReportSave(BaseModel):
    counseling_id: int
    comment: str


# 수정 완료 (저장만)
@router.post("/report/final/save")
def save_final_report(data: FinalReportSave, db: Session = Depends(get_db)):

    report = db.query(ReportFinal).filter(
        ReportFinal.counseling_id == data.counseling_id
    ).first()

    # 이미 존재하면 수정
    if report:
        report.final_comment = data.comment

    # 없으면 새로 생성
    else:
        report = ReportFinal(
            counseling_id=data.counseling_id,
            final_comment=data.comment,
            complete_yn='N'
        )
        db.add(report)

    db.commit()

    return {
        "success": True,
        "message": "리포트 저장 완료"
    }


# 작성 완료 (잠금)
@router.post("/report/final/complete")
def complete_final_report(data: FinalReportSave, db: Session = Depends(get_db)):

    report = db.query(ReportFinal).filter(
        ReportFinal.counseling_id == data.counseling_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="최종 리포트가 존재하지 않습니다."
        )

    report.final_comment = data.comment
    report.complete_yn = 'Y'

    db.commit()

    return {
        "success": True,
        "message": "최종 리포트 작성 완료"
    }