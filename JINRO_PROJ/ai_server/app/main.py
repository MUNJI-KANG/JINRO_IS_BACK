import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", ".env"))
load_dotenv(ENV_PATH)

from fastapi import FastAPI
from app.api import ai, data_ai

app = FastAPI(title="AI_SERVER",
              root_path="/ai")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.include_router(ai.router)
app.include_router(data_ai.router)


@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "AI 분석 서버가 정상적으로 실행 중입니다.",
        "ai_server_url": os.getenv("AI_SERVER_URL", "http://127.0.0.1:8001"),
        "backend_url": os.getenv("BACKEND_URL", "http://127.0.0.1:8000"),
        "upload_dir": UPLOAD_DIR
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("AI_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_SERVER_PORT", "8001")),
        reload=True
    )