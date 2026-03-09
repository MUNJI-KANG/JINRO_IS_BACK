from fastapi import Request, APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import SessionLocal

from app.schemas.counselor import (
    CounselorLoginRequest, CategoryCreateRequest,
    CounselorModifyInfo, ScheduleDetailResponse,
    ScheduleListResponse, ScheduleUpdateRequest,
    ReportConUpdateRequest, FinalReportSave
)
from sqlalchemy import func, or_, and_
from app.models.schema_models import (
    Counselor, Client, Category, Counseling,
    ReportAiV, AiVideoAnalyze, ReCommentEnum,
    ReportFinal, ReportCon, ReportAiM
)

from datetime import datetime
import os, shutil, uuid

router = APIRouter(prefix="/counselor", tags=["Counselor (상담사)"])

AUDIO_UPLOAD_DIR = "audio_records"
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===============================
# 🔹 로그인
# ===============================
@router.post("/login")
def login(login_data: CounselorLoginRequest, request: Request, db: Session = Depends(get_db)):

    counselor_obj = db.query(Counselor).filter(
        Counselor.login_id == login_data.login_id
    ).first()

    if not counselor_obj:
        return {"success": False, "message": "존재하지 않는 아이디입니다."}
    if counselor_obj.pw != login_data.pw:
        return {"success": False, "message": "비밀번호가 일치하지 않습니다."}
    if counselor_obj.active_yn != 'Y':
        return {"success": False, "message": "비활성화된 계정입니다."}

    request.session['counselor_id']   = counselor_obj.counselor_id
    request.session['counselor_name'] = counselor_obj.name

    return {
        "success":     True,
        "message":     f"{counselor_obj.name}님 환영합니다!",
        "name":        counselor_obj.name,
        "counselor_id": counselor_obj.counselor_id
    }


