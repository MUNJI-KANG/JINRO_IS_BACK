import uuid

from fastapi import Request, APIRouter, Depends, HTTPException, UploadFile, File
from app.db.database import SessionLocal, engine, Base
from app.models.schema_models import Client,Counselor,Counseling,Category,ReportAiV,ReportCon,ReportFinal
from app.schemas.client import ClientCreate,CounselingCreateRequest,ReportCompleteRequest

from sqlalchemy.orm import Session
import random
import datetime
import os
import shutil
import httpx



# DB 및 모델 임포트 
from app.db.database import get_db
from app.models.schema_models import Client, Category, ReportAiV, ReCommentEnum
from app.schemas.client import ClientCreate, SurveySubmitRequest

router = APIRouter(prefix="/client", tags=["Client (내담자)"])


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
        # 기존 회원 확인 (이름과 핸드폰 번호 기준)
        existing_client = db.query(Client).filter(
            Client.phone_num == client_data.phone_num, 
            Client.name == client_data.name
        ).first()
        
        if existing_client:
            request.session['client_id'] = existing_client.client_id

            # 1. 해당 client의 진행 중인 상담(complete_yn == 0) 조회
            active_counseling = db.query(Counseling).filter(
                Counseling.client_id == existing_client.client_id,
                Counseling.complete_yn == 0
            ).first()

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
                        report_ids.append(report.ai_v_erp_id) # 🌟 리포트 ID도 차곡차곡 담기

            return {
                "message": "기존 회원 로그인 성공", 
                "client_id": existing_client.client_id,
                "has_unfinished_video": has_unfinished_video, 
                "counseling_id": active_counseling.counseling_id if active_counseling else None,
                "category_id": resume_category_id,
                "video_list": video_list,
                "report_ids": report_ids # 🌟 프론트로 넘겨주기!
            }



        # 신규 회원 생성 (데이터는 이미 검증된 숫자/형식임)
        current_year = datetime.datetime.now().strftime("%Y")
        random_num = f"{random.randint(1, 999):03d}"
        generated_c_id = f"S{current_year}{random_num}"

        new_client = Client(
            c_id=generated_c_id, 
            name=client_data.name,
            phone_num=client_data.phone_num, # 예: 01012345678
            email=client_data.email,         # 예: user@naver.com
            birthdate=client_data.birthdate, # 예: 0001011
            agree='Y'
        )
        
        db.add(new_client)
        db.commit()
        db.refresh(new_client)

        request.session['client_id'] = new_client.client_id

        print("LOGIN SESSION:", request.session)
        return {
            "message": "신규 회원 등록 및 로그인 성공", 
            "client_id": new_client.client_id,
            "has_unfinished_video": False, # 키를 맞춰서 False로 전달
            "counseling_id": None,          # 키를 맞춰서 None(null)으로 전달
            "category_id": None,           # 빈 값으로 통일
            "video_list": [],
            "report_ids": None
        }

    except Exception as e:
        db.rollback()
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
    """설문 결과를 REPORT_AI_V 테이블에 저장(UPDATE)"""
    try:
        # 기존 ReportAiV 찾기 (같은 상담 + 같은 영상)
        report = db.query(ReportAiV).filter(
            ReportAiV.counseling_id == data.counseling_id,
            ReportAiV.url == data.url
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="해당 영상 리포트를 찾을 수 없습니다.")

        # 설문 답변 저장
        report.answer = data.answer
        report.complete_yn = 'Y'

        # 분석 상태 업데이트
        report.re_comment = ReCommentEnum.SUCCESS

        db.commit()

        return {
            "success": True,
            "message": "설문 결과가 성공적으로 저장되었습니다.",
            "ai_v_erp_id": report.ai_v_erp_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"저장 중 오류 발생: {str(e)}")

# 상담시작(내담자의 영상선택 완료)
@router.post("/counselling")
def create_counselling_and_reports(
    payload: CounselingCreateRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    # 내담자(Client) ID 가져오기
    client_id = request.session.get('client_id')
    if not client_id:
        raise HTTPException(status_code=401, detail="로그인이 만료되었거나 비정상적인 접근입니다.")

    # 활성화된 상담사 중 한 명을 랜덤으로 선택
    active_counselors = db.query(Counselor).filter(Counselor.active_yn == 'Y').all()
    if not active_counselors:
        raise HTTPException(status_code=404, detail="현재 배정 가능한 상담사가 없습니다.")
    
    assigned_counselor = random.choice(active_counselors)

    try:
        now = datetime.datetime.now()

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
    
       
# 🔥 나중에 저장 경로 지정할 곳
# 예: UPLOAD_DIR = "D:/ai_project/videos"
# 예: UPLOAD_DIR = "/home/server/videos"
UPLOAD_DIR = "videos"   # 지금은 로컬 프로젝트 폴더에 저장

# 폴더 없으면 생성
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/video/upload")
async def upload_video(file: UploadFile = File(...)):

    try:
        # 🔥 나중에 파일 경로 바꾸려면 여기 수정
        # 예: file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}.webm")
        filename = f"{uuid.uuid4()}.webm"

        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "success": True,
            "message": "영상 저장 성공",
            "path": file_path
        }

    except Exception as e:
        print("영상 저장 오류:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/sesstion/clear')
async def session_clear(request: Request):
    request.session.clear()

    return {}

@router.post("/video/analyze")
async def video_analyze():
    current_file_path = os.path.abspath(__file__)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(current_file_path)))
    video_path = os.path.join(BASE_DIR, 'videos', '2c6745d1-ba0a-4547-9902-c4b52e984df5.webm')
    data = None
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                'http://localhost:8001/ai/video/analyze',
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