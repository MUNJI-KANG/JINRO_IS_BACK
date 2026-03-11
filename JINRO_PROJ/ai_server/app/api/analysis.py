from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.atten_emo_analysis import analyzer

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/start/{session_id}")
async def start_session_analysis(
    session_id: int, 
    user_id: str, 
    background_tasks: BackgroundTasks
):
    """
    특정 세션의 영상을 찾아 분석을 시작하고 결과를 백엔드로 전송합니다.
    """
    try:
        # 1. 분석 서비스 실행 (영상을 찾아 추론 후 백그라운드 전송까지 수행)
        # 이 함수는 내부적으로 background_tasks를 사용하여 전송을 처리합니다.
        result = await analyzer.run_analysis(
            user_id=user_id,
            session_id=str(session_id),
            background_tasks=background_tasks
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=404, detail=result.get("message"))
            
        return {
            "status": "started",
            "message": f"Session {session_id} 분석이 시작되었습니다.",
            "initial_data": result.get("data")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))