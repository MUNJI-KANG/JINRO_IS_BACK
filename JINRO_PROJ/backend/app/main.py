# main.py
# uvicorn main:app --reload 실행코드
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


# DB 설정 및 모델, 스키마 가져오기
from app.db.database import engine, Base


from app.api import client, counselor

from starlette.middleware.sessions import SessionMiddleware
import os

# FastAPI 실행 시 모델을 바탕으로 DB 테이블 자동 생성 (이미 있으면 무시됨)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JINRO_IS_BACK API")


# React 앱이 돌아가는 주소를 허용해줘야 통신이 됩니다.
origins = [
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
    "http://3.26.222.34", # 프론트 엔드 배포서버 IP
]


@app.get("/")
def read_root():
    return {"message": "테이블 생성이 완료되었습니다!"}

# CORS 설정 업데이트
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Session 설정 보완 
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET_KEY", "fallback-secret-key"),
    session_cookie="session",
    same_site="lax",   # 로컬 개발 환경(Lax) 설정
    https_only=False   # HTTP 환경이므로 False 설정
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

VIDEO_DIR = os.path.join(BASE_DIR, "..", "..", "ai_server", "videos")

app.mount(
    "/videos",
    StaticFiles(directory=str(VIDEO_DIR)),
    name="videos"
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

    # return {
    #     "emotion_score": emotion_score,
    #     "attention_score": attention_score,
    #     "interest_score": round(interest_score, 2)
    # }


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

