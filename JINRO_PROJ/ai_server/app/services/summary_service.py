from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import re
from concurrent.futures import ThreadPoolExecutor
import time

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ─────────────────────────────────────────
# JSON 스키마 강제 — Pydantic 모델 정의
# GPT가 반드시 이 구조로 반환
# → 파싱 실패 없음
# → career_recommendation 항상 list[str] 보장
# → 프론트엔드에서 바로 렌더링 가능
# ─────────────────────────────────────────
class CounselingResult(BaseModel):
    interest_field:        str
    low_interest_field:    str
    student_trait:         str
    career_recommendation: list[str]
    summary:               str


# -----------------------------
# filler 제거
# -----------------------------
def clean_text(text: str):
    text = re.sub(r"\b(음+|어+|그+|아+)\b", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# -----------------------------
# Whisper segment → semantic chunk
# -----------------------------
def build_chunks_from_segments(segments, max_chars=2500):
    chunks = []
    current_chunk = ""

    for seg in segments:
        text = clean_text(seg["text"])
        if len(current_chunk) + len(text) < max_chars:
            current_chunk += " " + text
        else:
            chunks.append(current_chunk.strip())
            current_chunk = text

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


# -----------------------------
# [주석 처리] Map 단계 (chunk 요약) - Map-Reduce 방식
# 상담 대화는 앞뒤 맥락이 이어지는 특성상 Refine 방식으로 교체
# -----------------------------
# def summarize_chunk(chunk: str):
#     prompt = f"""
# 다음은 학생과 상담사가 진행한 진로 상담 녹취 일부입니다.
# 핵심 상담 내용을 간결하게 정리하세요.
# 요약 기준
# - 학생이 관심을 보인 직업 또는 분야
# - 학생의 감정 반응 또는 태도
# - 상담사가 제시한 조언
# - 진로 관련 핵심 발언
# 3~4문장 이내로 요약하세요.
# 상담 녹취:
# {chunk}
# """
#     res = client.chat.completions.create(
#         model="gpt-4o-mini",
#         messages=[
#             {"role": "system", "content": "당신은 학교 진로 상담 내용을 정리하는 AI입니다."},
#             {"role": "user", "content": prompt}
#         ],
#         temperature=0.2,
#         max_tokens=400
#     )
#     return res.choices[0].message.content.strip()


# -----------------------------
# [주석 처리] 병렬 Map 처리 - Map-Reduce 방식
# 상담 대화는 순서·맥락이 중요하므로 병렬 처리 대신 Refine 방식으로 교체
# -----------------------------
# def summarize_chunks(chunks):
#     summaries = []
#     def safe_summarize(chunk, max_retries=3):
#         for attempt in range(max_retries):
#             try:
#                 return summarize_chunk(chunk)
#             except Exception as e:
#                 print(f"[청크 요약 실패] {attempt+1}/{max_retries}회: {e}")
#                 if attempt < max_retries - 1:
#                     time.sleep(2)
#         print(f"[청크 요약 최종 실패] 해당 청크 건너뜀")
#         return ""
#     with ThreadPoolExecutor(max_workers=4) as executor:
#         results = executor.map(safe_summarize, chunks)
#     for r in results:
#         if r:
#             summaries.append(r)
#     if not summaries:
#         raise ValueError("모든 청크 요약에 실패했습니다.")
#     return summaries


# -----------------------------
# Refine 단계 - 단일 청크 처리
# 이전 누적 요약 + 새 청크 → 갱신된 누적 요약
# 실패 시: 기존 요약 유지 (흐름 끊기지 않음)
# -----------------------------
def refine_chunk(existing_summary: str, new_chunk: str, max_retries=3) -> str:

    if not existing_summary:
        prompt = f"""
    당신은 학교 진로 상담 전문 분석가입니다.
    아래 상담 녹취의 핵심 내용을 구조화된 형식으로 정리하세요.

    [분석 항목]
    1. 관심 직업/분야: 학생이 언급하거나 긍정적 반응을 보인 직업·분야
    2. 감정·태도: 학생의 감정 상태, 자신감, 불안, 열의 등
    3. 상담사 조언: 상담사가 제시한 구체적 조언이나 방향
    4. 핵심 발언: 진로 결정에 영향을 줄 수 있는 학생의 핵심 발언

    [출력 형식]
    - 각 항목을 명확히 구분해서 작성
    - 확인된 내용만 작성, 없으면 "언급 없음"으로 표기
    - 4~5문장으로 작성

    [상담 녹취]
    {new_chunk}
    """
    else:
        prompt = f"""
    당신은 학교 진로 상담 전문 분석가입니다.
    기존 누적 요약에 새로운 녹취 내용을 반영하여 요약을 갱신하세요.

    [중요 규칙]
    - 기존 요약의 핵심 정보는 반드시 유지하세요
    - 새 내용에서 변화가 생기면 "→ 변화" 형식으로 반영하세요
    - 확인되지 않은 내용은 절대 추가하지 마세요
    - 기존 요약과 새 내용이 충돌하면 최신 내용을 우선하세요

    [기존 누적 요약]
    {existing_summary}

    [새로운 녹취 내용]
    {new_chunk}

    [분석 항목 유지]
    1. 관심 직업/분야: 변화 있으면 반영, 없으면 유지
    2. 감정·태도: 변화 있으면 반영, 없으면 유지
    3. 상담사 조언: 새로운 조언 추가
    4. 핵심 발언: 중요 발언 누적

    5~6문장으로 갱신된 요약을 작성하세요.
    """

    for attempt in range(max_retries):
        try:
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "당신은 학교 진로 상담 내용을 정리하는 AI입니다."},
                    {"role": "user",   "content": prompt}
                ],
                temperature=0.2,
                max_tokens=400
            )
            return res.choices[0].message.content.strip()

        except Exception as e:
            print(f"[Refine 실패] {attempt+1}/{max_retries}회: {e}")
            if attempt < max_retries - 1:
                time.sleep(1)

    print("[Refine 최종 실패] 기존 누적 요약 유지")
    return existing_summary


