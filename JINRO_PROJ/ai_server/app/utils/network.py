import httpx
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_BASE_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
BACKEND_RESULT_URL = f"{BACKEND_BASE_URL}/client/analysis-result"

async def send_to_backend(payload: dict):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(BACKEND_RESULT_URL, json=payload, timeout=2.0)
            return response.status_code
        except Exception as e:
            print(f"[전송 에러] 백엔드 주소나 서버 상태를 확인하십시오: {e}")
            return None