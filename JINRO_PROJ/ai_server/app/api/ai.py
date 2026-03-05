from fastapi import APIRouter, UploadFile, File
import shutil
import os


from app.services.attention_analysis import analyze_attention


router = APIRouter(prefix="/ai", tags=["Client (내담자)"])

@router.get("/")
def get_client_list():
    return {"message": "AI 부분 입니다."}



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