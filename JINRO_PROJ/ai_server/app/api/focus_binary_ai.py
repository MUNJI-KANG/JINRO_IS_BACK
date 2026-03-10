from fastapi import APIRouter, UploadFile, File, HTTPException
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import os
import uuid

import mediapipe as mp

# 라우터 객체 생성 (prefix를 지정해두면 하위 API 경로가 깔끔해집니다)
router = APIRouter(
    prefix="/analyze",
    tags=["Video Analysis"]
)

# 모델 및 cascade 파일은 라우터가 임포트될 때 한 번만 메모리에 로드됩니다.
print("🤖 집중도 분석 모델 로딩 중...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..", "..", "models", "focus_binary_model_e30.keras")
)

print("MODEL PATH:", MODEL_PATH)

if os.path.exists(MODEL_PATH):
    focus_model = load_model(MODEL_PATH)
    print("✅ 모델 로딩 완료!")
else:
    print("❌ 경고: 모델 파일을 찾을 수 없습니다.")
    focus_model = None


mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.5
)

@router.post("/focus-modal")
async def analyze_focus(file: UploadFile = File(...)):
    if not focus_model:
        raise HTTPException(status_code=500, detail="모델이 로드되지 않았습니다.")

    # 파일 이름이 겹치지 않게 uuid로 임시 파일 생성
    temp_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
    
    try:
        # 1. 파일 저장
        with open(temp_filename, "wb") as buffer:
            buffer.write(await file.read())
            
        # 2. 영상 캡처 객체 초기화
        cap = cv2.VideoCapture(temp_filename)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="비디오 파일을 읽을 수 없습니다.")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0 or np.isnan(fps):
            fps = 30.0
            
        frame_interval = int(fps) # 1초당 1프레임 추출
        
        total_frames = 0
        focus_count = 0
        frame_idx = 0
        
        # 3. 프레임 단위 분석
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % frame_interval == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_detector.process(rgb)

                faces = []

                if results.detections:
                    for detection in results.detections:
                        bbox = detection.location_data.relative_bounding_box
                        h, w, _ = frame.shape
        
                        x = int(bbox.xmin * w)
                        y = int(bbox.ymin * h)
                        bw = int(bbox.width * w)
                        bh = int(bbox.height * h)

                        faces.append((x, y, bw, bh))
                
                # 얼굴 크롭 또는 전체 사용
                if len(faces) > 0:
                    x, y, w, h = faces[0]
                    face_img = frame[y:y+h, x:x+w]
                else:
                    face_img = frame
                    
                # 리사이즈 및 정규화
                resized = cv2.resize(face_img, (96, 96))
                input_data = np.expand_dims(resized, axis=0) / 255.0
                
                # 예측 (0.5 이상이면 집중)
                prediction = focus_model.predict(input_data, verbose=0)
                score = float(prediction[0][0])

                is_focus = score < 0.5
                
                total_frames += 1
                if is_focus:
                    focus_count += 1
                    
            frame_idx += 1
            
        cap.release()
        
        # 4. 결과 도출
        focus_score = 0
        if total_frames > 0:
            focus_score = round((focus_count / total_frames) * 100, 2)

        return {
            "success": True,
            "total_analyzed_frames": total_frames,
            "focus_score": focus_score,
            "message": "영상 분석 완료"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류 발생: {str(e)}")
        
    finally:
        # 안전한 자원 해제 (임시 파일 삭제)
        if os.path.exists(temp_filename):
            os.remove(temp_filename)