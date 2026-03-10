from __future__ import annotations

import os

from openai import OpenAI


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


SUMMARY_PROMPT = """
너는 상담 내용을 정리하는 AI 보조자다.

아래 STT 원문을 바탕으로 상담 내용을 한국어로 정리하라.

반드시 다음 형식으로 작성:
1. 상담 핵심 주제
2. 내담자 현재 상태
3. 주요 고민/문제
4. 상담 중 나온 중요한 포인트
5. 후속 상담 시 참고사항

조건:
- 추측하지 말고 원문에 있는 내용 중심으로 작성
- 과장하지 말 것
- 5개 항목은 각각 2~4문장 이내
- 상담 기록 문체로 깔끔하게 작성
"""


def summarize_text(stt_text: str) -> tuple[str, str]:
    if not stt_text or not stt_text.strip():
        raise ValueError("요약할 STT 텍스트가 비어 있습니다.")

    prompt = f"{SUMMARY_PROMPT}\n\n[STT 원문]\n{stt_text}"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "너는 상담 기록 요약 보조자다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    summary = response.choices[0].message.content.strip()
    return summary, prompt