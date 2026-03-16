import os
import cv2
import torch
import torch.nn as nn
import numpy as np
import mediapipe as mp
import torchvision.transforms as transforms
from torchvision.models.video import r3d_18
# import face_recognition

# ---------------------------------------------------------
# 1. 모델 초기화 및 가중치 로드 함수
# ---------------------------------------------------------
def load_model(model_path, device):
    print("모델을 불러오는 중입니다...")
    model = r3d_18(weights=None)
    num_ftrs = model.fc.in_features
    
    model.fc = nn.Sequential(
        nn.Dropout(p=0.5),
        nn.Linear(num_ftrs, 2)
    )
    
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    return model

# ---------------------------------------------------------
# 2. MediaPipe 얼굴 크롭 함수 (패딩 적용)
# ---------------------------------------------------------
def crop_face_mediapipe(frame, face_detection, last_box, margin=0.4):
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    results = face_detection.process(rgb_frame)
    
    if not results.detections:
        if last_box is not None:
            ymin, ymax, xmin, xmax = last_box
        else:
            ymin, ymax = int(h*0.2), int(h*0.8)
            xmin, xmax = int(w*0.2), int(w*0.8)
        return frame[ymin:ymax, xmin:xmax], last_box

    bboxC = results.detections[0].location_data.relative_bounding_box
    
    xmin = int(bboxC.xmin * w)
    ymin = int(bboxC.ymin * h)
    box_w = int(bboxC.width * w)
    box_h = int(bboxC.height * h)
    xmax = xmin + box_w
    ymax = ymin + box_h
    
    margin_x = int(box_w * margin)
    margin_y = int(box_h * margin)
    
    ymin = max(0, ymin - margin_y)
    ymax = min(h, ymax + margin_y)
    xmin = max(0, xmin - margin_x)
    xmax = min(w, xmax + margin_x)
    
    last_box = (ymin, ymax, xmin, xmax)
    
    return frame[ymin:ymax, xmin:xmax], last_box

# def crop_face_exact(frame, last_box, margin=0.4):
#     h, w = frame.shape[:2]
#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
#     # 학습 때와 완전히 동일한 라이브러리 사용! (실시간 처리를 위해 model="hog" 사용)
#     face_locations = face_recognition.face_locations(rgb_frame, model="hog")
    
#     if not face_locations:
#         if last_box is not None:
#             top, right, bottom, left = last_box
#         else:
#             top, bottom = int(h*0.2), int(h*0.8)
#             left, right = int(w*0.2), int(w*0.8)
#             return frame[top:bottom, left:right], None
#     else:
#         top, right, bottom, left = face_locations[0]
#         last_box = (top, right, bottom, left)
        
#     face_width = right - left
#     face_height = bottom - top
#     margin_x = int(face_width * margin)
#     margin_y = int(face_height * margin)
    
#     top = max(0, top - margin_y)
#     bottom = min(h, bottom + margin_y)
#     left = max(0, left - margin_x)
#     right = min(w, right + margin_x)
    
#     return frame[top:bottom, left:right], last_box

# ---------------------------------------------------------
# 3. 비디오 집중도 분석 메인 함수 (+ 사진 저장 기능)
# ---------------------------------------------------------
def focuse_analyze_video(video_path, model_path, frame_skip=1, max_frames=16):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(model_path, device)
    
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.43216, 0.394666, 0.37645], std=[0.22803, 0.22145, 0.216989])
    ])
    
    mp_face_detection = mp.solutions.face_detection
    face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)
    
    # ★ 사진을 저장할 폴더 생성
    save_dir_focus = "focuse"
    save_dir_unfocus = "unfocuse"
    # os.makedirs(save_dir_focus, exist_ok=True)
    # os.makedirs(save_dir_unfocus, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"\n🎬 영상 분석 시작: {video_path}")
    print(f"▶ 총 프레임 수: {total_video_frames} (FPS: {fps:.2f})")
    print(f"▶ 예측된 증거 사진은 '예측결과_사진' 폴더에 자동으로 저장됩니다.\n")
    
    frame_count = 0
    buffer = []
    last_box = None
    last_face_img = None # 저장을 위해 원본(BGR) 얼굴 이미지를 기억할 변수
    
    total_predictions = 0
    focused_points = 0
    unfocused_points = 0

    os.makedirs('test_img', exist_ok=True)
    
    with torch.no_grad():
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_skip == 0:
                face_img, last_box = crop_face_mediapipe(frame, face_detection, last_box, margin=0.4)
                last_face_img = face_img.copy() # 원본 컬러 이미지 임시 저장
                
                face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
                tensor_img = transform(face_rgb)
                buffer.append(tensor_img)
                
                if len(buffer) == max_frames:
                    video_tensor = torch.stack(buffer).permute(1, 0, 2, 3).unsqueeze(0).to(device)
                    
                    outputs = model(video_tensor)
                    _, pred = torch.max(outputs, 1)
                    
                    total_predictions += 1
                    is_focused = pred.item() == 1
                    
                    # 예측 결과에 따른 출력 및 사진 저장
                    if is_focused:
                        focused_points += 1
                        print(f"[{total_predictions}회차] ✅ 집중 중")
                        save_path = os.path.join("test_img", f"focus_pred_{total_predictions}.jpg")
                    else:
                        unfocused_points += 1
                        print(f"[{total_predictions}회차] ❌ 집중 안 함")
                        save_path = os.path.join("test_img", f"unfocus_pred_{total_predictions}.jpg")
                    
                    # 16번째 프레임의 얼굴 이미지를 지정된 폴더에 파일로 저장!
                    if last_face_img is not None:
                        cv2.imwrite(save_path, last_face_img)
                        
                    buffer = [] # 다음 예측을 위해 버퍼 비우기
                    
            frame_count += 1
            
    cap.release()
    face_detection.close()
    
    if total_predictions > 0:
        focused_percentage = (focused_points / total_predictions) * 100
        unfocused_percentage = (unfocused_points / total_predictions) * 100
        
        print("\n" + "="*45)
        print(f"📊 최종 집중도 분석 결과")
        print(f"- 총 분석 횟수: {total_predictions}회")
        print(f"- ✅ 집중 판정: {focused_points}회 ({focused_percentage:.1f}%)")
        print(f"- ❌ 비집중 판정: {unfocused_points}회 ({unfocused_percentage:.1f}%)")
        print(f"- 📸 사진 저장 완료: VSCode 폴더 안의 '예측결과_사진'을 확인하세요!")
        print("="*45 + "\n")

        result = {
            "total_predictions": total_predictions,
            "focused_points": focused_points,
            "unfocused_points": unfocused_points,
            "focused_percentage": round(focused_percentage, 2),
            "unfocused_percentage": round(unfocused_percentage, 2)
        }

        return result
    else:
        print("영상이 너무 짧아서 분석할 수 없습니다.")
        return {}
    


    # result = {
    #         "total_predictions": total_predictions,
    #         "focused_points": focused_points,
    #         "unfocused_points": unfocused_points,
    #         "focused_percentage": round(focused_percentage, 2),
    #         "unfocused_percentage": round(unfocused_percentage, 2)
    #     }