import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.preparation_service import generate_preparation

router = APIRouter(prefix='/ai', tags=['Counseling preparation agent'])
logger = logging.getLogger(__name__)


class PreparationContext(BaseModel):
    videos: list[dict] = Field(max_length=20)
    history: list[dict] = Field(max_length=5)
    catalog: list[dict] = Field(max_length=500)
    additional_prompt: str = Field(default='', max_length=2000)


@router.post('/preparation')
def prepare(context: PreparationContext):
    try:
        return generate_preparation(context.model_dump())
    except Exception as error:
        logger.error('로컬 상담 준비 생성 실패: 오류 종류=%s', type(error).__name__)
        raise HTTPException(502, '로컬 모델의 상담 준비 생성에 실패했습니다. Ollama 실행 상태를 확인해 주세요.')
