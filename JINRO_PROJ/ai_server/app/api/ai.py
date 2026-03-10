
from fastapi import APIRouter, UploadFile, File
from app.services.attention_analysis import analyze_attention
from app.services.emotion_analysis import analyze_emotion
from app.schemas.ai import VideoAnalyze
from app.services.stt_service import speech_to_text
from datetime import datetime
import shutil
import os
import requests

BACKEND_URL = "http://localhost:8000"

UPLOAD_DIR = "audio_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/ai", tags=["Client (내담자)"])

@router.get("/")
def get_client_list():
    return {"message": "AI 부분 입니다."}

@router.post("/video/analyze")
def get_video_analyze(data: VideoAnalyze):
    attention_score = analyze_attention(data.video_path)
    emotion_score = analyze_emotion(data.video_path)


    return {
        "success": True,
        "attention_score": attention_score,
        "emotion_score": emotion_score,
    }

@router.get("/attention/all")
def analyze_all():

    video_dir = r"F:\JINRO_IS_BACK_PROJ\JINRO_PROJ\backend\videos"

    results = {}

    for file in os.listdir(video_dir):

        if file.endswith((".mp4", ".webm", ".avi")):

            path = os.path.join(video_dir, file)

            score = analyze_attention(path)

            results[file] = score

    return results

# STT
@router.post("/audio/stt")
def audio_stt(data: dict):

    audio_path = data["audio_path"]

    text = speech_to_text(audio_path)

    return {
        "success": True,
        "text": text
    }

# 음성 AI 분석
@router.post("/audio/analyze")
def audio_analyze(data: dict):

    audio_path = data["audio_path"]

    text = speech_to_text(audio_path)

    return {
        "success": True,
        "stt_text": text
    }




@router.post("/audio/upload/{counseling_id}")
async def upload_audio(counseling_id: int, file: UploadFile = File(...)):

    # 상담 ID 폴더 생성
    counseling_dir = os.path.join(UPLOAD_DIR, str(counseling_id))
    os.makedirs(counseling_dir, exist_ok=True)    

    # 확장자 추출
    ext = os.path.splitext(file.filename)[1]

    # 파일 이름 생성
    filename = f"counseling_{counseling_id}.{ext}"

    file_path = os.path.join(counseling_dir, filename)

    # 파일 저장
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # STT 실행
    stt_text = speech_to_text(file_path)

    # Backend 호출 실패 체크 추가
    res = requests.post(
        f"{BACKEND_URL}/counselor/report/con/{counseling_id}/stt-result",
        json={"stt_text": stt_text}
    )

    if res.status_code != 200:
        print("Backend STT 저장 실패:", res.text)

    return {
        "success": True,
        "stt_text": stt_text
    }