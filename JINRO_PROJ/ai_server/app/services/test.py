import numpy as np
from deepface import DeepFace


def analyze_emotion(frame, surprise_spikes = 0, emotion_scores = [], emotion_diffs = [], prev_emotion = None):

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

    return surprise_spikes, emotion_scores, emotion_diffs, prev_emotion



def test(emotion_scores, emotion_diffs, frame_index, fps, surprise_spikes):
    # 평균 감정
    avg_emotions = {}

    keys = emotion_scores[0].keys()

    for k in keys:
        avg_emotions[k] = np.mean([e[k] for e in emotion_scores])


    # Emotion Engage

    positive = (
        avg_emotions["happy"] +
        avg_emotions["surprise"] +
        avg_emotions["neutral"]
    )

    negative = (
        avg_emotions["sad"] +
        avg_emotions["angry"] +
        avg_emotions["disgust"] +
        avg_emotions["fear"]
    )

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


    # Surprise Rate

    video_seconds = frame_index / fps
    surprise_rate = surprise_spikes / (video_seconds / 60)
    surprise_rate = min(surprise_rate / 6, 1)


    emotion_score = (
        0.35 * engage +
        0.35 * variance +
        0.2 * entropy +
        0.1 * surprise_rate
    )

    return round(emotion_score * 100, 2)