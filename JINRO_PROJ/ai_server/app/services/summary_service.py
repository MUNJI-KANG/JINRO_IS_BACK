from openai import OpenAI
from dotenv import load_dotenv
import os
import re
import json
from concurrent.futures import ThreadPoolExecutor
import time 

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
def summarize_chunk(chunk: str):

    prompt = f"""
다음은 학생과 상담사가 진행한 진로 상담 녹취 일부입니다.

핵심 상담 내용을 간결하게 정리하세요.

요약 기준
- 학생이 관심을 보인 직업 또는 분야
- 학생의 감정 반응 또는 태도
- 상담사가 제시한 조언
- 진로 관련 핵심 발언

3~4문장 이내로 요약하세요.

상담 녹취:
{chunk}
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "당신은 학교 진로 상담 내용을 정리하는 AI입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=400
    )

    return res.choices[0].message.content.strip()


# -----------------------------
# [주석 처리] 병렬 Map 처리 - Map-Reduce 방식
# 상담 대화는 순서·맥락이 중요하므로 병렬 처리 대신 Refine 방식으로 교체
# -----------------------------
def summarize_chunks(chunks):

    summaries = []

    def safe_summarize(chunk, max_retries=3):
        for attempt in range(max_retries):
            try:
                return summarize_chunk(chunk)
            except Exception as e:
                print(f"[청크 요약 실패] {attempt+1}/{max_retries}회: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)

        print(f"[청크 요약 최종 실패] 해당 청크 건너뜀")
        return ""

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = executor.map(safe_summarize, chunks)

    for r in results:
        if r:
            summaries.append(r)

    if not summaries:
        raise ValueError("모든 청크 요약에 실패했습니다.")

    return summaries


# -----------------------------
# Refine 단계 - 단일 청크 처리
# 이전 누적 요약 + 새 청크 → 갱신된 누적 요약
# 실패 시: 기존 요약 유지 (흐름 끊기지 않음)
# -----------------------------
def refine_chunk(existing_summary: str, new_chunk: str, max_retries=3) -> str:

    # 첫 번째 청크는 기존 요약 없이 시작
    if not existing_summary:
        prompt = f"""
다음은 학생과 상담사가 진행한 진로 상담 녹취 일부입니다.

핵심 상담 내용을 간결하게 정리하세요.

요약 기준
- 학생이 관심을 보인 직업 또는 분야
- 학생의 감정 반응 또는 태도
- 상담사가 제시한 조언
- 진로 관련 핵심 발언

3~4문장 이내로 요약하세요.

상담 녹취:
{new_chunk}
"""
    else:
        # 두 번째 청크부터는 기존 누적 요약 + 새 내용 합산 후 갱신
        prompt = f"""
다음은 학생과 상담사가 진행한 진로 상담의 누적 요약과 새로운 녹취 내용입니다.

[지금까지의 요약]
{existing_summary}

[새로운 녹취 내용]
{new_chunk}

위 두 내용을 합쳐서 전체 상담 흐름이 유지되도록 요약을 갱신하세요.

요약 기준
- 학생이 관심을 보인 직업 또는 분야 (변화가 있으면 반영)
- 학생의 감정 반응 또는 태도 (변화가 있으면 반영)
- 상담사가 제시한 조언
- 진로 관련 핵심 발언

4~6문장 이내로 갱신된 요약을 작성하세요.
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

    # 3번 다 실패 시 기존 누적 요약 유지 (흐름 끊기지 않음)
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


# -----------------------------
# Reduce 단계 (최종 요약)
# -----------------------------
def summarize_final(text, video_analyze):

    prompt = f"""
    당신은 20년 경력의 전문 학교 진로 상담사입니다. 학생의 정성적인 '상담 요약'과 정량적인 '영상분석' 데이터를 종합적으로 분석하여 최적의 진로를 추천하는 것이 당신의 역할입니다.
    반드시 아래에 제시된 JSON 형식으로만 답변을 출력하고, 마크다운 코드 블록(```json ... ```)이나 추가적인 설명은 절대 포함하지 마세요.

    # 데이터 분석 기준:
    1. interest_field: '상담 요약'과 '영상분석(흥미도 점수)'를 종합하여 가장 관심도가 높은 분야 도출.
    2. low_interest_field: '상담 요약'과 '영상분석(흥미도 및 집중도 점수)'를 종합하여 관심도가 가장 낮은 분야 도출.
    3. student_trait: '상담 요약'에 나타난 대화 내용을 바탕으로 학생의 주요 성향(예: 분석적, 창의적, 탐구적 등)을 3가지 키워드로 요약.
    4. career_recommendation: 
    - '영상분석'의 "최종점수"가 높은 직업을 1차적으로 우선순위에 둡니다.
    - '영상분석'에서 최종점수가 50점 이상이면 점수순으로 높은순위로 가도록 하고 그게 아니라면 상담사하고 얘기핬을때 흥미있는 직업을 높은순위로 올려줘
    - 단, 단순 점수 나열에 그치지 않고 '상담 요약'에서 파악된 학생의 성향(student_trait)과 잘 부합하는지 교차 검증하여 최종 5가지 직업을 선정합니다.
    - 출력형식은 ['진로명', '진로명', ...]
    5. summary: 전체 상담 내용과 데이터 분석 결과를 아우르는 핵심 요약 (4~6줄).

    # 입력 데이터:
    [상담 요약]
    {text}

    [영상분석]
    {video_analyze}

    # 출력 형식 (Strict JSON):
    {{
        "interest_field": "",
        "low_interest_field": "",
        "student_trait": "",
        "career_recommendation": [],
        "summary": ""
    }}
    """

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "진로 상담 분석 AI입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=800
    )

    content = res.choices[0].message.content.strip()
    content = re.sub(r"```json|```", "", content).strip()

    if not content.startswith("{"):
        match = re.search(r"\{.*\}", content, re.DOTALL)
        content = match.group(0) if match else content

    try:
        return json.loads(content)

    except Exception:
        return {
            "interest_field": "",
            "low_interest_field": "",
            "student_trait": "",
            "career_recommendation": [],
            "summary": "분석 결과를 가져오는 데 실패했습니다."
        }


# -----------------------------
# 전체 파이프라인
# -----------------------------
def summarize_text(stt_result, ai_report):

    # STT 결과 검증
    if not stt_result or "segments" not in stt_result or not stt_result["segments"]:
        return {
            "interest_field": "",
            "low_interest_field": "",
            "student_trait": "",
            "career_recommendation": [],
            "summary": "음성 내용이 인식되지 않았습니다."
        }

    segments = stt_result["segments"]

    # 1️⃣ segment 기반 chunk 분할
    chunks = build_chunks_from_segments(segments)

    # 2️⃣ Refine — 청크 순서대로 누적 요약 (Map-Reduce에서 교체)
    # [변경 이유] 상담 대화는 앞뒤 맥락이 이어지는 특성상
    #            병렬 처리(Map-Reduce)보다 순차 누적(Refine)이 맥락 유지에 적합
    try:
        refined_summary = refine_chunks(chunks)
    except ValueError:
        return {
            "interest_field": "",
            "low_interest_field": "",
            "student_trait": "",
            "career_recommendation": [],
            "summary": "상담 내용 분석에 실패했습니다."
        }

    # 3️⃣ Reduce — 누적 요약 + 영상 분석 데이터 → 최종 JSON
    final_summary = summarize_final(refined_summary, ai_report)

    return final_summary
