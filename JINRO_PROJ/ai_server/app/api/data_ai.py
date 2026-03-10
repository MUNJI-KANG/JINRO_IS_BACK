from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse



import os
import cv2
import math
import uuid
import shutil
import tempfile
import numpy as np
from typing import List, Dict, Any, Optional

import mediapipe as mp


router = APIRouter(prefix="/focus-rule", tags=["focus"])


# -----------------------------
# Landmark index for head pose
# -----------------------------
LANDMARK_INDEX = {
    "nose_tip": 1,
    "chin": 199,
    "left_eye_outer": 33,   
    "right_eye_outer": 263,
    "mouth_left": 61,
    "mouth_right": 291,
}


# -----------------------------
# Utility
# -----------------------------
def clamp(value: float, min_value: float = 0.0, max_value: float = 100.0) -> float:
    return max(min_value, min(max_value, value))


def is_forward_face(
    yaw: float,
    pitch: float,
    yaw_threshold: float = 25.0, # 고개의 좌우로 25도 <- 15 ~ 20 정도?로 
    pitch_threshold: float = 20.0, # 상하 20도 
) -> bool:
    if yaw is None or pitch is None:
        return False

    return abs(yaw) <= yaw_threshold and abs(pitch) <= pitch_threshold


def normalized_to_pixel(landmark, image_width: int, image_height: int) -> tuple[float, float]:
    x = landmark.x * image_width
    y = landmark.y * image_height
    return x, y


def rotation_matrix_to_euler_angles(rotation_matrix: np.ndarray) -> tuple[float, float, float]:
    """
    rotation matrix -> Euler angles (degrees)
    return: pitch, yaw, roll
    """
    sy = math.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
    singular = sy < 1e-6

    if not singular:
        x = math.atan2(rotation_matrix[2, 1], rotation_matrix[2, 2])   # pitch
        y = math.atan2(-rotation_matrix[2, 0], sy)                     # yaw
        z = math.atan2(rotation_matrix[1, 0], rotation_matrix[0, 0])   # roll
    else:
        x = math.atan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
        y = math.atan2(-rotation_matrix[2, 0], sy)
        z = 0

    pitch = math.degrees(x)
    yaw = math.degrees(y)
    roll = math.degrees(z)
    return pitch, yaw, roll


def get_camera_matrix(image_width: int, image_height: int) -> np.ndarray:
    focal_length = image_width
    center = (image_width / 2, image_height / 2)

    camera_matrix = np.array(
        [
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ],
        dtype=np.float64,
    )
    return camera_matrix


def get_face_center(face_landmarks, image_width: int, image_height: int) -> tuple[float, float]:
    xs = []
    ys = []

    for landmark in face_landmarks.landmark:
        x, y = normalized_to_pixel(landmark, image_width, image_height)
        xs.append(x)
        ys.append(y)

    return float(np.mean(xs)), float(np.mean(ys))

def normalize_angle(angle: float) -> float:
    """
    각도를 -180 ~ 180 범위로 정규화
    """
    while angle > 180:
        angle -= 360
    while angle < -180:
        angle += 360
    return angle


def calibrate_pitch(pitch: float) -> float:
    """
    solvePnP 결과에서 pitch가 -160~-180 부근으로 뒤집혀 나오는 경우 보정
    정면 근처를 0도 부근으로 맞추기 위한 임시 보정
    """
    pitch = normalize_angle(pitch)

    if pitch < -90:
        pitch += 180
    elif pitch > 90:
        pitch -= 180

    return pitch

