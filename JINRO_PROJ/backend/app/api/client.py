import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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


@router.post("/login")
def login_or_create_client(client_data: ClientCreate, db: Session = Depends(get_db)):
    try:
        # existing_client = db.query(Client).filter(Client.phone_num == client_data.phone_num).first()
        
        # if existing_client:
        #     return {"message": "기존 회원 로그인 성공", "client_id": existing_client.client_id}

        new_client = Client(
            c_id=str(uuid.uuid4()), 
            name=client_data.name,
            phone_num=client_data.phone_num,
            email=client_data.email,
            birthdate=client_data.birthdate,
            agree='Y'
        )
        
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        
        return {"message": "신규 회원 가입 및 로그인 성공", "client_id": new_client.client_id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")
    

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
    """설문 결과를 REPORT_AI_V 테이블에 JSON 형태로 저장합니다."""
    try:
        # Pydantic 스키마를 통해 안전하게 검증된 데이터를 DB에 삽입합니다.
        new_report = ReportAiV(
            category=data.category,
            url=data.url,
            answer=data.answer,            # 🔥 JSON 형태 그대로 저장됩니다.
            counseling_id=data.counseling_id,
            re_comment=ReCommentEnum.SUCCESS # 분석 상태값을 우선 SUCCESS(영상저장성공)로 부여
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        
        return {"success": True, "message": "설문 결과가 성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"저장 중 오류 발생: {str(e)}"}