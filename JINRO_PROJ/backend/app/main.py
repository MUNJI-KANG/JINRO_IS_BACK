# main.py
# uvicorn main:app --reload 실행코드
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.emotion_analysis import analyze_emotion
from app.services.attention_analysis import analyze_attention



app = FastAPI()

# React 앱이 돌아가는 주소를 허용해줘야 통신이 됩니다.
origins = [
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_video():

    video_path = r"C:\Users\msi\Downloads\test.webm"

    emotion_score = analyze_emotion(video_path)
    attention_score = analyze_attention(video_path)

    interest_score = (
        0.6 * emotion_score +
        0.4 * attention_score
    )

    return {
        "emotion_score": emotion_score,
        "attention_score": attention_score,
        "interest_score": round(interest_score, 2)
    }
