
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, FastAPI

from fastapi.responses import FileResponse
from app.schemas.ai import (
    VideoAnalyze, SummaryRequest
    )
from app.services.stt_service import speech_to_text
from app.services.summary_service import summarize_text
from app.services.interest_analyze import analyze_video_with_face_crop
from app.services.focuse_service import analyze_video_to_json
from datetime import datetime
import shutil
import os
import requests
import ollama
import torch
import torch.nn as nn
from torchvision import models, transforms
import mediapipe as mp
from typing import Dict, Any
import cv2
import tensorflow as tf
import numpy as np
import tf_keras as keras



BACKEND_URL = os.getenv("BACKEND_URL")

UPLOAD_DIR = "audio_uploads"
UPLOAD_VIDEO = "videos"
DOWNLOAD_MODEL = 'model'
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_VIDEO, exist_ok=True)
os.makedirs(DOWNLOAD_MODEL, exist_ok=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. 디바이스 및 예측 모델 설정
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
class_names = ['interested', 'not_interested']

test_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

model = models.resnet50(pretrained=False)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(class_names))

# 저장된 모델 가중치 불러오기
model_path = os.path.join(BASE_DIR, '..', 'model', 'interest_classifier_best.pth')
if os.path.exists(model_path):
    model.load_state_dict(torch.load(model_path, map_location=device))
else:
    print(f"⚠️ 모델 파일을 찾을 수 없습니다: {model_path}")
    
model = model.to(device)
model.eval()

# 2. 미디어파이프 얼굴 인식 모듈 초기화
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

router = APIRouter(prefix="/ai", tags=["Client (내담자)"])

@router.get("/")
def get_client_list():
    return {"message": "AI 부분 입니다."}


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
def upload_audio(counseling_id: int, file: UploadFile = File(...)):

    # 상담 ID 폴더 생성
    counseling_dir = os.path.join(UPLOAD_DIR, str(counseling_id))
    os.makedirs(counseling_dir, exist_ok=True)    

    # 확장자 추출
    ext = os.path.splitext(file.filename)[1]

    # 파일 이름 생성
    filename = f"counseling_{counseling_id}{ext}"

    file_path = os.path.join(counseling_dir, filename)

    # 파일 저장
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # STT 실행
    stt_result = speech_to_text(file_path)

    # LLM 요약 생성
    summary = summarize_text(stt_result)

    stt_text = stt_result["text"]

    # Backend 호출 실패 방지
    try:

        res = requests.post(
            f"{BACKEND_URL}/counselor/report/con/{counseling_id}/stt-result",
            json={
                "stt_text": stt_text,
                "summary": summary["summary"],
                "analysis": summary
            },
            timeout=30
        )

        if res.status_code != 200:
            print("Backend STT 저장 실패:", res.text)

    except Exception as e:
        print("Backend API 호출 실패:", str(e))

    return {
        "success": True,
        "stt_text": stt_text
    }

# ---------------------------------------------------------
# 3. 텍스트 요약 전용 API 엔드포인트
# ---------------------------------------------------------
@router.post("/api/summarize", summary="긴 글 구조화 요약")
async def summarize_api(summaryRequest: SummaryRequest):
    try:
        client = ollama.AsyncClient()
        response = await client.chat(
            model=summaryRequest.model,
            messages=[
                {'role': 'system', 'content': summaryRequest.system_prompt}, # 시스템 역할(규칙) 부여
                {'role': 'user', 'content': summaryRequest.text}     # 사용자가 보낸 텍스트
            ]
        )

        print(response)
        
        return {
            "success": True,
            "model": summaryRequest.model,
            "summary": response.message['content']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/audio/load/{counseling_id}", summary="음성파일 가져오기")
async def audio_load(counseling_id: int):
    counseling_dir = os.path.join(UPLOAD_DIR, str(counseling_id), f"counseling_{counseling_id}.webm")
    
    if not os.path.exists(counseling_dir):
        raise HTTPException(status_code=404, detail="File not found")
        
    # media_type은 파일 확장자에 맞게 설정 (mp3: audio/mpeg, wav: audio/wav)
    return FileResponse(path=counseling_dir, media_type="audio/mpeg")

# 비디오업로드
def run_ai_analysis(counseling_id: int, client_id: int, report_id: int):
    print("AI 분석 시작", counseling_id, client_id, report_id)
    # 여기서 모델 분석 함수 호출

@router.post("/upload-video")
async def ai_upload_video(
    background_tasks: BackgroundTasks,
    counseling_id: int = Form(...),
    client_id: int = Form(...),
    report_id: int = Form(...),
    c_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        counseling_folder = os.path.join(UPLOAD_VIDEO, str(counseling_id))
        os.makedirs(counseling_folder, exist_ok=True)

        files = os.listdir(counseling_folder)
        numbers = []

        for f in files:
            if f.startswith(f"{c_id}_") and f.endswith(".webm"):
                try:
                    num = int(f.split("_")[1].replace(".webm", ""))
                    numbers.append(num)
                except:
                    pass

        next_number = max(numbers, default=0) + 1
        filename = f"{c_id}_{next_number}.webm"
        file_path = os.path.join(counseling_folder, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if next_number >= 3:
            background_tasks.add_task(
                run_ai_analysis,
                counseling_id,
                client_id,
                report_id
            )

        return {
            "success": True,
            "message": "AI 서버 저장 성공",
            "filename": filename,
            "next_number": next_number
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/interest/analyze/{counseling_id}/{c_id}/{idx}", summary="흥미분석")
def interest_analyze(counseling_id:int, c_id:str, idx:int):
    # 4. 테스트 실행
    sample_video_path = os.path.join(UPLOAD_VIDEO, counseling_id, f"{c_id}_{idx}.webm")

    # frame_skip=5 인자를 명시적으로 전달 (기본값이 5이므로 생략해도 됩니다)
    # 'Total_Frames_Analyzed'
    # 'Frames_With_Face'
    # 'Interested_Percentage'
    # 'Not_Interested_Percentage'
    df_results, stats = analyze_video_with_face_crop(sample_video_path, model, test_transforms, class_names, device, face_detector, frame_skip=5, margin_ratio=0.3)

    return stats

# {counseling_id}/{c_id}/{idx}
@router.get("/engagement/analyze/{counseling_id}/{c_id}/{idx}", summary="집중분석")
def engagement_analyze(counseling_id:int, c_id:str, idx:int):
    try:
        sample_video_path = os.path.join(UPLOAD_VIDEO, counseling_id, f"{c_id}_{idx}.webm")
        model_p = os.path.join(BASE_DIR, '..', 'model', 'best_focus_model_frame.pth')

        # "total_predictions"
        # "focused_points"
        # "unfocused_points"
        # "focused_percentage"
        # "unfocused_percentage"
        stats = analyze_video_to_json(sample_video_path, model_p)

        return stats

    except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))