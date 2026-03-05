import uuid

from fastapi import Request, APIRouter, Depends, HTTPException, UploadFile, File
from app.db.database import SessionLocal, engine, Base
from app.models.schema_models import Client,Counselor,Counseling,Category,ReportAiV
from app.schemas.client import ClientCreate,CounselingCreateRequest,ReportCompleteRequest

from sqlalchemy.orm import Session
import random
import datetime
import os
import shutil



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
            return {"message": "기존 회원 로그인 성공", "client_id": existing_client.client_id}



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
        return {"message": "신규 회원 등록 및 로그인 성공", "client_id": new_client.client_id}

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
@router.post("/client/counselling")
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
            complete_yn=1               # 1(영상), 2(예정), 3(완료) 중 초기상태인 1로 설정
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
    
@router.post("/client/pComplete")
def complete_video_report(
    payload: ReportCompleteRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    client_id = request.session.get('client_id')
    if not client_id:
        raise HTTPException(status_code=401, detail="로그인이 만료되었거나 비정상적인 접근입니다.")

    try:
        target_report = db.query(ReportAiV).filter(
            ReportAiV.ai_v_erp_id == payload.report_id
        ).first()

        if not target_report:
            raise HTTPException(status_code=404, detail="해당 리포트를 찾을 수 없습니다.")

        target_report.complete_yn = 'Y'
        target_report.answer = payload.answer  
        
        target_report.re_comment = ReCommentEnum.SUCCESS 

        db.commit()

        return {
            "success": True, 
            "message": "영상 시청 및 설문 작성이 완료되었습니다.",
            "report_id": target_report.ai_v_erp_id,
            "complete_yn": target_report.complete_yn,
            "re_comment": target_report.re_comment.value, 
            "answer": target_report.answer
        }

    except Exception as e:
        db.rollback()
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