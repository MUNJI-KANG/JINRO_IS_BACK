"""
final_score.py

attention_score (0~100) : 시선, 고개 방향, 눈 깜빡임 기반 집중도
emotion_score  (0~100) : 감정 참여도, 감정 변화량, 엔트로피, 놀람 빈도 기반

최종 final_focus_score (0~100)
  - attention이 행동적 집중도(신체),
  - emotion이 심리적 참여도(감정) 를 반영하므로
  - 가중치 : attention 75% + emotion 25%
"""


def calculate_final_score(
    attention_score: float,
    emotion_score: float,
    attention_weight: float = 0.75,
    emotion_weight: float = 0.25,
) -> float:
    """
    attention_score와 emotion_score를 가중합산하여 최종 집중도 점수를 반환합니다.

    Args:
        attention_score: 0~100 사이의 주의 집중 점수
        emotion_score:   0~100 사이의 감정 참여 점수
        attention_weight: attention 가중치 (기본 0.75)
        emotion_weight:   emotion 가중치   (기본 0.25)

    Returns:
        final_focus_score: 0~100 사이의 최종 집중도 점수 (소수점 2자리)
    """
    if attention_weight + emotion_weight != 1.0:
        raise ValueError("attention_weight + emotion_weight 의 합은 1.0 이어야 합니다.")

    final = (attention_weight * attention_score) + (emotion_weight * emotion_score)
    final = max(0.0, min(final, 100.0))  # 범위 클리핑

    return round(final, 2)