# ===============================
# 🔹 카테고리 API
# ===============================
@router.post("/category")
def create_or_update_category(request: CategoryCreateRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(Category).filter(Category.title == request.title).first()
        if existing:
            existing.url    = request.url
            existing.kind   = request.kind
            existing.survey = request.survey
        else:
            db.add(Category(title=request.title, url=request.url, kind=request.kind, survey=request.survey))
        db.commit()
        return {"success": True, "message": "카테고리 저장 완료"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/category")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return {
        "success": True,
        "data": [{"c_id": c.c_id, "title": c.title, "url": c.url, "kind": c.kind, "survey": c.survey} for c in categories]
    }


@router.get("/category/kind/{kind}")        
def get_category_by_kind(kind: int, db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.kind == kind).all()
    return {
        "success": True,
        "data": [{"c_id": c.c_id, "title": c.title, "url": c.url, "kind": c.kind, "survey": c.survey} for c in categories]
    }


@router.get("/category/detail/{c_id}")     
def get_category_detail(c_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.c_id == c_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    return {
        "success": True,
        "data": {"c_id": category.c_id, "title": category.title, "url": category.url,
                 "kind": category.kind, "survey": category.survey}
    }


@router.put("/category/{c_id}")
def update_category(c_id: int, request: CategoryCreateRequest, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.c_id == c_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    category.title = request.title
    category.url   = request.url
    category.kind  = request.kind
    category.survey = request.survey
    db.commit()
    return {"success": True, "message": "카테고리 수정 완료"}


# ===============================
# 🔹 영상 리스트 / 영상 URL
# ===============================
@router.get("/video/list/{counseling_id}")  
def get_video_list(counseling_id: int, db: Session = Depends(get_db)):
    videos = db.query(ReportAiV).filter(ReportAiV.counseling_id == counseling_id).all()
    return {
        "success": True,
        "data": [{"id": v.ai_v_erp_id, "category": v.category, "date": v.reg_date.strftime("%Y-%m-%d")} for v in videos]
    }


@router.get("/video/{ai_v_erp_id}")
def get_video(ai_v_erp_id: int, db: Session = Depends(get_db)):
    video = db.query(ReportAiV).filter(ReportAiV.ai_v_erp_id == ai_v_erp_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="영상 없음")
    return {"success": True, "url": video.url}


# ===============================
# 🔹 상담 리포트 목록
# ===============================
@router.get("/conversation/list/{counseling_id}")
def get_conversation_list(counseling_id: int, db: Session = Depends(get_db)):
    cons = db.query(ReportCon).filter(ReportCon.counseling_id == counseling_id).all()
    return {
        "success": True,
        "data": [{"id": c.con_rep_id, "date": c.reg_date.strftime("%Y-%m-%d")} for c in cons]
    }


# ===============================
# 🔹 상담 일지(REPOR_CON) 조회
#    GET /counselor/report/con/{counseling_id}
#    CCounseling.jsx useEffect에서 호출
#    → pComplete로 이미 생성된 레코드 조회
#    → 내담자 이름 함께 반환
# ===============================
@router.get("/report/con/{counseling_id}")
def get_report_con(counseling_id: int, db: Session = Depends(get_db)):

    report = db.query(ReportCon).filter(
        ReportCon.counseling_id == counseling_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="상담 일지를 찾을 수 없습니다.")

    counseling = db.query(Counseling).filter(
        Counseling.counseling_id == counseling_id
    ).first()

    client_name = ""
    if counseling:
        client = db.query(Client).filter(Client.client_id == counseling.client_id).first()
        client_name = client.name if client else ""

    return {
        "success": True,
        "data": {
            "con_rep_id":      report.con_rep_id,
            "title":           report.title,
            "con_rep_comment": report.con_rep_comment,
            "complete_yn":     report.complete_yn,
            "client_name":     client_name,
        }
    }


# ===============================
# 🔹 상담 일지(REPOR_CON) 저장
#    PUT /counselor/report/con/{counseling_id}
#    CCounseling.jsx 작성완료 버튼에서 호출
#    → 기존 레코드 UPDATE (pComplete가 INSERT 했으므로)
# ===============================
@router.put("/report/con/{counseling_id}")
def update_report_con(counseling_id: int, data: ReportConUpdateRequest, db: Session = Depends(get_db)):

    report = db.query(ReportCon).filter(
        ReportCon.counseling_id == counseling_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="상담 일지를 찾을 수 없습니다.")

    report.title           = data.title
    report.con_rep_comment = data.con_rep_comment
    report.complete_yn     = data.complete_yn

    counseling = db.query(Counseling).filter(
        Counseling.counseling_id == counseling_id
    ).first()

    if counseling and counseling.complete_yn == 2:
        counseling.complete_yn = 3

    db.commit()

    return {
        "success": True,
        "message": "작성 완료" if data.complete_yn == 'Y' else "임시 저장 완료",
        "data": {
            "con_rep_id":  report.con_rep_id,
            "complete_yn": report.complete_yn,
        }
    }


# ===============================
# 🔹 녹음 파일 업로드
# ===============================
@router.post("/report/con/{counseling_id}/audio")
async def upload_audio(counseling_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        report = db.query(ReportCon).filter(
            ReportCon.counseling_id == counseling_id
        ).first()
        if not report:
            raise HTTPException(status_code=404, detail="상담 일지를 찾을 수 없습니다.")

        filename  = f"counseling_{counseling_id}_{uuid.uuid4()}.webm"
        file_path = os.path.join(AUDIO_UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"success": True, "message": "녹음 파일 저장 성공", "path": file_path}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"녹음 파일 저장 오류: {str(e)}")


# ===============================
# 🔹 최종 리포트 API
# ===============================
@router.get("/report/final/comment/{counseling_id}")  
def get_final_comment(counseling_id: int, db: Session = Depends(get_db)):
    report = db.query(ReportFinal).filter(ReportFinal.counseling_id == counseling_id).first()
    if not report:
        return {"success": True, "comment": "", "complete": "N"}
    return {"success": True, "comment": report.final_comment, "complete": report.complete_yn}


@router.get("/report/final/{counseling_id}")
def get_final_report(counseling_id: int, db: Session = Depends(get_db)):

    videos        = db.query(ReportAiV).filter(ReportAiV.counseling_id == counseling_id).all()
    focus_data    = []
    interest_data = []
    alerts        = []

    for v in videos:
        analyze   = db.query(AiVideoAnalyze).filter(AiVideoAnalyze.ai_v_erp_id == v.ai_v_erp_id).first()
        avg_focus = 0

        if analyze and analyze.emotion_v_score:
            scores    = analyze.emotion_v_score
            avg_focus = round(sum(item["value"] for item in scores) / len(scores), 2)

        focus_data.append({"subject": v.category, "value": avg_focus})
        interest_data.append({"subject": v.category, "관심도": 70, "자신감": 65, "수행도": 75})

        if v.re_comment == ReCommentEnum.ANALYZE_FAIL:
            alerts.append({
                "id": v.ai_v_erp_id, "time": "[영상]", "level": "높음",
                "msg": f"{v.category} 영상 AI 분석 실패", "videoId": v.ai_v_erp_id
            })

    return {"success": True, "focus": focus_data, "interest": interest_data, "alerts": alerts}


@router.post("/report/final/save")
def save_final_report(data: FinalReportSave, db: Session = Depends(get_db)):
    report = db.query(ReportFinal).filter(ReportFinal.counseling_id == data.counseling_id).first()
    if report:
        report.final_comment = data.comment
    else:
        db.add(ReportFinal(counseling_id=data.counseling_id, final_comment=data.comment, complete_yn='N'))
    db.commit()
    return {"success": True, "message": "리포트 저장 완료"}


@router.post("/report/final/complete")
def complete_final_report(data: FinalReportSave, db: Session = Depends(get_db)):
    report = db.query(ReportFinal).filter(ReportFinal.counseling_id == data.counseling_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="최종 리포트가 존재하지 않습니다.")
    report.final_comment = data.comment
    report.complete_yn   = 'Y'
    db.commit()
    return {"success": True, "message": "최종 리포트 작성 완료"}


# ===============================
# 🔹 AI 리포트 조회
# ===============================
@router.get("/ai-report/{counseling_id}/{ai_v_erp_id}")
def get_ai_report(counseling_id: int, ai_v_erp_id: int, db: Session = Depends(get_db)):
    video = db.query(ReportAiV).filter(
        ReportAiV.counseling_id == counseling_id,
        ReportAiV.ai_v_erp_id  == ai_v_erp_id
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="영상 데이터 없음")

    analyze = db.query(AiVideoAnalyze).filter(AiVideoAnalyze.ai_v_erp_id == ai_v_erp_id).first()
    if not analyze:
        raise HTTPException(status_code=404, detail="AI 분석 데이터 없음")

    answer_data = video.answer or {}
    return {
        "success": True,
        "data": {
            "focus":    answer_data.get("focus", []),
            "interest": answer_data.get("interest", []),
            "summary":  analyze.ai_v_comment,
            "prompt":   analyze.prompt
        }
    }


@router.get("/report/ai/{counseling_id}/{con_rep_id}")
def get_counseling_ai_report(counseling_id: int, con_rep_id: int, db: Session = Depends(get_db)):
    con_report = db.query(ReportCon).filter(
        ReportCon.counseling_id == counseling_id,
        ReportCon.con_rep_id    == con_rep_id
    ).first()
    if not con_report:
        raise HTTPException(status_code=404, detail="상담 리포트 없음")

    ai_report = db.query(ReportAiM).filter(ReportAiM.con_rep_id == con_rep_id).first()
    if not ai_report:
        raise HTTPException(status_code=404, detail="AI 분석 데이터 없음")

    scores        = ai_report.emotion_m_score or []
    focus_data    = [{"time": str(i), "value": s.get("value", 0)} for i, s in enumerate(scores)]
    interest_data = [{"subject": s.get("subject", "기타"), "관심도": s.get("interest", 0),
                      "자신감": s.get("confidence", 0)} for s in scores]

    return {
        "success": True,
        "data": {
            "focus":    focus_data,
            "interest": interest_data,
            "summary":  ai_report.ai_m_comment,
            "prompt":   ai_report.prompt
        }
    }


# ===============================
# 🔹 일정 관련 API
# ===============================
@router.get("/schedules", response_model=ScheduleListResponse)
def get_daily_schedules(
    request: Request,
    date: str = Query(..., description="조회할 날짜 (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    counselor_id = request.session.get('counselor_id')
    if not counselor_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        records = db.query(Counseling, Client).join(
            Client, Counseling.client_id == Client.client_id
        ).filter(
            Counseling.counselor_id == counselor_id,
            Counseling.datetime     == date
        ).all()

        schedules = []
        for counseling, client in records:
            time_str   = counseling.reservation_time.strftime("%H:%M") if counseling.reservation_time else "미정"
            status_str = "완료" if counseling.complete_yn == 3 else "예정"
            schedules.append({
                "id": counseling.counseling_id, "time": time_str,
                "name": client.name, "type": "진로 상담", "status": status_str
            })

        return {"success": True, "date": date, "schedules": schedules}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일정 조회 중 오류 발생: {str(e)}")


@router.get("/pending-students")
def get_pending_students(request: Request, db: Session = Depends(get_db)):
    counselor_id = request.session.get('counselor_id')
    if not counselor_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    today_date = datetime.now().date()

    try:
        pending_records = db.query(Counseling, Client).join(
            Client, Counseling.client_id == Client.client_id
        ).filter(
            Counseling.counselor_id == counselor_id,
            or_(
                Counseling.complete_yn == 1,
                and_(
                    Counseling.complete_yn == 2,
                    func.date(Counseling.reservation_time) < today_date
                )
            )
        ).all()

        results = [
            {"counseling_id": c.counseling_id, "name": cl.name, "studentNo": cl.c_id}
            for c, cl in pending_records
        ]
        return {"success": True, "students": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 조회 중 에러: {str(e)}")


@router.put("/schedule/{counseling_id}")
def update_counseling_schedule(counseling_id: int, request_data: ScheduleUpdateRequest, db: Session = Depends(get_db)):
    counseling = db.query(Counseling).filter(Counseling.counseling_id == counseling_id).first()
    if not counseling:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    try:
        datetime_str            = f"{request_data.date} {request_data.time}"
        parsed_reservation_time = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        counseling.datetime         = request_data.date
        counseling.reservation_time = parsed_reservation_time
        counseling.complete_yn      = 2
        db.commit()
        return {"success": True, "message": "일정 등록 완료"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"일정 등록 중 오류: {str(e)}")


# ===============================
# 🔹 학생 목록 / 상담 기록
# ===============================
@router.get("/students")
def get_students(db: Session = Depends(get_db)):
    students = (
        db.query(Client)
        .join(Counseling, Client.client_id == Counseling.client_id)
        .distinct()
        .all()
    )
    return {
        "success": True,
        "data": [
            {"client_id": s.client_id, "name": s.name, "student_id": s.c_id,
             "tel": s.phone_num, "email": s.email}
            for s in students
        ]
    }

# 3월 6일 현재 complete_yn이 0과 1이 아니면 final을 Y로 했음 의도대로 안됨 확인해야함
@router.get("/consultations/{client_id}")
def get_student_consultations(client_id: int, db: Session = Depends(get_db)):
    try:
        # 1. 상담 기록 조회 (Counseling 테이블)
        records = db.query(Counseling).filter(
            Counseling.client_id == client_id
        ).order_by(Counseling.datetime.desc()).all()

        result = []
        for c in records:
            # 연관된 데이터들 조회
            final_report = db.query(ReportFinal).filter(ReportFinal.counseling_id == c.counseling_id).first()
            report_con   = db.query(ReportCon).filter(ReportCon.counseling_id == c.counseling_id).first()
            ai_videos    = db.query(ReportAiV).filter(ReportAiV.counseling_id == c.counseling_id).all()

            # 타이틀 설정
            display_title = report_con.title if (report_con and report_con.title) else "영상시청중"
            
            # 읽지 않은 알림(분석 실패 등) 개수
            unread_count = sum(
                1 for v in ai_videos
                if v.re_comment and v.re_comment != ReCommentEnum.SUCCESS
            )

            # 날짜 표시 로직
            display_date = "날짜 미정"
            if final_report:
                display_date = "작성중..."
                if final_report.complete_yn == 'Y' and final_report.update_date:
                    display_date = final_report.update_date.strftime("%Y-%m-%d")

            # 🌟 핵심 수정 부분: Counseling(변수 c)의 complete_yn 값을 기준으로 판단
            # 의도: 0 혹은 1이 아니면 'Y' (즉, 2:예정, 3:완료 상태일 때 'Y')
            is_final = 'Y' if c.complete_yn not in (0, 1) else 'N'

            result.append({
                "id":           c.counseling_id,
                "title":        display_title,
                "description":  final_report.final_comment if final_report else "상담 진행 중 입니다.",
                "date":         display_date,
                "unread":       unread_count,
                "final":        is_final  # Counseling 기준값 대입
            })

        return {"success": True, "data": result}

    except Exception as e:
        import traceback
        print("상담 기록 조회 오류:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"기록 조회 중 오류: {str(e)}")


# ===============================
# 🔹 상담사 정보 조회 / 수정
# ===============================
@router.get("/{counselor_id}")
def get_counselor(counselor_id: int, db: Session = Depends(get_db)):
    counselor = db.query(Counselor).filter(Counselor.counselor_id == counselor_id).first()
    if not counselor:
        return {"success": False, "message": "상담사 없음"}
    return {
        "success": True,
        "data": {"name": counselor.name, "phone": counselor.phone_num, "email": counselor.email}
    }


@router.put("/{counselor_id}")
def update_counselor(counselor_id: int, request: CounselorModifyInfo, db: Session = Depends(get_db)):
    counselor_obj = db.query(Counselor).filter(Counselor.counselor_id == counselor_id).first()
    if not counselor_obj:
        return {"success": False, "message": "존재하지 않는 상담사입니다."}
    counselor_obj.name      = request.name
    counselor_obj.phone_num = request.phone
    counselor_obj.email     = request.email
    db.commit()
    return {"success": True}