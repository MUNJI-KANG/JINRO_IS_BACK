from __future__ import annotations

import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from faster_whisper import WhisperModel


# Whisper 모델 로드
MODEL_NAME = "small"
model = None

def get_model():
    global model

    if model is None:

        print(f"[STT] faster-whisper 모델 로딩 시작: {MODEL_NAME}")

        model = WhisperModel(
            MODEL_NAME,
            device="cpu",
            compute_type="int8"  # 속도 최적화
        )

        print(f"[STT] faster-whisper 모델 로딩 완료: {MODEL_NAME}")

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

def speech_to_text(audio_path: str | Path) -> dict:
    """
    전체 파이프라인
    webm → wav 변환 → whisper STT
    반환값:
    {
        "text": 전체 텍스트,
        "segments": whisper segments
    }
    """

    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise FileNotFoundError(f"오디오 파일이 존재하지 않습니다: {audio_path}")

    temp_root = Path(tempfile.mkdtemp(prefix="stt_work_"))

    try:
        wav_dir = temp_root / "wav"

        wav_path = convert_webm_to_wav(audio_path, wav_dir)

        loaded_model = get_model()

        segments, info = loaded_model.transcribe(
            str(wav_path),
            language="ko",
            beam_size=1,
            vad_filter=True # 무음 구간 제거
        )

        segments_list = []
        text_all = ""

        for segment in segments:

            text_all += segment.text + " "

            segments_list.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text
            })

        return {
            "text": text_all.strip(),
            "segments": segments_list
        }

    finally:
        shutil.rmtree(temp_root, ignore_errors=True)