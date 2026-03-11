import cv2
import numpy as np
import subprocess
import os
from deepface import DeepFace


def convert_to_mp4(video_path: str) -> str:
    """webm → mp4 변환"""
    if not video_path.endswith(".webm"):
        return video_path

    output_path = video_path.replace(".webm", "_converted.mp4")

    if os.path.exists(output_path):
        return output_path

    subprocess.run(
        ["ffmpeg", "-i", video_path, output_path],
        check=True,
        capture_output=True
    )

    return output_path


def analyze_emotion(video_path):

    # webm이면 mp4로 변환
    video_path = convert_to_mp4(video_path)

    cap = cv2.VideoCapture(video_path)

    fps = cap.get(cv2.CAP_PROP_FPS)

    # fps 0 방어
    if fps <= 0:
        cap.release()
        return 0

    frame_interval = int(fps * 2)
    frame_index = 0
    emotion_scores = []
    emotion_diffs = []
    prev_emotion = None
    surprise_spikes = 0

    while True:

        ret, frame = cap.read()
        if not ret:
            break

        frame_index += 1

        if frame_index % frame_interval != 0:
            continue

        try:
            result = DeepFace.analyze(
                frame,
                actions=['emotion'],
                enforce_detection=False
            )

            emotions = result[0]["emotion"]
            emotion_scores.append(emotions)

            if prev_emotion is not None:
                diff = np.mean([
                    abs(emotions[k] - prev_emotion[k])
                    for k in emotions.keys()
                ])
                emotion_diffs.append(diff)

            prev_emotion = emotions

            if emotions["surprise"] > 60:
                surprise_spikes += 1

        except Exception as e:
            print(f"[emotion] 프레임 분석 실패: {e}")  # 에러 내용 출력
            continue

    cap.release()

    if len(emotion_scores) == 0:
        return 0

    # 평균 감정
    avg_emotions = {}
    keys = emotion_scores[0].keys()
    for k in keys:
        avg_emotions[k] = np.mean([e[k] for e in emotion_scores])

    # Emotion Engage
    positive = avg_emotions["happy"] + avg_emotions["surprise"] + avg_emotions["neutral"]
    negative = avg_emotions["sad"] + avg_emotions["angry"] + avg_emotions["disgust"] + avg_emotions["fear"]
    engage = (positive - negative + 100) / 200
    engage = max(0, min(engage, 1))

    # Emotion Variance
    variance = np.mean(emotion_diffs) if emotion_diffs else 0
    variance = min(variance / 20, 1)

    # Emotion Entropy
    probs = np.array(list(avg_emotions.values()))
    probs = probs / np.sum(probs)
    entropy = -np.sum(probs * np.log(probs + 1e-9))
    entropy = entropy / np.log(len(probs))

    # Surprise Rate - video_seconds 0 방어
    video_seconds = frame_index / fps
    if video_seconds <= 0:
        surprise_rate = 0
    else:
        surprise_rate = surprise_spikes / (video_seconds / 60)
        surprise_rate = min(surprise_rate / 6, 1)

    emotion_score = (
        0.35 * engage +
        0.35 * variance +
        0.2 * entropy +
        0.1 * surprise_rate
    )

    return round(emotion_score * 100, 2)