def estimate_head_pose(
    face_landmarks,
    image_width: int,
    image_height: int,
) -> tuple[Optional[float], Optional[float], Optional[float]]:
    image_points = np.array(
        [
            normalized_to_pixel(face_landmarks.landmark[LANDMARK_INDEX["nose_tip"]], image_width, image_height),
            normalized_to_pixel(face_landmarks.landmark[LANDMARK_INDEX["chin"]], image_width, image_height),
            normalized_to_pixel(face_landmarks.landmark[LANDMARK_INDEX["left_eye_outer"]], image_width, image_height),
            normalized_to_pixel(face_landmarks.landmark[LANDMARK_INDEX["right_eye_outer"]], image_width, image_height),
            normalized_to_pixel(face_landmarks.landmark[LANDMARK_INDEX["mouth_left"]], image_width, image_height),
            normalized_to_pixel(face_landmarks.landmark[LANDMARK_INDEX["mouth_right"]], image_width, image_height),
        ],
        dtype=np.float64,
    )

    model_points = np.array(
        [
            (0.0, 0.0, 0.0),          # nose tip
            (0.0, -63.6, -12.5),      # chin
            (-43.3, 32.7, -26.0),     # left eye outer
            (43.3, 32.7, -26.0),      # right eye outer
            (-28.9, -28.9, -24.1),    # mouth left
            (28.9, -28.9, -24.1),     # mouth right
        ],
        dtype=np.float64,
    )

    camera_matrix = get_camera_matrix(image_width, image_height)
    dist_coeffs = np.zeros((4, 1), dtype=np.float64)

    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points,
        np.ascontiguousarray(image_points),
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE,
    )

    if not success:
        return None, None, None

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    pitch, yaw, roll = rotation_matrix_to_euler_angles(rotation_matrix)

    pitch = calibrate_pitch(pitch)
    yaw = normalize_angle(yaw)
    roll = normalize_angle(roll)

    return pitch, yaw, roll


# -----------------------------
# Video -> frame features 
# 얼굴 상하(Pitch(상하), Yaw(좌우), Roll(갸우뚱))
# -----------------------------
def extract_frames_features(video_path: str, max_faces: int = 1) -> List[Dict[str, Any]]:
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"영상을 열 수 없습니다: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    mp_face_mesh = mp.solutions.face_mesh
    results_list: List[Dict[str, Any]] = []

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=max_faces,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as face_mesh:
        frame_index = 0
       

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = frame_index / fps
            image_height, image_width = frame.shape[:2]

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_result = face_mesh.process(rgb_frame)

            if not mp_result.multi_face_landmarks:
                results_list.append(
                    {
                        "timestamp": round(timestamp, 3),
                        "frame_index": frame_index,
                        "face_detected": False,
                        "face_center_x": None,
                        "face_center_y": None,
                        "yaw": None,
                        "pitch": None,
                        "roll": None,
                    }
                )
                frame_index += 1
                continue

            face_landmarks = mp_result.multi_face_landmarks[0]
            face_center_x, face_center_y = get_face_center(face_landmarks, image_width, image_height)
            pitch, yaw, roll = estimate_head_pose(face_landmarks, image_width, image_height)

            results_list.append(
                {
                    "timestamp": round(timestamp, 3),
                    "frame_index": frame_index,
                    "face_detected": True,
                    "face_center_x": round(face_center_x, 2),
                    "face_center_y": round(face_center_y, 2),
                    "yaw": round(float(yaw), 2) if yaw is not None else None,
                    "pitch": round(float(pitch), 2) if pitch is not None else None,
                    "roll": round(float(roll), 2) if roll is not None else None,
                }
            )
            # surprise_spikes, emotion_scores, emotion_diffs, prev_emotion = test.analyze_emotion(frame,surprise_spikes, emotion_scores, emotion_diffs, prev_emotion)
            
            frame_index += 1



    cap.release()
    return results_list


