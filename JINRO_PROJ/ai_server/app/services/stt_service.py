from __future__ import annotations
import os
import shutil
import subprocess
import tempfile

from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
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

# 오디오 split
def split_audio(input_path: Path, chunk_minutes=5):
    """
    audio를 N분 단위로 split
    """
    temp_dir = input_path.parent / f"chunks_{os.getpid()}"
    temp_dir.mkdir(exist_ok=True)

    chunk_pattern = temp_dir / "chunk_%03d.wav"

    cmd = [
        "ffmpeg",
        "-i", str(input_path),
        "-f", "segment",
        "-segment_time", str(chunk_minutes * 60),
        "-acodec", "pcm_s16le",
        str(chunk_pattern)
    ]

    _run_ffmpeg(cmd)

    return sorted(temp_dir.glob("chunk_*.wav"))


def transcribe_file(audio_file: Path):

    loaded_model = get_model()

    segments, info = loaded_model.transcribe(
        str(audio_file),
        language="ko",
        beam_size=1,
        vad_filter=True,
        condition_on_previous_text=False
    )

    result = []

    for s in segments:
        result.append({
            "start": s.start,
            "end": s.end,
            "text": s.text
        })

    return result

def speech_to_text(audio_path: str | Path) -> dict:

    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise FileNotFoundError(f"오디오 파일이 존재하지 않습니다: {audio_path}")

    temp_root = Path(tempfile.mkdtemp(prefix="stt_work_"))

    try:

        wav_dir = temp_root / "wav"
        wav_path = convert_webm_to_wav(audio_path, wav_dir)

        # 1️⃣ audio split
        chunks = split_audio(wav_path)

        all_segments = []

        # 2️⃣ STT 병렬 실행
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = executor.map(transcribe_file, chunks)

        for segs in results:
            all_segments.extend(segs)

        text_all = " ".join([s["text"] for s in all_segments])

        return {
            "text": text_all.strip(),
            "segments": all_segments
        }

    finally:
        shutil.rmtree(temp_root, ignore_errors=True)