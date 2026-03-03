# main.py
# uvicorn main:app --reload 실행코드

import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

#분석 서비스 
from app.services.emotion_analysis import analyze_emotion
from app.services.attention_analysis import analyze_attention


# DB 설정 및 모델, 스키마 가져오기
from app.db.database import SessionLocal, engine, Base
from app.models.schema_models import Client
from app.schemas.shemas import ClientCreate

# FastAPI 실행 시 모델을 바탕으로 DB 테이블 자동 생성 (이미 있으면 무시됨)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JINRO_IS_BACK API")

# React 앱이 돌아가는 주소를 허용해줘야 통신이 됩니다.
origins = [
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
]

# DB 세션 의존성 주입 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@app.get("/")
def read_root():
    return {"message": "테이블 생성이 완료되었습니다!"}



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(client.router)
app.include_router(counselor.router)


# 여긴 테스트영역 앞으로 안쓸예정일것
# -----------------------------------------------------------
# @app.get("/api/health")
# async def health_check():
#     return {"status": "ok"}


# @app.post("/api/analyze")
# async def analyze_video():

#     video_path = r"C:\okt\counseling_video.webm"

#     emotion_score = analyze_emotion(video_path)
#     attention_score = analyze_attention(video_path)

#     interest_score = (
#         0.6 * emotion_score +
#         0.4 * attention_score
#     )

    return {
        "emotion_score": emotion_score,
        "attention_score": attention_score,
        "interest_score": round(interest_score, 2)
    }


@app.post("/api/student/login")
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
    


# import shutil
# import os

# app = FastAPI()

# # 영상을 저장할 디렉토리 생성
# os.makedirs("recorded_videos", exist_ok=True)

# @app.post("/upload-video/")
# async def upload_video(file: UploadFile = File(...)):
#     # 저장할 파일 경로 설정 (일단 임의의 이름으로 저장)
#     file_location = f"recorded_videos/{file.filename}"
    
#     # 파일 쓰기
#     with open(file_location, "wb+") as file_object:
#         shutil.copyfileobj(file.file, file_object)
        
#     # TODO: 여기서 저장된 file_location을 기반으로 
#     # FaceMesh, Gaze, DeepFace 분석 파이프라인(Task)을 비동기(Celery, BackgroundTasks 등)로 실행하도록 트리거합니다.

#     return {"info": f"file '{file.filename}' saved at '{file_location}'"}