# -----------------------------
# Refine 전체 실행
# 청크 순서대로 누적 요약 갱신
# -----------------------------
def refine_chunks(chunks: list) -> str:
    accumulated_summary = ""

    for i, chunk in enumerate(chunks):
        print(f"[Refine] {i+1}/{len(chunks)} 청크 처리 중...")
        accumulated_summary = refine_chunk(accumulated_summary, chunk)

    if not accumulated_summary:
        raise ValueError("모든 청크 Refine에 실패했습니다.")

    return accumulated_summary


# =====================================================================
# Reduce 단계 — Structured Output 적용
# ✅ 기존: 프롬프트로 JSON 형식 요청 → GPT가 어길 수 있음
#          정규식 파싱 + json.loads() + try/except 필요
# ✅ 변경: Pydantic 스키마로 완전 강제
#          → 파싱 실패 없음
#          → career_recommendation 항상 list[str] 보장
#          → 정규식, json.loads(), try/except 전부 불필요
# =====================================================================
def summarize_final(text, video_analyze):

    prompt = f"""
당신은 20년 경력의 전문 학교 진로 상담사입니다.
학생의 정성적인 '상담 요약'과 정량적인 '영상분석' 데이터를 종합 분석하여
최적의 진로를 추천하는 것이 당신의 역할입니다.

[분석 원칙]
- 상담 요약과 영상분석 두 데이터가 일치하면 신뢰도 높음으로 판단합니다
- 두 데이터가 다를 경우 상담 내용을 우선하되 영상 점수를 참고합니다
- 확인된 근거가 있는 내용만 작성하고, 근거 없이 단정하지 마세요
- 추정이 필요한 경우 반드시 "(추정)" 을 붙이세요

[데이터 분석 기준]
1. interest_field:
   - 상담 요약에서 학생이 긍정적으로 언급한 분야
   - 영상분석에서 흥미도 점수가 높은 분야
   - 두 데이터를 종합하여 가장 관심도가 높은 분야 1개를 도출하세요
   - 출력 시 근거를 함께 표기하세요 (상담 기반 / 영상분석 기반 / 둘 다 일치)

2. low_interest_field:
   - 상담 요약에서 학생이 부정적으로 언급하거나 회피한 분야
   - 영상분석에서 집중도·흥미도 점수가 낮은 분야
   - 두 데이터를 종합하여 관심도가 가장 낮은 분야 1개를 도출하세요
   - 출력 시 근거를 함께 표기하세요 (상담 기반 / 영상분석 기반 / 둘 다 일치)

3. student_trait:
   - 상담 대화에서 드러난 학생의 주요 성향을 3가지 키워드로 작성하세요
   - 예: 분석적, 창의적, 탐구적, 공감능력, 봉사지향, 실천적 등
   - 쉼표로 구분하여 출력하세요

4. career_recommendation:
   [영상분석 최종점수 50점 이상인 경우]
   - 영상분석 최종점수 내림차순으로 1차 정렬합니다
   - student_trait과 부합하는지 교차검증 후 최종 5가지를 선정합니다

   [영상분석 최종점수 50점 미만인 경우]
   - 상담에서 학생이 직접 언급하거나 흥미를 보인 직업을 우선합니다
   - student_trait과 부합하는지 교차검증 후 최종 5가지를 선정합니다

5. summary:
   - 학생의 고민 → 관심 방향 → 상담사 조언 → 최종 방향성 순서로 작성
   - 4~6줄로 작성하세요

[입력 데이터]
[상담 요약]
{text}

[영상분석]
{video_analyze}
"""

    for attempt in range(3):
        try:
            # ✅ Structured Output 적용
            # response_format에 Pydantic 모델을 넣으면
            # GPT가 반드시 해당 스키마 구조로 반환 보장
            res = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "당신은 진로 상담 분석 전문 AI입니다."},
                    {"role": "user",   "content": prompt}
                ],
                response_format=CounselingResult,  # ← 스키마 강제
                # temperature=0.2,
                max_tokens=800
            )

            # ✅ 파싱 없이 바로 객체로 접근
            result = res.choices[0].message.parsed

            # ✅ 딕셔너리로 변환해서 반환 (기존 코드와 호환)
            return {
                "interest_field":        result.interest_field,
                "low_interest_field":    result.low_interest_field,
                "student_trait":         result.student_trait,
                "career_recommendation": result.career_recommendation,
                "summary":               result.summary
            }

        except Exception as e:
            print(f"[summarize_final 실패] {attempt+1}/3회: {e}")
            if attempt < 2:
                time.sleep(1)

    # 3번 다 실패 시 기본값 반환
    return {
        "interest_field":        "",
        "low_interest_field":    "",
        "student_trait":         "",
        "career_recommendation": [],
        "summary":               "분석 결과를 가져오는 데 실패했습니다."
    }


# -----------------------------
# 전체 파이프라인
# -----------------------------
def summarize_text(stt_result, ai_report):

    if not stt_result or "segments" not in stt_result or not stt_result["segments"]:
        return {
            "interest_field":        "",
            "low_interest_field":    "",
            "student_trait":         "",
            "career_recommendation": [],
            "summary":               "음성 내용이 인식되지 않았습니다."
        }

    segments = stt_result["segments"]

    # 1️⃣ segment 기반 chunk 분할
    chunks = build_chunks_from_segments(segments)

    # 2️⃣ Refine — 청크 순서대로 누적 요약
    try:
        refined_summary = refine_chunks(chunks)
    except ValueError:
        return {
            "interest_field":        "",
            "low_interest_field":    "",
            "student_trait":         "",
            "career_recommendation": [],
            "summary":               "상담 내용 분석에 실패했습니다."
        }

    # 3️⃣ Reduce — 누적 요약 + 영상 분석 데이터 → 최종 JSON
    final_summary = summarize_final(refined_summary, ai_report)

    return final_summary