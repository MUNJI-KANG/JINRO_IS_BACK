from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from app.api import ai, focus_binary_ai, data_ai

import uvicorn


# ai 분석 import

app = FastAPI(
    title='AI_SERVER'
)

app.include_router(focus_binary_ai.router)

app.include_router(ai.router)
app.include_router(data_ai.router)


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



# @app.get("/")
# def health_check():
#     return {"status": "AI SERVER RUNNING"}

@app.get("/")
def read_root():
    return {
        "status": "success", 
        "message": "AI 분석 서버가 정상적으로 실행 중입니다. (포트: 8001)"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)