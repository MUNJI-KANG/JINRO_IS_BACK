import os
import cv2
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
import torchvision.utils as vutils
import mediapipe as mp
from PIL import Image
import shutil

# =====================================================================
# 🧠 1. 모델 아키텍처 (학습할 때 썼던 2D FrameMobileNetV2)
# =====================================================================
class FrameMobileNetV2(nn.Module):
    def __init__(self, num_classes=2):
        super(FrameMobileNetV2, self).__init__()
        self.backbone = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        num_ftrs = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(num_ftrs, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)

# =====================================================================
# 🎬 2. 미디어파이프 + 0.2 패딩 + JSON 반환 예측 함수
# =====================================================================
def analyze_video_to_json(video_path, model_path, debug_dir='test_img', stride=5):
    print(f"\n🎥 영상 분석을 시작합니다: {video_path}")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"💻 사용 디바이스: {device}")

    # 1. 모델 로드
    model = FrameMobileNetV2(num_classes=2).to(device)
    if not os.path.exists(model_path):
        return json.dumps({"error": f"모델 가중치 파일이 없습니다: {model_path}"}, ensure_ascii=False)
    
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    # 2. 미디어파이프 초기화
    mp_face_detection = mp.solutions.face_detection
    face_detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

    # 3. 데이터 변환기 설정
    # 예측용 (정규화 O)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    # 디버그 사진 저장용 (정규화 X -> 원본 색상 유지)
    raw_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])

    # 4. 디버그 폴더 초기화
    if os.path.exists(debug_dir):
        shutil.rmtree(debug_dir)
    # os.makedirs(debug_dir, exist_ok=True)

    # 5. 비디오 열기
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return json.dumps({"error": "영상을 열 수 없습니다."}, ensure_ascii=False)

    frame_idx = 0
    focus_score = 0
    unfocus_score = 0
    total_processed_frames = 0
    last_box = None

    print("\n⏳ [실시간 프레임 분석 중...]")
    
    with torch.no_grad():
        while True:
            ret, frame = cap.read()
            if not ret: break

            # stride 간격마다 프레임 추출하여 분석
            if frame_idx % stride == 0:
                h, w = frame.shape[:2]
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_detector.process(rgb_frame)

                # 얼굴 검출 및 0.2 패딩 적용
                if results.detections:
                    detection = results.detections[0]
                    bbox = detection.location_data.relative_bounding_box
                    l = int(bbox.xmin * w)
                    t = int(bbox.ymin * h)
                    r = int((bbox.xmin + bbox.width) * w)
                    b = int((bbox.ymin + bbox.height) * h)
                    
                    # ★ 요구사항: 0.2 (20%) 패딩
                    pad_x = int((r - l) * 0.2)
                    pad_y = int((b - t) * 0.2)
                    last_box = (max(0, t - pad_y), min(h, b + pad_y), max(0, l - pad_x), min(w, r + pad_x))
                    
                elif last_box is None:
                    # 첫 프레임부터 못 찾으면 중앙 크롭
                    last_box = (int(h*0.2), int(h*0.8), int(w*0.2), int(w*0.8))

                # 얼굴 자르기
                face_crop = rgb_frame[last_box[0]:last_box[1], last_box[2]:last_box[3]]
                face_pil = Image.fromarray(face_crop)

                # 텐서 변환 및 모델 예측 (차원 추가: [1, 3, 224, 224])
                input_tensor = transform(face_pil).unsqueeze(0).to(device)
                
                outputs = model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                _, preds = torch.max(outputs, 1)
                
                label = preds.item()
                focus_prob = probabilities[0][1].item() * 100

                # 점수 기록 (+1점)
                total_processed_frames += 1
                if label == 1:
                    focus_score += 1
                    status = "focused"
                else:
                    unfocus_score += 1
                    status = "unfocused"

                # 🚨 디버깅용 원본 색상 이미지 저장
                # 파일명 예시: frame_0015_focused_prob85.2.jpg
                raw_tensor = raw_transform(face_pil)
                # save_path = os.path.join(debug_dir, f"frame_{frame_idx:04d}_{status}_prob{focus_prob:.1f}.jpg")
                # vutils.save_image(raw_tensor, save_path)

            frame_idx += 1

    cap.release()
    face_detector.close()

    # 6. 결과 계산 및 JSON 생성
    if total_processed_frames > 0:
        focus_rate = (focus_score / total_processed_frames) * 100
        unfocus_rate = (unfocus_score / total_processed_frames) * 100
        
        result_dict = {
            "status": "success",
            "total_extracted_frames": total_processed_frames,
            "focus_score": focus_score,
            "unfocus_score": unfocus_score,
            "focus_rate": round(focus_rate, 2),
            "unfocus_rate": round(unfocus_rate, 2),
        }

        return result_dict
    else:
        result_dict = {
            "status": "failed",
            "error": "분석할 수 있는 프레임이 없습니다."
        }

        return result_dict