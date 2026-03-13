
import random
import datetime
import os
import httpx
from datetime import datetime
from fastapi import Request, APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.db.database import get_db
from app.models.schema_models import Client,Counselor,Counseling,Category,ReportAiV,ReportCon,ReportFinal, ReCommentEnum, AiVideoAnalyze
from app.schemas.client import ClientCreate,CounselingCreateRequest,ReportCompleteRequest, SurveySubmitRequest, AIAnalysisRequest, CompleteRequest
from app.services.survey_service import analyze_survey

from sqlalchemy.orm import Session



router = APIRouter(
    prefix="/client",
    tags=["Client"]
)

BACKEND_BASE_URL = os.getenv("BACKEND_URL")
AI_SERVER_BASE_URL = os.getenv("AI_SERVER_URL")


@router.get("/")
def get_client_list():
    return {"message": "내담자 목록 조회 API 입니다."}


@router.get("/{client_id}")
def get_client_detail(client_id: int):
    return {"message": f"{client_id}번 내담자 상세 정보 조회 API 입니다."}

# 로그인
@router.post("/login")
def login_or_create_client(client_data: ClientCreate, request: Request, db: Session = Depends(get_db)):
    try:
        name = (client_data.name or "").strip()
        phone = str(client_data.phone_num)
        birth = str(client_data.birthdate)
        email = str(client_data.email)

        existing_client = db.query(Client).filter( 
            Client.phone_num == phone,
            Client.name == name,
            Client.birthdate == birth
        ).first()

        if existing_client:

            if existing_client.email != email:
                existing_client.email = email
                db.commit()
                db.refresh(existing_client)

            request.session['client_id'] = existing_client.client_id
            
            active_counseling = db.query(Counseling).filter(
                Counseling.client_id == existing_client.client_id,
                Counseling.complete_yn.in_([0,1,2])
            ).order_by(Counseling.counseling_id.desc()).first()

            has_unfinished_video = False
            resume_category_id = None
            video_list = []
            report_ids = []

            if active_counseling:
                unfinished_reports = db.query(ReportAiV).filter(
                    ReportAiV.counseling_id == active_counseling.counseling_id,
                    ReportAiV.complete_yn == 'N'
                ).order_by(ReportAiV.ai_v_erp_id.asc()).all()

                if unfinished_reports:
                    has_unfinished_video = True
                    resume_category_id = unfinished_reports[0].category_id

                    for report in unfinished_reports:
                        video_list.append({"id": report.category_id})
                        report_ids.append(report.ai_v_erp_id)

            return {
                "success": True,
                "message": "기존 회원 로그인 성공",
                "client_id": existing_client.client_id,
                "has_unfinished_video": has_unfinished_video,
                "counseling_id": active_counseling.counseling_id if active_counseling else None,
                "category_id": resume_category_id,
                "video_list": video_list,
                "report_ids": report_ids
            }

        phone_exists = db.query(Client).filter(
            Client.phone_num == phone
        ).first()

        if phone_exists:
            return {
                "success": False,
                "message": "입력 정보 불일치"
            }

        current_year = datetime.now().strftime("%Y")

        while True:
            random_num = f"{random.randint(1, 999999):06d}"
            generated_c_id = f"S{current_year}{random_num}"

            exists = db.query(Client).filter(Client.c_id == generated_c_id).first()
            if not exists:
                break

        new_client = Client(
            c_id=generated_c_id,
            name=name,
            phone_num=phone,
            email=email,
            birthdate=birth,
            agree='Y'
        )

        db.add(new_client)
        db.commit()
        db.refresh(new_client)

        request.session['client_id'] = new_client.client_id

        return {
            "success": True,
            "message": "신규 회원 등록 및 로그인 성공",
            "client_id": new_client.client_id,
            "has_unfinished_video": False,
            "counseling_id": None,
            "category_id": None,
            "video_list": [],
            "report_ids": []
        }

    except Exception as e:
        db.rollback()
        import traceback
        print("=== 로그인 에러 ===")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/list/{kind_id}")
def get_videos_by_kind(kind_id: int, db: Session = Depends(get_db)):
    """특정 kind(중분류 ID)에 해당하는 영상 카테고리 목록을 조회합니다."""
    try:
        categories = db.query(Category).filter(Category.kind == kind_id).all()
        result = [
            {
                "id": cat.c_id,
                "title": cat.title,
                "url": cat.url,
                "kind": cat.kind
            }
            for cat in categories
        ]
        return {"success": True, "data": result, "message": "조회 성공"}
    except Exception as e:
        return {"success": False, "data": [], "message": str(e)}

