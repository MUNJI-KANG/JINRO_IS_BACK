import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.db.database import SessionLocal, engine, Base
from app.models.schema_models import Client
from app.schemas.client import ClientCreate
from sqlalchemy.orm import Session

# prefix="/client"로 설정하면 이 파일의 모든 API 주소 앞에 /client가 자동으로 붙습니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
        # 2. 이미 존재하는 회원인지 전화번호로 확인 (DB 무결성 오류 방지)
        existing_client = db.query(Client).filter(Client.phone_num == client_data.phone_num).first()
        
        if existing_client:
            return {"message": "기존 회원 로그인 성공", "client_id": existing_client.client_id}

        # c_id는 고유해야 하므로 uuid를 사용하여 임의 생성합니다.
        new_client = Client(
            c_id=str(uuid.uuid4()), 
            name=client_data.name,
            phone_num=client_data.phone_num,
            email=client_data.email,
            birthdate=client_data.birthdate,
            agree='Y'  # 약관 동의를 거쳤다고 가정
        )
        
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        
        return {"message": "신규 회원 가입 및 로그인 성공", "client_id": new_client.client_id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")