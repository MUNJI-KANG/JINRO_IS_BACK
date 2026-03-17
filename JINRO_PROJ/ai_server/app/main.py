import os
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn

# 1. 환경 설정 로드
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", ".env"))
load_dotenv(ENV_PATH)

# 2. 로그 디렉토리 및 파일 경로 설정 (.env 활용)
LOG_DIR_NAME = os.getenv("LOG_DIR", "logs")
# 프로젝트 최상단(BASE_DIR의 부모)에 logs 폴더 생성
LOG_DIR_PATH = os.path.join(os.path.dirname(BASE_DIR), LOG_DIR_NAME)
os.makedirs(LOG_DIR_PATH, exist_ok=True)

AI_LOG_FILE = os.getenv("AI_LOG_FILE", "ai_debug.log")
full_log_path = os.path.join(LOG_DIR_PATH, AI_LOG_FILE)

# 3. 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        RotatingFileHandler(full_log_path, maxBytes=5*1024*1024, backupCount=5),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"AI 서버 로그 경로: {full_log_path}")

# 4. FastAPI 앱 정의 및 라우터 임포트
from app.api import ai, data_ai

app = FastAPI(title="AI_SERVER")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.include_router(ai.router)
app.include_router(data_ai.router)

@app.get("/")
def read_root():
    logger.debug("AI 서버 루트 엔드포인트 접속")
    return {
        "status": "success",
        "message": "AI 분석 서버가 정상 실행 중입니다.",
        "log_path": full_log_path
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("AI_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_SERVER_PORT", "8001")),
        reload=True
    )