from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", ".env"))
load_dotenv(ENV_PATH)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.db.database import engine, Base
from app.api import client, counselor

print("ENV_PATH =", ENV_PATH)
print("FRONTEND_URL =", os.getenv("FRONTEND_URL"))

Base.metadata.create_all(bind=engine)

app = FastAPI(title="JINRO_IS_BACK API")

frontend_origins_env = os.getenv("FRONTEND_URL", "")
origins = [origin.strip() for origin in frontend_origins_env.split(",") if origin.strip()]

print("origins =", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY") or "fallback-secret-key",
    session_cookie="session",
    same_site="lax",
    https_only=False
)

VIDEO_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "ai_server", "videos"))
print("VIDEO_DIR =", VIDEO_DIR, os.path.exists(VIDEO_DIR))

app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")

@app.get("/")
def read_root():
    return {
        "message": "테이블 생성이 완료되었습니다!",
        "allow_origins": origins
    }

app.include_router(client.router)
app.include_router(counselor.router)