# JINRO_IS_BACK

AI 기반 진로 상담 지원 서비스 프로젝트입니다.  
학생이 진로 탐색용 영상을 시청하고 설문에 응답하면, 시스템이 영상 집중도와 관심도를 분석합니다. 이후 상담사는 학생별 상담 일정 관리, 상담 내용 기록, AI 분석 결과 확인, 최종 리포트 작성까지 한 흐름으로 진행할 수 있습니다.

## 프로젝트 개요

- 학생 측 기능
  - 학생 정보 입력 및 로그인
  - 진로 카테고리 선택
  - 영상 시청 및 설문 응답
  - 영상 업로드 후 AI 분석 요청
- 상담사 측 기능
  - 상담사 로그인
  - 카테고리 및 영상 관리
  - 상담 대기 학생 확인
  - 상담 일정 등록 및 관리
  - 상담 음성 업로드, STT, 요약 결과 확인
  - AI 분석 리포트 및 최종 상담 리포트 작성
- AI 기능
  - 영상 기반 집중도 분석
  - 영상 기반 관심도 분석
  - 음성 STT 변환
  - 상담 내용 요약 및 코멘트 생성

## 주요 흐름

1. 학생이 로그인 후 진로 카테고리를 선택합니다.
2. 선택한 카테고리별 영상 시청과 설문 응답을 진행합니다.
3. 학생 영상이 업로드되면 AI 서버가 영상을 저장합니다.
4. 백엔드는 AI 서버에 분석 작업을 요청합니다.
5. AI 서버는 집중도와 관심도를 분석한 뒤 콜백으로 결과를 전달합니다.
6. 상담사는 학생별 분석 결과를 확인하고 상담을 진행합니다.
7. 상담 음성을 업로드하면 STT와 요약 결과가 생성됩니다.
8. 상담사는 최종 리포트를 저장하거나 완료 처리합니다.

## 기술 스택

### Frontend
- React 19
- Vite
- React Router
- Redux Toolkit
- Axios
- Recharts
- FullCalendar
- html2canvas / jsPDF
- react-webcam

### Backend
- FastAPI
- SQLAlchemy
- MySQL
- Pydantic
- httpx

### AI Server
- FastAPI
- OpenCV
- MediaPipe
- TensorFlow
- PyTorch / Torchvision
- Whisper / faster-whisper
- Ollama
- OpenAI API

## 디렉터리 구조

```text
JINRO_IS_BACK/
├─ JINRO_PROJ/
│  ├─ frontend/      # React 기반 사용자 화면
│  ├─ backend/       # 메인 API 서버, DB 연동, 상담/학생 기능
│  ├─ ai_server/     # 영상/음성 분석 서버
│  └─ videopath/     # 영상 관련 리소스
├─ Story_Board/      # 기획 자료
└─ README.md
```

## 서비스 구조

### 1. Frontend
- 학생 화면
  - 로그인
  - 약관 동의
  - 카테고리 선택
  - 설문
  - 영상 촬영 및 업로드
  - 완료 화면
- 상담사 화면
  - 로그인
  - 일정 캘린더
  - 학생 목록
  - 카테고리 관리
  - 상담 리포트
  - AI 분석 리포트
  - 최종 리포트

### 2. Backend
- 기본 실행 포트: `8000`
- 주요 역할
  - 학생/상담사 API 제공
  - 세션 관리
  - MySQL 연동
  - 상담/리포트 데이터 저장
  - AI 서버와의 통신 및 분석 결과 수신

### 3. AI Server
- 기본 실행 포트: `8001`
- 주요 역할
  - 학생 영상 저장
  - 집중도 및 관심도 분석
  - 상담 음성 업로드 처리
  - STT 변환
  - 상담 내용 요약
  - 백엔드 콜백 전달

## 핵심 API 예시

### 학생 관련
- `POST /client/login`
- `GET /client/list/{kind_id}`
- `GET /client/survey/{category_id}`
- `POST /client/counselling`
- `POST /client/video/upload/{counseling_id}`
- `POST /client/complete/video`

### 상담사 관련
- `POST /counselor/login`
- `GET /counselor/pending-students`
- `PUT /counselor/schedule/{counseling_id}`
- `GET /counselor/students`
- `POST /counselor/report/con/{counseling_id}/audio`
- `GET /counselor/report/final/{counseling_id}`
- `POST /counselor/report/final/complete`

### AI 서버 관련
- `POST /ai/upload-video`
- `POST /ai/start-analysis`
- `POST /ai/audio/upload/{counseling_id}`
- `POST /ai/api/summarize`
- `GET /ai/audio/load/{counseling_id}`

## 실행 환경

- Python `3.10.9`
- Node.js / npm 필요
- MySQL 필요

Python 3.10 계열을 사용한 이유는 일부 패키지, 특히 `mediapipe` 호환성 이슈를 고려한 것으로 보입니다.

## 설치 및 실행 방법

### 1. 저장소 이동

```bash
cd JINRO_IS_BACK/JINRO_PROJ
```

### 2. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

- 기본 개발 서버: `http://127.0.0.1:5173`

### 3. Backend 실행

```bash
cd backend
pip install -r requirements.txt
python run.py
```

- 기본 서버: `http://127.0.0.1:8000`

### 4. AI Server 실행

```bash
cd ai_server
pip install -r requirements.txt
python run.py
```

- 기본 서버: `http://127.0.0.1:8001`

## 환경변수

### Backend `.env`

아래 값들이 필요합니다.

```env
DB_USERNAME=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=

BACKEND_URL=http://127.0.0.1:8000
AI_SERVER_URL=http://127.0.0.1:8001
FRONTEND_URL=http://127.0.0.1:5173
SESSION_SECRET_KEY=

LOG_DIR=logs
BACKEND_LOG_FILE=backend_error.log
LOG_LEVEL=ERROR
LOG_ROTATION_WHEN=midnight
LOG_ROTATION_INTERVAL=1
LOG_BACKUP_COUNT=30
```

### AI Server `.env`

```env
BACKEND_URL=http://127.0.0.1:8000
OPENAI_API_KEY=

UPLOAD_DIR=uploads
LOG_DIR=logs
AI_LOG_FILE=ai_debug.log
LOG_LEVEL=INFO
LOG_ROTATION_WHEN=midnight
LOG_ROTATION_INTERVAL=1
LOG_BACKUP_COUNT=30
```

## 데이터 저장 및 로그

- Backend
  - `logs/`
  - `audio_records/`
  - `recorded_videos/`
- AI Server
  - `logs/`
  - `audio_uploads/`
  - `videos/`
  - `model/`
  - `uploads/`

## 기대 효과

- 학생의 주관적 설문 결과와 영상 기반 행동 분석을 함께 활용할 수 있습니다.
- 상담사는 일정 관리부터 상담 리포트 작성까지 한 시스템에서 처리할 수 있습니다.
- 상담 음성 기록과 AI 요약을 통해 상담 품질과 문서화 효율을 높일 수 있습니다.

## 보완하면 좋은 항목

아래 내용이 추가되면 README 완성도가 더 높아집니다.

- 서비스 소개 이미지 또는 화면 캡처
- ERD 이미지
- 팀원 구성 및 역할
- 배포 주소
- 시연 영상 링크
- 모델 학습 방식 및 성능 지표

## 한 줄 소개

학생 진로 탐색 영상과 상담 데이터를 기반으로, AI 분석과 상담 리포트 작성을 연결해주는 진로 상담 지원 플랫폼입니다.
