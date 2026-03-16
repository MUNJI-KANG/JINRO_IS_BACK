
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, FastAPI

from fastapi.responses import FileResponse
from app.schemas.ai import (
    VideoAnalyze, SummaryRequest
    )
from app.services.stt_service import speech_to_text
from app.services.summary_service import summarize_text
from app.services.interest_analyze import analyze_video_with_face_crop
from app.services.focuse_service import focuse_analyze_video
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
def interest_analyze():
    # 4. 테스트 실행
    sample_video_path = os.path.join(UPLOAD_VIDEO, "26", f"ewfwfsfsf.mp4")

    # frame_skip=5 인자를 명시적으로 전달 (기본값이 5이므로 생략해도 됩니다)
    # 'Total_Frames_Analyzed'
    # 'Frames_With_Face'
    # 'Interested_Percentage'
    # 'Not_Interested_Percentage'
    df_results, stats = analyze_video_with_face_crop(sample_video_path, model, test_transforms, class_names, device, face_detector, frame_skip=5, margin_ratio=0.4)

    return stats

@router.get("/engagement/analyze/{counseling_id}/{c_id}/{idx}", summary="집중분석")
def interest_analyze():
    sample_video_path = os.path.join(UPLOAD_VIDEO, "26", f"ewfwfsfsf.mp4")
    model_p = os.path.join(DOWNLOAD_MODEL, 'best_focus_model_pytorch_v4.pth')

    # "total_predictions"
    # "focused_points"
    # "unfocused_points"
    # "focused_percentage"
    # "unfocused_percentage"
    stats = focuse_analyze_video(sample_video_path, model_p)

    return stats

# -----------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR)) # 최상위 ai_server 폴더
print("현재경로", PROJECT_ROOT)
MODEL_PATH = os.path.join(PROJECT_ROOT, 'app', 'model', 'focus.keras')

try:
    print(f"모델 로딩 중... 경로: {MODEL_PATH}")
    focus_model = tf.keras.models.load_model(MODEL_PATH)
    print("모델 로딩 완료!")
except Exception as e:
    print(f"모델 로딩 실패: {e}")
    focus_model = None

# -----------------------------
# 2. 비디오 분석 함수 (핵심 로직)
# -----------------------------
def analyze_video_focus_dl(video_path: str, focus_model, face_detector, padding_ratio=0.2, frame_interval=5) -> Dict[str, Any]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"영상을 열 수 없습니다: {video_path}")

    frame_idx = 0
    total_analyzed_frames = 0
    total_focus_score_sum = 0
    total_unfocus_score_sum = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % frame_interval == 0:
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            ih, iw, _ = image_rgb.shape
            
            results = face_detector.process(image_rgb)
            
            if results.detections:
                detection = results.detections[0]
                bboxC = detection.location_data.relative_bounding_box
                
                x, y = int(bboxC.xmin * iw), int(bboxC.ymin * ih)
                w, h = int(bboxC.width * iw), int(bboxC.height * ih)
                
                # 마진(Padding) 적용
                pad_w, pad_h = int(w * padding_ratio), int(h * padding_ratio)
                
                new_left, new_top = max(0, x - pad_w), max(0, y - pad_h)
                new_right, new_bottom = min(iw, x + w + pad_w), min(ih, y + h + pad_h)
                
                cropped_face = image_rgb[new_top:new_bottom, new_left:new_right]
                
                if cropped_face.size > 0:
                    processed_face = cv2.resize(cropped_face, (224, 224))
                    processed_face = processed_face / 255.0
                    processed_face = np.expand_dims(processed_face, axis=0) 
                    
                    # 모델 예측
                    pred = focus_model.predict(processed_face, verbose=0)[0][0]
                    
                    if pred >= 0.5:
                        total_focus_score_sum += 1
                    else:
                        total_unfocus_score_sum += 1
                        
                    total_analyzed_frames += 1
        
        frame_idx += 1
        
    cap.release()
    
    # 백분율 계산
    focus_percentage = 0.0
    unfocus_percentage = 0.0
    if total_analyzed_frames > 0:
        focus_percentage = (total_focus_score_sum / total_analyzed_frames) * 100
        unfocus_percentage = (total_unfocus_score_sum / total_analyzed_frames) * 100
        
    return {
        "total_analyzed_frames": total_analyzed_frames,
        "total_focus_frames": total_focus_score_sum,
        "total_unfocus_frames": total_unfocus_score_sum,
        "focus_percentage": round(focus_percentage, 2),
        "unfocus_percentage": round(unfocus_percentage, 2)
    }

# -----------------------------
# 3. 파일 업로드용 API 엔드포인트
# -----------------------------
@router.post("/upload-and-analyze")
async def test_focus_with_upload(file: UploadFile = File(...)):
    if focus_model is None:
        raise HTTPException(status_code=500, detail="서버에 딥러닝 모델이 로드되지 않았습니다.")

    # 1. 업로드된 파일을 임시 저장할 경로 설정 (최상위 폴더에 temp_video.webm 등으로 저장)
    temp_file_path = os.path.join(PROJECT_ROOT, f"temp_{file.filename}")
    
    try:
        # 2. 파일 저장
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. MediaPipe 얼굴 인식기 준비 및 분석 실행
        with mp.solutions.face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detector:
            result = analyze_video_focus_dl(temp_file_path, focus_model, face_detector)
            
        # 4. 분석 결과 반환
        return {
            "status": "success",
            "filename": file.filename,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"영상 처리 중 오류 발생: {str(e)}")
        
    finally:
        # 5. [중요] 처리가 끝난 후 임시 파일 삭제하여 용량 확보
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)