
from fastapi import APIRouter, UploadFile, File
from app.services.attention_analysis import analyze_attention
from app.services.emotion_analysis import analyze_emotion
from app.schemas.ai import VideoAnalyze
import shutil
import os

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
