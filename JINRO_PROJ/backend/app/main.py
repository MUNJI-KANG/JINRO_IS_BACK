# main.py
# uvicorn main:app --reload 실행코드
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.models import schema_models

from app.api import client,counselor
# from app.services.emotion_analysis import analyze_emotion
# from app.services.attention_analysis import analyze_attention

app = FastAPI()

# React 앱이 돌아가는 주소를 허용해줘야 통신이 됩니다.
origins = [
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
]

from app.db.database import engine
from app.models import schema_models

schema_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JINRO_IS_BACK API")

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

#     return {
#         "emotion_score": emotion_score,
#         "attention_score": attention_score,
#         "interest_score": round(interest_score, 2)
#     }
# ----------------------------------------------------------

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

