import cv2
import numpy as np
from deepface import DeepFace

cap = cv2.VideoCapture(0)

frame_count = 0
emotion_text = "Detecting..."
engagement_score = 0

while True:

    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)

    frame_count += 1

    # DeepFace는 느리므로 5프레임마다 실행
    if frame_count % 5 == 0:

        try:

            result = DeepFace.analyze(
                frame,
                actions=["emotion"],
                enforce_detection=False
            )

            emotions = result[0]["emotion"]
            emotion_text = result[0]["dominant_emotion"]

            # 집중 관련 감정
            focus_emotion = (
                emotions["neutral"] * 0.5 +
                emotions["happy"] * 0.3 +
                emotions["surprise"] * 0.2
            ) / 100

            # 부정 감정
            negative_emotion = (
                emotions["sad"] +
                emotions["angry"] +
                emotions["disgust"] +
                emotions["fear"]
            ) / 100

            emotion_focus_score = focus_emotion - (negative_emotion * 0.3)
            emotion_focus_score = max(0, min(emotion_focus_score, 1))

            engagement_score = round(emotion_focus_score * 100, 2)

        except:
            pass


    # 화면 표시
    cv2.putText(
        frame,
        f"Emotion: {emotion_text}",
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0,255,0),
        2
    )

    cv2.putText(
        frame,
        f"Engagement: {engagement_score}",
        (30, 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0,255,255),
        2
    )

    cv2.imshow("Emotion Engagement", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break


cap.release()
cv2.destroyAllWindows()







# micro-detection 추후 사용할지도
# import cv2
# import mediapipe as mp
# import numpy as np

# mp_face_mesh = mp.solutions.face_mesh


# def detect_micro_expression():

#     cap = cv2.VideoCapture(0)

#     face_mesh = mp_face_mesh.FaceMesh(
#         static_image_mode=False,
#         max_num_faces=1,
#         refine_landmarks=True
#     )

#     prev_landmarks = None
#     micro_reaction = False

#     while True:

#         ret, frame = cap.read()
#         if not ret:
#             break

#         frame = cv2.flip(frame, 1)

#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = face_mesh.process(rgb)

#         if results.multi_face_landmarks:

#             landmarks = results.multi_face_landmarks[0].landmark

#             points = np.array([
#                 [lm.x, lm.y]
#                 for lm in landmarks
#             ])

#             if prev_landmarks is not None:

#                 movement = np.linalg.norm(points - prev_landmarks, axis=1)

#                 mean_move = np.mean(movement)

#                 # micro-expression threshold
#                 if mean_move > 0.003:
#                     micro_reaction = True
#                 else:
#                     micro_reaction = False

#             prev_landmarks = points

#         else:
#             micro_reaction = False

#         text = "Micro Reaction: YES" if micro_reaction else "Micro Reaction: NO"

#         cv2.putText(
#             frame,
#             text,
#             (30, 60),
#             cv2.FONT_HERSHEY_SIMPLEX,
#             1,
#             (0, 255, 255),
#             2
#         )

#         cv2.imshow("Micro Expression Detection", frame)

#         if cv2.waitKey(1) & 0xFF == 27:
#             break

#     cap.release()
#     cv2.destroyAllWindows()