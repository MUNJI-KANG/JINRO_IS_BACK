# main.py
# uvicorn main:app --reload 실행코드
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#분석 서비스 
from app.services.emotion_analysis import analyze_emotion
from app.services.attention_analysis import analyze_attention


# DB 설정 및 모델, 스키마 가져오기
from app.db.database import engine, Base


from app.api import client, counselor

from starlette.middleware.sessions import SessionMiddleware
import os

from starlette.middleware.sessions import SessionMiddleware
from app.core.auth_middleware import AuthMiddleware

# FastAPI 실행 시 모델을 바탕으로 DB 테이블 자동 생성 (이미 있으면 무시됨)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JINRO_IS_BACK API")

app.add_middleware(
    SessionMiddleware,
    secret_key="super-secret-key"
)

# 로그인 체크
app.add_middleware(AuthMiddleware)

# React 앱이 돌아가는 주소를 허용해줘야 통신이 됩니다.
origins = [
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
]

# 세션미드웨어 추가( secret_key는 복잡한 문자열 사용)
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET_KEY", "fallback-secret-key"))

@app.get("/")
def read_root():
    return {"message": "테이블 생성이 완료되었습니다!"}



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
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

