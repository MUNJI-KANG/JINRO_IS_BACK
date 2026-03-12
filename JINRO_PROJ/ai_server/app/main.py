from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import shutil
import os
from app.api import ai, data_ai, analysis


import uvicorn

load_dotenv()


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", ".env"))
load_dotenv(ENV_PATH)


app = FastAPI(title="AI_SERVER")

app.include_router(ai.router)
app.include_router(data_ai.router)

cors_origins_env = os.getenv("AI_CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "AI 분석 서버가 정상적으로 실행 중입니다.",
        "port": os.getenv("AI_SERVER_PORT", "8001"),
        "allow_origins": origins
    }



if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("AI_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_SERVER_PORT", "8001")),
        reload=True
    )