# -----------------------------
# Frame features -> focus score 
# 얼굴이 화면에서 얼마나 이동했는지 고개각도는 얼마나 변했는지
# -----------------------------
def compute_frame_features(frames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    results = []
    prev = None

    for frame in frames:
        timestamp = frame["timestamp"]
        face_detected = frame["face_detected"]

        if not face_detected:
            results.append(
                {
                    "timestamp": timestamp,
                    "frame_index": frame["frame_index"],
                    "face_detected": False,
                    "movement": 0.0,
                    "angle_change": 0.0,
                    "forward_face": False,
                    "yaw": None,
                    "pitch": None,
                    "roll": None,
                }
            )
            prev = frame
            continue

        yaw = float(frame["yaw"])
        pitch = float(frame["pitch"])
        x = float(frame["face_center_x"])
        y = float(frame["face_center_y"])

        movement = 0.0
        angle_change = 0.0

        if prev is not None and prev["face_detected"]:
            px = float(prev["face_center_x"])
            py = float(prev["face_center_y"])
            pyaw = float(prev["yaw"])
            ppitch = float(prev["pitch"])

            movement = math.sqrt((x - px) ** 2 + (y - py) ** 2)
            angle_change = abs(yaw - pyaw) + abs(pitch - ppitch)

        results.append(
            {
                "timestamp": timestamp,
                "frame_index": frame["frame_index"],
                "face_detected": True,
                "movement": movement,
                "angle_change": angle_change,
                "forward_face": is_forward_face(yaw, pitch),
                "yaw": yaw,
                "pitch": pitch,
                "roll": float(frame["roll"]) if frame["roll"] is not None else None,
            }
        )

        prev = frame

    return results


def score_window(
    window_frames: List[Dict[str, Any]],
    movement_threshold: float = 8.0,
    angle_change_threshold: float = 12.0,
) -> Dict[str, Any]:
    total_count = len(window_frames)

    if total_count == 0:
        return {
            "focus_score": 0.0,
            "avg_movement": 0.0,
            "avg_angle_change": 0.0,
            "forward_ratio": 0.0,
            "missing_ratio": 1.0,
        }

    detected_frames = [f for f in window_frames if f["face_detected"]]
    detected_count = len(detected_frames)
    missing_count = total_count - detected_count

    if detected_count > 0:
        avg_movement = sum(f["movement"] for f in detected_frames) / detected_count
        avg_angle_change = sum(f["angle_change"] for f in detected_frames) / detected_count
        forward_ratio = sum(1 for f in detected_frames if f["forward_face"]) / detected_count
    else:
        avg_movement = 0.0
        avg_angle_change = 0.0
        forward_ratio = 0.0

    missing_ratio = missing_count / total_count

    movement_penalty = min(30.0, (avg_movement / movement_threshold) * 30.0)
    angle_penalty = min(30.0, (avg_angle_change / angle_change_threshold) * 30.0)
    missing_penalty = missing_ratio * 30.0
    forward_bonus = forward_ratio * 10.0

    focus_score = 100.0 - movement_penalty - angle_penalty - missing_penalty + forward_bonus
    focus_score = clamp(focus_score, 0.0, 100.0)

    return {
        "focus_score": round(focus_score, 2),
        "avg_movement": round(avg_movement, 2),
        "avg_angle_change": round(avg_angle_change, 2),
        "forward_ratio": round(forward_ratio, 2),
        "missing_ratio": round(missing_ratio, 2),
    }


def calculate_focus_by_window(
    frames: List[Dict[str, Any]],
    window_seconds: int = 5,
) -> Dict[str, Any]:
    if not frames:
        return {
            "window_seconds": window_seconds,
            "overall_focus_score": 0.0,
            "segments": [],
        }

    frame_features = compute_frame_features(frames)
    segments = []

    start_time = 0.0
    last_timestamp = frame_features[-1]["timestamp"]

    while start_time <= last_timestamp:
        end_time = start_time + window_seconds
        window_frames = [f for f in frame_features if start_time <= f["timestamp"] < end_time]

        if window_frames:
            segment_score = score_window(window_frames)
            segment_score["start"] = round(start_time, 2)
            segment_score["end"] = round(end_time, 2)
            segments.append(segment_score)

        start_time = end_time

    overall_focus_score = (
        sum(seg["focus_score"] for seg in segments) / len(segments)
        if segments
        else 0.0
    )

    return {
        "window_seconds": window_seconds,
        "overall_focus_score": round(overall_focus_score, 2),
        "segments": segments,
    }


# -----------------------------
# File save
# -----------------------------
def save_upload_file_to_temp(upload_file: UploadFile) -> str:
    suffix = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".mp4"
    temp_dir = tempfile.gettempdir()
    temp_filename = f"{uuid.uuid4().hex}{suffix}"
    temp_path = os.path.join(temp_dir, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return temp_path


# -----------------------------
# FastAPI endpoint
# -----------------------------
@router.post("/analyze")
async def analyze_focus(
    file: UploadFile = File(...),
    window_seconds: int = 5,
):
    allowed_ext = {".mp4", ".webm", ".avi", ".mov", ".mkv"}
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""

    if file_ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식입니다: {file_ext}")

    if window_seconds not in (5, 10):
        raise HTTPException(status_code=400, detail="window_seconds 는 5 또는 10만 허용합니다.")

    temp_video_path = None

    try:
        temp_video_path = save_upload_file_to_temp(file)

        frames = extract_frames_features(temp_video_path)
        focus_result = calculate_focus_by_window(frames, window_seconds=window_seconds)

        response_data = {
            "filename": file.filename,
            "window_seconds": window_seconds,
            "total_frames": len(frames),
            "overall_focus_score": focus_result["overall_focus_score"],
            "segments": focus_result["segments"],
            "frames_preview": frames[:10],
            "frames_preview_last": frames[-10:] if len(frames) >= 10 else frames,
        }

        return JSONResponse(content=response_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류 발생: {str(e)}")
    finally:
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)