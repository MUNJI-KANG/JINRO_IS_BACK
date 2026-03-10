from __future__ import annotations

import math
import shutil
import subprocess
import tempfile
from pathlib import Path

import whisper


# Whisper 모델 로드
# 속도를 우선하면 "turbo", 안정적으로 가려면 "base"
MODEL_NAME = "base"
model = None


def get_model():
    global model
    if model is None:
        print(f"[STT] Whisper 모델 로딩 시작: {MODEL_NAME}")
        model = whisper.load_model(MODEL_NAME)
        print(f"[STT] Whisper 모델 로딩 완료: {MODEL_NAME}")
    return model


def _run_ffmpeg(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"FFmpeg 실행 실패\n"
            f"CMD: {' '.join(cmd)}\n"
            f"STDERR: {result.stderr}"
        )


def convert_webm_to_wav(input_path: str | Path, output_dir: str | Path) -> Path:
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"{input_path.stem}.wav"

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-ac", "1",          # mono
        "-ar", "16000",      # 16kHz
        str(output_path),
    ]
    _run_ffmpeg(cmd)
    return output_path

def speech_to_text(audio_path: str | Path) -> str:
    """
    전체 파이프라인
    webm → wav 변환 → whisper STT
    """
    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise FileNotFoundError(f"오디오 파일이 존재하지 않습니다: {audio_path}")

    temp_root = Path(tempfile.mkdtemp(prefix="stt_work_"))

    try:
        wav_dir = temp_root / "wav"

        wav_path = convert_webm_to_wav(audio_path, wav_dir)

        loaded_model = get_model()

        result = loaded_model.transcribe(
            str(wav_path),
            language="ko",
            fp16=False
        )

        text = (result.get("text") or "").strip()

        return text

    finally:
        shutil.rmtree(temp_root, ignore_errors=True)
