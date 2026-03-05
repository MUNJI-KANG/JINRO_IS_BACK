from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from app.api import ai


# ai 분석 import
from services.attention_analysis import analyze_attention

app = FastAPI(
    titile='AI_SERVER'
)

# CORS 설정 (React 서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 실제 서비스에서는 도메인 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


app.include_router(ai.router)

@app.get("/")
def health_check():
    return {"status": "AI SERVER RUNNING"}