from fastapi import Request, APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import SessionLocal

from app.schemas.counselor import CounselorLoginRequest,CategoryCreateRequest,CounselorModifyInfo,ScheduleDetailResponse,ScheduleListResponse,ScheduleUpdateRequest
from pydantic import BaseModel

from sqlalchemy import func, or_, and_
from app.models.schema_models import ReportFinal
# from app.schemas import counselor

from app.models.schema_models import (
    Counselor,
    Client,
    Category,
    Counseling,
    ReportAiV,
    AiVideoAnalyze,
    ReCommentEnum,
    ReportFinal,
    ReportCon,
    ReportAiM,
    Client,
    Counseling
    
)



from datetime import datetime



router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.post("/login")
def login(
    login_data: CounselorLoginRequest,
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
    print(f"세션 저장 완료: {request.session.get('counselor_id')}")

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
def create_or_update_category(request: CategoryCreateRequest, db: Session = Depends(get_db)):
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
        request: CategoryCreateRequest,
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
        request: CounselorModifyInfo,
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
# 🔹 시청 영상 리스트 조회
# ===============================

@router.get("/video/list/{counseling_id}")
def get_video_list(counseling_id:int, db:Session=Depends(get_db)):

    videos = db.query(ReportAiV).filter(
        ReportAiV.counseling_id == counseling_id
    ).all()

    return {
        "success":True,
        "data":[
            {
                "id":v.ai_v_erp_id,
                "category":v.category,
                "date":v.reg_date.strftime("%Y-%m-%d")
            }
            for v in videos
        ]
    }
# ===============================
# 🔹 상담 리포트 리스트
# ===============================

@router.get("/conversation/list/{counseling_id}")
def get_conversation_list(counseling_id:int, db:Session=Depends(get_db)):

    cons = db.query(ReportCon).filter(
        ReportCon.counseling_id == counseling_id
    ).all()

    return {
        "success":True,
        "data":[
            {
                "id":c.con_rep_id,
                "date":c.reg_date.strftime("%Y-%m-%d")
            }
            for c in cons
        ]
    }

# 학생목록 - 상담일정목록
@router.get("/consultations/{client_id}")
def get_student_consultations(client_id: int, db: Session = Depends(get_db)):
    try:
        # 해당 학생의 모든 상담 기록을 시간 역순(최신순)으로 가져옵니다
        records = db.query(Counseling).filter(
            Counseling.client_id == client_id
        ).order_by(Counseling.datetime.desc()).all()

        result = []
        for c in records:
            # 1. ReportFinal 조회 (description 용도)
            final_report = db.query(ReportFinal).filter(
                ReportFinal.counseling_id == c.counseling_id
            ).first()

            # 2. ReportCon 조회 (title 용도)
            report_con = db.query(ReportCon).filter(
                ReportCon.counseling_id == c.counseling_id
            ).first()
            
            # ReportCon이 있고 title 값이 존재하면 그 값을, 아니면 '영상시청중' 할당
            display_title = report_con.title if (report_con and report_con.title) else "영상시청중"

            # 3. ReportAiV 조회 (unread 뱃지 계산 용도)
            ai_videos = db.query(ReportAiV).filter(
                ReportAiV.counseling_id == c.counseling_id
            ).all()
            
            unread_count = 0
            for v in ai_videos:
                # 테이블에 값이 있고(None이 아니고), 그 값이 SUCCESS가 아닌 경우에만 +1
                if v.re_comment and v.re_comment != ReCommentEnum.SUCCESS:
                    unread_count += 1

            display_date = "날짜 미정"
            if final_report :
                display_date = "작성중... "
                if final_report.complete_yn == 'Y' and final_report.update_dt:
                    display_date = final_report.update_dt.strftime("%Y-%m-%d")

            # 4. 프론트엔드로 보낼 데이터 조립
            result.append({
                "id": c.counseling_id,
                "title": display_title, 
                "description": final_report.final_comment if final_report else "상담 진행 중 입니다.",
                "date": display_date,
                "unread": unread_count
            })

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        import traceback
        print("상담 기록 조회 오류:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"기록 조회 중 오류: {str(e)}")
    
# ===============================
# 🔹 영상 URL 조회
# ===============================

@router.get("/video/{ai_v_erp_id}")
def get_video(ai_v_erp_id:int, db:Session=Depends(get_db)):

    video = db.query(ReportAiV).filter(
        ReportAiV.ai_v_erp_id == ai_v_erp_id
    ).first()

    if not video:
        raise HTTPException(status_code=404, detail="영상 없음")

    return {
        "success":True,
        "url":video.url
    }

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

# ===============================
# 🔹 최종 리포트 조회 API
# ===============================
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

@router.get("/schedules", response_model=ScheduleListResponse)
def get_daily_schedules(
    request: Request,
    date: str = Query(..., description="조회할 날짜 (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    
    counselor_id = request.session.get('counselor_id') # 현재 로그인한 상담사 계정
    if not counselor_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        records = db.query(Counseling, Client).join(
            Client, Counseling.client_id == Client.client_id  
        ).filter(
            Counseling.counselor_id == counselor_id,
            Counseling.datetime == date
        ).all()

        schedules = []
        for counseling, client in records:
            time_str = counseling.reservation_time.strftime("%H:%M") if counseling.reservation_time else "미정"

            if counseling.complete_yn == 3:
                status_str = "완료"
            else:
                status_str = "예정"

            schedules.append({
                "id": counseling.counseling_id,
                "time": time_str,
                "name": client.name,    # Client 테이블에서 가져온 이름
                "type": "진로 상담",     # 필요 시 DB에 상담 카테고리를 추가하여 연동
                "status": status_str
            })

        return {
            "success": True,
            "date": date,
            "schedules": schedules
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일정 조회 중 오류 발생: {str(e)}")


# 💡 반드시 .get 인지, 주소에 오타가 없는지 확인!
@router.get("/pending-students")
def get_pending_students(request: Request, db: Session = Depends(get_db)):
    # 1. 로그인한 상담사 확인
    counselor_id = request.session.get('counselor_id')
    print(f"완료: {request.session.get('counselor_id')}")
    if not counselor_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    # 2. 현재 시간 (예약 시간 초과 체크용)
    today_date = datetime.now().date()

    try:
        # 3. 위에서 말한 2가지 조건을 쿼리로 구현
        pending_records = db.query(Counseling, Client).join(
            Client, Counseling.client_id == Client.client_id
        ).filter(
            Counseling.counselor_id == counselor_id, # 상담사 본인 것만
            or_(
                Counseling.complete_yn == 1, # 조건 1: 영상 완료
                and_(
                    Counseling.complete_yn == 2, # 조건 2: 예약 중인데
                    func.date(Counseling.reservation_time) < today_date # 시간이 지남
                )
            )
        ).all()

        # 4. 프론트엔드에서 요구하는 S2026... 형태의 데이터로 가공
        results = [
            {
                "counseling_id": c.counseling_id,
                "name": cl.name,
                "studentNo": cl.c_id # S2026... 형태의 학번
            } for c, cl in pending_records
        ]

        return {"success": True, "students": results}
        
    except Exception as e:
        print(f"Error details: {str(e)}") # 서버 터미널에서 상세 에러 확인용
        raise HTTPException(status_code=500, detail=f"DB 조회 중 에러: {str(e)}")


@router.put("/schedule/{counseling_id}")
def update_counseling_schedule(
    counseling_id: int, 
    request_data: ScheduleUpdateRequest, 
    db: Session = Depends(get_db)
):
    # 1. 대상 상담 기록 찾기
    counseling = db.query(Counseling).filter(
        Counseling.counseling_id == counseling_id
    ).first()

    if not counseling:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    try:
        # 2. 문자열로 들어온 날짜와 시간을 DB용 DateTime 포맷으로 합치기
        # "2026-03-05 14:00" 형태로 만든 후 변환
        datetime_str = f"{request_data.date} {request_data.time}"
        parsed_reservation_time = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")

        # 3. DB 데이터 업데이트
        counseling.datetime = request_data.date           # Date 타입
        counseling.reservation_time = parsed_reservation_time # DateTime 타입
        counseling.complete_yn = 2                        # 상태를 2(예정)로 변경!

        db.commit()

        return {"success": True, "message": "일정 등록 완료"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"일정 등록 중 오류: {str(e)}")
    


# ===============================
# 🔹 AI 시청영상 분석 리포트 조회
# ===============================

@router.get("/ai-report/{counseling_id}/{ai_v_erp_id}")
def get_ai_report(counseling_id: int, ai_v_erp_id: int, db: Session = Depends(get_db)):

    video = db.query(ReportAiV).filter(
        ReportAiV.counseling_id == counseling_id,
        ReportAiV.ai_v_erp_id == ai_v_erp_id
    ).first()

    if not video:
        raise HTTPException(status_code=404, detail="영상 데이터 없음")

    analyze = db.query(AiVideoAnalyze).filter(
        AiVideoAnalyze.ai_v_erp_id == ai_v_erp_id
    ).first()

    if not analyze:
        raise HTTPException(status_code=404, detail="AI 분석 데이터 없음")

    answer_data = video.answer or {}

    return {
        "success": True,
        "data": {
            "focus": answer_data.get("focus", []),
            "interest": answer_data.get("interest", []),
            "summary": analyze.ai_v_comment,
            "prompt": analyze.prompt
        }
    }

# ===============================
# 🔹 AI 상담영상 분석 리포트 조회
# ===============================

@router.get("/report/ai/{counseling_id}/{con_rep_id}")
def get_counseling_ai_report(counseling_id: int, con_rep_id: int, db: Session = Depends(get_db)):

    con_report = db.query(ReportCon).filter(
        ReportCon.counseling_id == counseling_id,
        ReportCon.con_rep_id == con_rep_id
    ).first()

    if not con_report:
        raise HTTPException(status_code=404, detail="상담 리포트 없음")

    ai_report = db.query(ReportAiM).filter(
        ReportAiM.con_rep_id == con_rep_id
    ).first()

    if not ai_report:
        raise HTTPException(status_code=404, detail="AI 분석 데이터 없음")

    scores = ai_report.emotion_m_score or []

    focus_data = []
    interest_data = []

    for i, s in enumerate(scores):

        focus_data.append({
            "time": str(i),
            "value": s.get("value", 0)
        })

        interest_data.append({
            "subject": s.get("subject", "기타"),
            "관심도": s.get("interest", 0),
            "자신감": s.get("confidence", 0)
        })

    return {
        "success": True,
        "data": {
            "focus": focus_data,
            "interest": interest_data,
            "summary": ai_report.ai_m_comment,
            "prompt": ai_report.prompt
        }
    }



# ===============================
# 🔹 학생 목록 조회
# ===============================
@router.get("/students")
def get_students(db: Session = Depends(get_db)):

    students = (
        db.query(Client)
        .join(Counseling, Client.client_id == Counseling.client_id)
        .distinct()
        .all()
    )

    result = []

    for s in students:
        result.append({
            "client_id": s.client_id,
            "name": s.name,
            "student_id": s.c_id,
            "tel": s.phone_num,
            "email": s.email
        })

    return {
        "success": True,
        "data": result
    }


# 상담사 정보 수정
@router.get("/{counselor_id}")
def get_counselor(counselor_id: int, db: Session = Depends(get_db)):

    counselor = db.query(Counselor).filter(
        Counselor.counselor_id == counselor_id
    ).first()

    if not counselor:
        return {"success": False, "message": "상담사 없음"}

    return {
        "success": True,
        "data": {
            "name": counselor.name,
            "phone": counselor.phone_num,
            "email": counselor.email
        }
    }
