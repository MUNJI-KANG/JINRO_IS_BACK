import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh


def calculate_ear(landmarks, idx):

    p1 = landmarks[idx[0]]
    p2 = landmarks[idx[1]]
    p3 = landmarks[idx[2]]
    p4 = landmarks[idx[3]]
    p5 = landmarks[idx[4]]
    p6 = landmarks[idx[5]]

    vertical1 = np.linalg.norm([p2.x - p6.x, p2.y - p6.y])
    vertical2 = np.linalg.norm([p3.x - p5.x, p3.y - p5.y])
    horizontal = np.linalg.norm([p1.x - p4.x, p1.y - p4.y])

    return (vertical1 + vertical2) / (2.0 * horizontal)


def analyze_attention(video_path):

    cap = cv2.VideoCapture(video_path)

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * 0.2) if fps > 0 else 5

    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True
    )

    total_frames = 0
    analyzed_frames = 0

    head_frames = 0
    gaze_frames = 0
    face_frames = 0
    blink_count = 0

    prev_eye_closed = False
    frame_index = 0

    while True:

        ret, frame = cap.read()
        if not ret:
            break

        frame_index += 1
        total_frames += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        if results.multi_face_landmarks:

            face_frames += 1
            landmarks = results.multi_face_landmarks[0].landmark


            # Head Pose

            nose = landmarks[1]
            left_face = landmarks[234]
            right_face = landmarks[454]

            face_width = right_face.x - left_face.x

            if face_width != 0:

                nose_offset = (nose.x - left_face.x) / face_width

                if 0.4 < nose_offset < 0.6:
                    head_frames += 1


            # Gaze

            def iris_ratio(eye_left, eye_right, iris):

                denom = (eye_right.x - eye_left.x)
                if denom == 0:
                    return 0.5

                return (iris.x - eye_left.x) / denom


            left_ratio = iris_ratio(
                landmarks[33],
                landmarks[133],
                landmarks[468]
            )

            right_ratio = iris_ratio(
                landmarks[362],
                landmarks[263],
                landmarks[473]
            )

            gaze_ratio = (left_ratio + right_ratio) / 2

            if 0.35 < gaze_ratio < 0.65:
                gaze_frames += 1


            # Blink

            left_eye_idx = [33,160,158,133,153,144]

            ear = calculate_ear(landmarks, left_eye_idx)

            if ear < 0.21:

                if not prev_eye_closed:
                    blink_count += 1
                    prev_eye_closed = True

            else:
                prev_eye_closed = False


        analyzed_frames += 1


    cap.release()

    if analyzed_frames == 0:
        return 0


    head_score = head_frames / analyzed_frames
    gaze_score = gaze_frames / analyzed_frames
    face_score = face_frames / analyzed_frames

    video_seconds = total_frames / fps
    blink_per_min = blink_count / (video_seconds / 60)

    blink_score = 1 - abs(blink_per_min - 18) / 18
    blink_score = max(0, min(blink_score, 1))


    attention_score = (
        0.35 * head_score +
        0.35 * gaze_score +
        0.2 * blink_score +
        0.1 * face_score
    )

    return round(attention_score * 100, 2)