import httpx


BACKEND_URL = "http://localhost:8000/client/analysis-result"

async def send_to_backend(payload: dict):
    async with httpx.AsyncClient() as client:
        try:
            # 타임아웃 2초 설정 (분석 흐름 방해 금지)
            response = await client.post(BACKEND_URL, json=payload, timeout=2.0)
            return response.status_code
        except Exception as e:
            print(f"[전송 에러] 백엔드 주소나 서버 상태를 확인하십시오: {e}")
            return None