@router.get("/video/{category_id}")
def get_video(category_id: int, db: Session = Depends(get_db)):
    """영상 정보만 반환하는 API"""
    try:
        category = db.query(Category).filter(Category.c_id == category_id).first()

        if not category:
            raise HTTPException(status_code=404, detail="영상 카테고리를 찾을 수 없습니다.")

        return {
            "success": True,
            "video": {
                "id": category.c_id,
                "title": category.title,
                "url": category.url
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"영상 조회 오류: {str(e)}")

@router.get("/survey/{category_id}")
def get_survey_data(category_id: int, db: Session = Depends(get_db)):
    """특정 카테고리의 설문 문항과 영상 URL을 가져옵니다."""
    try:
        category = db.query(Category).filter(Category.c_id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="해당 카테고리를 찾을 수 없습니다.")
        
        return {
            "success": True,
            "data": {
                "c_id": category.c_id,
                "title": category.title,
                "url": category.url,
                "survey": category.survey 
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/survey/submit")
def submit_survey(data: SurveySubmitRequest, db: Session = Depends(get_db)):
    try:
        report = db.query(ReportAiV).filter(
            ReportAiV.counseling_id == data.counseling_id,
            ReportAiV.url == data.url
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="리포트 없음")

        report.answer = data.answer

        scores = [int(v) for v in data.answer.values()]
        avg = sum(scores) / len(scores)

        report.survey_score = (avg / 5) * 100
        report.complete_yn = 'Y'
        report.re_comment = ReCommentEnum.SUCCESS

        db.commit()

        return {
            "success": True,
            "survey_score": report.survey_score,
            "ai_v_erp_id": report.ai_v_erp_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 상담시작(내담자의 영상선택 완료)
@router.post("/counselling")
def create_counselling_and_reports(
    payload: CounselingCreateRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    # 내담자(Client) ID 가져오기
    print("좆",request.session.get('client_id'))
    client_id = request.session.get('client_id')
    if not client_id:
        raise HTTPException(status_code=401, detail="로그인이 만료되었거나 비정상적인 접근입니다.")

    # 활성화된 상담사 중 한 명을 랜덤으로 선택
    active_counselors = db.query(Counselor).filter(Counselor.active_yn == 'Y').all()
    if not active_counselors:
        raise HTTPException(status_code=404, detail="현재 배정 가능한 상담사가 없습니다.")
    
    assigned_counselor = random.choice(active_counselors)

    try:
        now = datetime.now()

        #  Counseling(상담 매칭) 테이블 데이터 생성
        new_counseling = Counseling(
            client_id=client_id,
            counselor_id=assigned_counselor.counselor_id,
            regdate=now,                # 생성 일시
            complete_yn=0               # 0(준비), 1(영상), 2(예정), 3(완료) 중 초기상태인 1로 설정
        )
        db.add(new_counseling)
        db.flush() # 부모 PK(counseling_id) 발급

        # 생성된 리포트 객체들을 담아둘 빈 리스트 준비
        created_reports = []

        for video in payload.videos:
            category_info = db.query(Category).filter(Category.c_id == video.id).first()
            
            if not category_info:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"존재하지 않는 영상입니다. (ID: {video.id})")

            new_report = ReportAiV(
                counseling_id=new_counseling.counseling_id, 
                category_id = video.id,
                category=category_info.title[:20],  # DB 제약조건 String(20)에 맞춤
                url=category_info.url,               # Category 테이블에서 가져온 실제 URL
                complete_yn='N'
            )
            db.add(new_report)
            created_reports.append(new_report) # 리스트에 추가

        db.flush() 

        #  발급된 ID들만 뽑아서 새로운 리스트(report_ids) 생성
        report_ids = [report.ai_v_erp_id for report in created_reports]

        db.commit()

        return {
            "success": True, 
            "message": "상담사 배정 및 영상 등록이 완료되었습니다.",
            "counseling_id": new_counseling.counseling_id,
            "counselor_name": assigned_counselor.name, # 배정된 상담사 이름 반환 (UI 표시용)
            "report_ids": report_ids                   # 새롭게 추가된 부분: 생성된 Report ID 리스트
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"상담 데이터 생성 중 오류 발생: {str(e)}")
    
@router.post("/pComplete")
def complete_video_report(
    request: Request, 
    payload: ReportCompleteRequest, 
    db: Session = Depends(get_db)
):
   
    client_id = request.session.get('client_id')
    if not client_id:
        raise HTTPException(status_code=401, detail="로그인이 만료되었거나 비정상적인 접근입니다.")

    try:
        # 1. 대상 리포트 조회 (counseling_id와 report_id 조건을 모두 사용해 더 정확하게 찾습니다)
        target_report = db.query(ReportAiV).filter(
            ReportAiV.counseling_id == payload.counseling_id,
            ReportAiV.ai_v_erp_id == payload.report_id
        ).first()

        if not target_report:
            raise HTTPException(status_code=404, detail="해당 리포트를 찾을 수 없습니다.")

        # 2. 개별 영상 상태 업데이트 (기존 기능 유지)
        target_report.complete_yn = 'Y'
        target_report.answer = payload.answer  
        target_report.re_comment = ReCommentEnum.SUCCESS 

        # DB에 현재까지의 변경사항 임시 반영 (아래 3번 검사를 위해 필수!)
        db.flush() 

        # 3. 해당 상담(counseling_id)에 속한 '모든' 영상 리포트 조회
        all_videos = db.query(ReportAiV).filter(
            ReportAiV.counseling_id == payload.counseling_id
        ).all()
        
        # 파이썬 all() 함수: 리스트 안의 모든 영상의 complete_yn이 'Y'인지 검사
        is_all_completed = all(v.complete_yn == 'Y' for v in all_videos)

        # 4. 🌟 모든 영상을 다 시청했다면 요구하신 후속 작업 진행
        if is_all_completed:
            
            # (1) Counseling 테이블의 상태를 요청하신 대로 1로 업데이트
            counseling_info = db.query(Counseling).filter(
                Counseling.counseling_id == payload.counseling_id
            ).first()
            if counseling_info:
                counseling_info.complete_yn = 1  
            
            # (2) ReportCon (상담 일지) 생성 (중복 생성 방지용 if문)
            existing_con = db.query(ReportCon).filter(
                ReportCon.counseling_id == payload.counseling_id
            ).first()
            if not existing_con:
                new_report_con = ReportCon(
                    counseling_id=payload.counseling_id,
                    title='상담 제목 미정',
                    con_rep_comment='상담예정',
                    complete_yn='N'
                )
                db.add(new_report_con)

            # (3) ReportFinal (최종 리포트) 생성 (중복 생성 방지용 if문)
            existing_final = db.query(ReportFinal).filter(
                ReportFinal.counseling_id == payload.counseling_id
            ).first()
            if not existing_final:
                new_report_final = ReportFinal(
                    counseling_id=payload.counseling_id,
                    final_comment='상담예정',
                    complete_yn='N'
                )
                db.add(new_report_final)

        # 5. 모든 변경사항 DB에 확정 저장
        db.commit()

        # 프론트엔드에 띄워줄 알림 메시지도 상황에 맞게 분기 처리
        msg = "모든 영상 시청이 완료되어 상담 대기 상태로 전환되었습니다." if is_all_completed else "영상 시청 및 설문 작성이 완료되었습니다."

        return {
            "success": True, 
            "message": msg,
            "report_id": target_report.ai_v_erp_id,
            "complete_yn": target_report.complete_yn,
            "re_comment": target_report.re_comment.value, 
            "answer": target_report.answer,
            "is_all_completed": is_all_completed # 프론트엔드에서 화면 이동 시 참고용 플래그
        }

    except Exception as e:
        db.rollback()
        import traceback
        print("에러 발생:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"데이터 업데이트 중 오류 발생: {str(e)}")
    
       

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

UPLOAD_DIR = os.path.join(BASE_DIR, "..", "ai_server", "videos")

os.makedirs(UPLOAD_DIR, exist_ok=True)

import httpx # 설치 필요: pip install httpx

@router.post("/video/upload/{counseling_id}")
# async def upload_video(
#     counseling_id: int,
#     request: Request,
#     background_tasks: BackgroundTasks, # 추가
#     file: UploadFile = File(...),
#     report_id: int = Form(...),
#     db: Session = Depends(get_db)
# ):
#     try:
#         client_id = request.session.get("client_id")
#         if not client_id:
#             raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

#         client = db.query(Client).filter(Client.client_id == client_id).first()
#         if not client:
#             raise HTTPException(status_code=404, detail="학생 없음")

#         c_id = client.c_id
#         counseling_folder = os.path.join(UPLOAD_DIR, str(counseling_id))
#         os.makedirs(counseling_folder, exist_ok=True)

#         files = os.listdir(counseling_folder)
#         numbers = []
#         for f in files:
#             if f.startswith(f"{c_id}_") and f.endswith(".webm"):
#                 try:
#                     num = int(f.replace(".webm", "").split("_")[1])
#                     numbers.append(num)
#                 except: pass

#         next_number = max(numbers, default=0) + 1
#         filename = f"{c_id}_{next_number}.webm"
#         file_path = os.path.join(counseling_folder, filename)

#         # ⭐ 동일 영상 중복 업로드 방지
#         if os.path.exists(file_path):
#             return {
#                 "success": True,
#                 "message": "이미 업로드된 영상입니다.",
#                 "url": f"{BACKEND_BASE_URL}/videos/{counseling_id}/{filename}"
#             }

#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)

        
#         if next_number >= 3:
#             # 백그라운드 태스크로 실행하여 파일 업로드 응답 속도를 유지
#             background_tasks.add_task(trigger_ai_analysis, counseling_id, client_id)

#         return {
#             "success": True,
#             "message": "영상 저장 성공",
#             "url": f"{BACKEND_BASE_URL}/videos/{counseling_id}/{filename}"
#         }

#     except Exception as e:
#         print("영상 저장 오류:", str(e))
#         raise HTTPException(status_code=500, detail=str(e))
    
async def upload_video(
    counseling_id: int,
    request: Request,
    file: UploadFile = File(...),
    report_id: int = Form(...),
    db: Session = Depends(get_db)
):
    try:
        client_id = request.session.get("client_id")
        if not client_id:
            raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

        client = db.query(Client).filter(Client.client_id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="학생 없음")

        c_id = client.c_id
        file_bytes = await file.read()
        filename = file.filename or "upload.webm"

        async with httpx.AsyncClient(timeout=120.0) as http_client:
            response = await http_client.post(
                f"{AI_SERVER_BASE_URL}/ai/upload-video",
                data={
                    "counseling_id": str(counseling_id),
                    "client_id": str(client_id),
                    "report_id": str(report_id),
                    "c_id": str(c_id),
                },
                files={
                    "file": (filename, file_bytes, file.content_type or "video/webm")
                }
            )

        response.raise_for_status()
        result = response.json()

        return {
            "success": True,
            "message": "AI 서버로 영상 전송 성공",
            "ai_result": result
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI 서버 오류: {e.response.status_code}, {e.response.text}"
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI 서버 호출 실패: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





async def trigger_ai_analysis(counseling_id: int, client_id: str):
    AI_SERVER_URL = f"{AI_SERVER_BASE_URL}/api/analysis/start/{counseling_id}?user_id={client_id}"
    async with httpx.AsyncClient() as client:
        try:
            await client.post(AI_SERVER_URL, timeout=2.0)
            print(f"🚀 AI 분석 트리거 성공: Session {counseling_id}")
        except Exception as e:
            print(f"⚠️ AI 서버 연결 실패: {e}")
    
    

@router.post("/video/analyze")
async def video_analyze():
    current_file_path = os.path.abspath(__file__)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(current_file_path)))
    video_path = os.path.join(BASE_DIR, 'videos', '2c6745d1-ba0a-4547-9902-c4b52e984df5.webm')
    data = None
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{AI_SERVER_BASE_URL}/ai/video/analyze',
                json={"video_path": video_path},
                timeout=120.0,  # 120초 대기 (필요에 따라 조절)
                )
            
            data = response.text
            print(data)
        except Exception as e:
            # 4. 진짜 에러 원인이 무엇인지 터미널에 출력
            print(f'🚨 통신 오류 발생: {e}')
            
            # (선택) 프론트엔드/클라이언트에도 에러 상황 알리기
            # raise HTTPException(status_code=500, detail=f"AI 분석 서버 통신 실패: {str(e)}")
            
    return data


@router.delete("/counselling/{counseling_id}")
def delete_unfinished_counseling(counseling_id: int, db: Session = Depends(get_db)):
    try:
        # 1. 삭제할 상담 내역이 존재하는지 확인
        target_counseling = db.query(Counseling).filter(
            Counseling.counseling_id == counseling_id
        ).first()

        if not target_counseling:
            raise HTTPException(status_code=404, detail="해당 상담 내역을 찾을 수 없습니다.")

        # 2. 자식 테이블 (ReportAiV) 데이터 먼저 삭제
        db.query(ReportAiV).filter(
            ReportAiV.counseling_id == counseling_id
        ).delete(synchronize_session=False)

        # 3. 부모 테이블 (Counseling) 데이터 삭제
        db.delete(target_counseling)
        
        # 4. DB에 완벽히 반영
        db.commit()

        return {"success": True, "message": "기존 상담 기록이 성공적으로 삭제되었습니다."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"상담 데이터 삭제 중 오류 발생: {str(e)}")
    


@router.post("/analysis-result")
async def receive_ai_analysis(data: AIAnalysisRequest, db: Session = Depends(get_db)):
    try:
        report = db.query(ReportAiV).filter(
            ReportAiV.counseling_id == data.session_id
        ).order_by(ReportAiV.ai_v_erp_id.desc()).first()

        if not report:
            raise HTTPException(status_code=404, detail="영상 리포트 없음")

        report.attention_score = data.attention_score
        report.emotion_score = data.emotion_score

        survey = report.survey_score or 0

        final_score = (
            data.attention_score * 0.3 +
            data.emotion_score * 0.3 +
            survey * 0.4
        )

        report.final_score = round(final_score, 2)
        report.re_comment = ReCommentEnum.ANALYZED

        db.commit()

        return {
            "success": True,
            "final_score": report.final_score
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    

@router.post("/complete-client")
async def complete_counseling(req_data: CompleteRequest, db: Session = Depends(get_db)):

    counseling = db.query(Counseling).filter(
        Counseling.counseling_id == req_data.counseling_id
    ).first()

    if not counseling:
        raise HTTPException(status_code=404, detail="상담 없음")

    client = db.query(Client).filter(
        Client.client_id == counseling.client_id
    ).first()

    payload = {
        "counseling_id": req_data.counseling_id,
        "client_id": client.c_id
    }

    async with httpx.AsyncClient() as client_http:
        await client_http.post(
            f"{AI_SERVER_BASE_URL}/focus-rule/start-analysis",
            json=payload,
            timeout=10
        )

    return {"success": True}
    

@router.get("/session/clear")
def clear_session(request: Request):
    request.session.clear()
    return {"success": True}



@router.get("/final-score/{counseling_id}")
def get_final_score(counseling_id: int, db: Session = Depends(get_db)):

    reports = db.query(ReportAiV).filter(
        ReportAiV.counseling_id == counseling_id
    ).all()

    if not reports:
        raise HTTPException(status_code=404, detail="데이터 없음")

    avg = sum(r.final_score or 0 for r in reports) / len(reports)

    return {
        "success": True,
        "counseling_score": round(avg, 2)
    }

@router.post("/survey/submit")
def submit_survey(data: SurveySubmitRequest, db: Session = Depends(get_db)):
    try:
        report = db.query(ReportAiV).filter(
            ReportAiV.counseling_id == data.counseling_id,
            ReportAiV.url == data.url
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="리포트 없음")

        report.answer = data.answer

        survey_score = analyze_survey(data.answer)

        report.survey_score = survey_score
        report.complete_yn = "Y"
        report.re_comment = ReCommentEnum.SUCCESS

        db.commit()

        return {
            "success": True,
            "survey_score": survey_score,
            "ai_v_erp_id": report.ai_v_erp_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/survey/score/{counseling_id}")
def get_survey_score(counseling_id: int, db: Session = Depends(get_db)):

    reports = db.query(ReportAiV).filter(
        ReportAiV.counseling_id == counseling_id
    ).all()

    scores = [r.survey_score for r in reports if r.survey_score is not None]

    if not scores:
        return {"success": True, "survey_score": 0}

    avg = sum(scores) / len(scores)

    return {
        "success": True,
        "survey_score": round(avg, 2)
    }

@router.post("/complete/video")
def complete_video(complete_request: CompleteRequest, db: Session = Depends(get_db)):

    try:
        counseling = db.query(Counseling, ReportAiV).join(
            ReportAiV, Counseling.counseling_id == ReportAiV.counseling_id
        ).where(Counseling.counseling_id == complete_request.counseling_id).all()

        data = {}
        if counseling:
            for c, r in counseling:
                total_score = 0
                if len(r.answer) > 0:
                    for sc in r.answer.values():
                        total_score += sc + 1
                    
                    score = ((total_score - len(r.answer)) / ((len(r.answer) * 5) - len(r.answer))) * 100

                    if f"{r.ai_v_erp_id}" not in data:
                        data[f'{r.ai_v_erp_id}'] = {}

                    data[f'{r.ai_v_erp_id}']['survey'] = score
        
        
        for k, v in data.items():
            db.add(AiVideoAnalyze(
                ai_v_erp_id=int(k),
                attention_score=None,
                emotion_score=None,
                final_score=None,
                survey_score=v['survey'],
                ai_v_comment='',
                raw_data={},
                prompt='',
            ))

        db.commit()

        return {'success': True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))