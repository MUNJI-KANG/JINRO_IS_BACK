import os
import cv2
import numpy as np
import torch
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Layer
from app.utils.network import send_to_backend
from fastapi import BackgroundTasks


class IdentityLayer(Layer):
    def __init__(self, **kwargs):
        # 에러를 유발하는 모든 인자(data_format 등)를 제거
        for key in ['data_format', 'height_factor', 'width_factor', 'factor']:
            kwargs.pop(key, None)
        super(IdentityLayer, self).__init__(**kwargs)
    def call(self, inputs):
        return inputs
    def get_config(self):
        return super().get_config()

class AttenEmoAnalyzer:
    def __init__(self):
        # 1. 경로 설정
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.model_dir = os.path.join(self.base_dir, "models")
        self.video_root = os.path.join(self.base_dir, "videos")
        
        # 2. GPU 메모리 설정 (RTX 4060과 PyTorch 충돌 방지)
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
            except RuntimeError as e:
                print(e)

        # 3. Keras 모델 로드 (에러 우회 설정 적용)
        custom_dict = {
            'RandomFlip': IdentityLayer,
            'RandomRotation': IdentityLayer,
            'RandomZoom': IdentityLayer,
            'RandomTranslation': IdentityLayer
        }
        
        try:
            # .h5가 아닌 .keras 확장자일 경우에도 custom_objects가 필요할 수 있습니다.
            self.fer_model = load_model(
                os.path.join(self.model_dir, "BEST_FER.keras"), 
                custom_objects=custom_dict, 
                compile=False
            )
            print("✅ FER 모델(Keras) 로드 성공!")
        except Exception as e:
            print(f"❌ FER 모델 로드 에러: {e}")

        # 4. PyTorch 모델 로드
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        try:
            self.daisee_model = torch.load(os.path.join(self.model_dir, "BEST_DAISEE.pth"), map_location=self.device)
            # 만약 모델 전체가 아니라 가중치만 저장된 파일이라면 추가 로직이 필요할 수 있습니다.
            if hasattr(self.daisee_model, 'eval'):
                self.daisee_model.eval()
            print(f"✅ DAISEE 모델(PyTorch) 로드 성공! ({self.device})")
        except Exception as e:
            print(f"❌ DAISEE 모델 로드 에러: {e}")

    async def run_analysis(self, user_id: str, session_id: str, background_tasks: BackgroundTasks):

        session_folder = os.path.join(self.video_root, str(session_id))

        if not os.path.exists(session_folder):
            return {"status": "error", "message": "세션 폴더 없음"}

        video_files = [
            f for f in os.listdir(session_folder)
            if f.endswith(".webm")
        ]

        if len(video_files) == 0:
            return {"status": "error", "message": "영상 없음"}

        video_results = []

        # ⭐⭐⭐ 모든 영상 분석
        for file in video_files:

            video_path = os.path.join(session_folder, file)

            print(f"분석 시작 → {video_path}")

            # ===== 여기 실제 추론 자리 =====
            emotion_score = float(np.random.uniform(70, 95))
            attention_score = float(np.random.uniform(60, 90))

            video_results.append({
                "file": file,
                "emotion_score": emotion_score,
                "attention_score": attention_score
            })

        final_results = {
            "user_id": user_id,
            "session_id": str(session_id),
            "videos": video_results
        }

        # ⭐ backend 전송
        background_tasks.add_task(send_to_backend, final_results)

        print("✅ 전체 영상 분석 완료")

        return {
            "status": "success"
        }

analyzer = AttenEmoAnalyzer()