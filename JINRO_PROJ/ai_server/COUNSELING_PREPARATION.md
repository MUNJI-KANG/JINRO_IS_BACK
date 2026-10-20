# Counseling Preparation Agent

The counselor student list includes a preparation action for each counseling
session. Generate a draft, edit its summary and five questions, save, and confirm.
Confirmed preparations are read-only. Concurrent changes return HTTP 409; reload
before editing again.

## Local Model

Install the AI server requirements in its existing virtual environment:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
ollama serve
```

The default model is `mistral:latest`. It must already be installed in Ollama.
If necessary, download it separately with `ollama pull mistral:latest`.
`PREPARATION_MODEL` selects another installed model supporting tool calls and
structured output. Model quality, speed, and tool behavior vary by model.

Inference uses the fixed local endpoint `http://127.0.0.1:11434`. This feature
does not use OpenAI or external model endpoints, and LangSmith tracing is
explicitly disabled. Existing unrelated AI features retain their own settings.
Counseling records remain sensitive even when processed locally; protect local
storage and restrict server access.

The backend needs its existing `AI_SERVER_URL` setting pointing to the AI server.
Restart both API servers after installing dependencies. The backend's existing
startup table creation adds `COUNSELING_PREPARATION` to MySQL.
Generation may take several minutes on local hardware. The backend waits up to
360 seconds and the preparation screen waits up to 370 seconds.

## Graph And Evidence

LangGraph executes research, optional tool calls, and a structured draft.
At most two research turns and four tools per turn are allowed. Available tools
read the student's earlier completed notes from the same assigned counselor and
search registered career video titles. Explicit additional video requests search
one external YouTube video. Tool calls and retrieved evidence are stored with the draft.

Only the assigned counselor can read or change a preparation. Failed video
analysis is treated as unavailable, not zero. Video behavior scores must not be
treated as verified aptitude or genuine interest. Generated advice requires
counselor review; prompts and schema validation cannot guarantee factual quality.

## Verification

From each server directory:

```powershell
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

From the project directory, with MySQL, Ollama and both API servers plus Vite
running:

```powershell
$env:PREPARATION_LIVE = '1'
.\backend\venv\Scripts\python.exe -X utf8 .verification/preparation_browser.py
```

The browser script creates a temporary test student and counseling session,
generates through the live model, edits, reloads and confirms, then deletes its
test database rows. Without `PREPARATION_LIVE=1`, it uses a deterministic draft
fixture to test persistence and UI independently of model availability.

## 상담사 추가 요청

상담 준비 생성 또는 다시 생성 버튼을 누르면 추가 요청 입력창이 열립니다.
추가 요청은 선택 사항이며 최대 2000자입니다. 비워두면 기본 지침으로 생성합니다.
기존 초안이 있으면 새 결과로 교체되며, 확정된 준비 자료는 기존처럼 재생성이 차단됩니다.

백엔드는 `POST /counselor/preparation/{counseling_id}/generate`의 선택 본문
`{"additional_prompt": "소프트웨어 관련 탐색 영상을 찾아주세요."}`를 검증합니다.
본문 없는 기존 호출도 지원합니다. 요청은 로컬 AI 서버를 거쳐 LangGraph의 조사 단계와
구조화된 초안 작성 단계에 모두 전달하며, 기존 기본 지침을 대체하지 않습니다.
추가 요청 자체를 학생 사실이나 조회 근거로 취급하지 않고 기존 근거 ID 검사와 도구 호출 제한을 유지합니다.
영상 검색 요청은 외부 YouTube Data API로 관련 영상 1개를 찾습니다. 학생 추가 검사 배정은 수행하지 않습니다.
추가 요청이 있으면 LangGraph의 요청 분류 단계에서 영상 검색 여부와 검색어를 구조화해 판단합니다.
영상 검색 요청으로 판단되면 외부 유튜브 검색 도구를 먼저 실행한 뒤 조사·초안 작성으로 진행합니다.
요청 분류를 포함한 전체 도구 실행은 최대 8회로 제한합니다.
검색 결과의 영상 번호·제목·채널·링크를 모델이 아닌 API 응답에서 구성하여 탐색 영상에 저장합니다.
검색 결과가 없다면 외부 탐색 영상은 비어 있습니다. 영상 내용이나 자막을 읽은 것으로 해석하지 않습니다.
`YOUTUBE_API_KEY`를 사용하며, 기존 설정과 호환하기 위해 `VITE_YOUTUBE_API_KEY`도 지원합니다.
키는 서버에서만 사용하고 요청 URL이 아닌 헤더로 전달합니다. 검색어만 외부로 전송하며
학생 이름·연락처·상담 원문을 검색어에 넣지 않도록 요청 분류 지침을 적용합니다.
API 키 누락·검색 실패 시 한국어 오류를 표시하고 이전 초안은 유지합니다.

입력창에서 취소 또는 Escape로 닫으면 생성 요청을 보내지 않습니다. 생성 중에는 중복 제출과
닫기를 차단합니다. 실패하면 요청 문구를 유지하여 수정·재시도할 수 있습니다.
추가 요청은 화면을 새로고침하면 초기화되며, 별도 DB 컬럼에는 저장하지 않습니다.

검증 실행:

```powershell
.\backend\venv\Scripts\python.exe -X utf8 .verification/preparation_prompt_browser.py
```

이 검증은 별도 테스트 학생을 만들고 입력창·취소·오류 재시도와 실제 로컬 모델의
외부 유튜브 검색·조회 근거·링크 표시·저장 재조회를 확인한 뒤 테스트 DB 행을 정리합니다.
성공·실패 기록은 `.verification/preparation-prompt-result.json`에 한국어로 작성합니다.
