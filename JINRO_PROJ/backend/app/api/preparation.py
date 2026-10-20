import os
import logging

import httpx
from pydantic import ValidationError
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schema_models import (
    AiAnalyze, Category, Client, Counseling, CounselingPreparation,
    ReportAiV, ReportCon, ReCommentEnum,
)
from app.schemas.preparation import (
    EvidenceItem, PreparationConfirm, PreparationContent, PreparationEdit, PreparationGenerate,
)
from app.services.survey_service import analyze_survey

router = APIRouter(prefix='/counselor/preparation', tags=['Counseling preparation'])
logger = logging.getLogger(__name__)


def authorized_counseling(counseling_id: int, request: Request, db: Session):
    counselor_id = request.session.get('counselor_id')
    if not counselor_id:
        raise HTTPException(401, '상담사 로그인이 필요합니다.')
    counseling = db.query(Counseling).filter_by(
        counseling_id=counseling_id, counselor_id=counselor_id,
    ).first()
    if not counseling:
        raise HTTPException(404, '담당 상담을 찾을 수 없습니다.')
    return counseling


def serialize(preparation):
    if not preparation:
        return None
    return {
        'content': preparation.content, 'evidence': preparation.evidence,
        'tool_trace': preparation.tool_trace, 'status': preparation.status,
        'revision': preparation.revision,
        'updated_at': preparation.updated_at.isoformat(),
    }


def validate_sources(content, evidence):
    ids = {e['id'] for e in evidence}
    for item in [*content.questions, *content.observations]:
        if any(source not in ids for source in item.source_ids):
            raise HTTPException(422, '존재하지 않는 근거가 포함되어 있습니다.')
    if any(f'category:{video_id}' not in ids for video_id in content.suggested_video_ids):
        raise HTTPException(422, '조회하지 않은 영상이 포함되어 있습니다.')
    if content.suggested_youtube_video:
        video = content.suggested_youtube_video
        source = next((e for e in evidence if e['id'] == f'youtube:{video.video_id}'), None)
        if not source or source.get('url') != video.url or source['title'] != video.title:
            raise HTTPException(422, '조회 근거와 유튜브 영상이 일치하지 않습니다.')


def build_context(counseling, db):
    # Keep identity/contact information outside the LLM request.
    videos = []
    for report in db.query(ReportAiV).filter_by(counseling_id=counseling.counseling_id).order_by(ReportAiV.ai_v_erp_id):
        analysis = db.query(AiAnalyze).filter_by(ai_v_erp_id=report.ai_v_erp_id).order_by(AiAnalyze.analyze_id.desc()).first()
        usable = analysis is not None and report.re_comment != ReCommentEnum.ANALYZE_FAIL
        videos.append({
            'id': report.ai_v_erp_id, 'category': report.category,
            'survey_score': analyze_survey(report.answer) if report.answer else None,
            'analysis_status': 'success' if usable else 'unavailable',
            'attention_score': analysis.attention_score if usable else None,
            'interest_score': analysis.emotion_score if usable else None,
        })
    previous = db.query(ReportCon).join(Counseling, Counseling.counseling_id == ReportCon.counseling_id).filter(
        Counseling.client_id == counseling.client_id,
        Counseling.counselor_id == counseling.counselor_id,
        Counseling.regdate < counseling.regdate,
        ReportCon.complete_yn == 'Y',
    ).order_by(Counseling.regdate.desc()).limit(5).all()
    return {
        'videos': videos,
        'history': [{'id': r.con_rep_id, 'title': r.title, 'text': r.con_rep_comment[:4000]} for r in previous],
        'catalog': [{'id': c.c_id, 'title': c.title, 'kind': c.kind} for c in db.query(Category).order_by(Category.c_id)],
    }


@router.get('/{counseling_id}')
def get_preparation(counseling_id: int, request: Request, db: Session = Depends(get_db)):
    counseling = authorized_counseling(counseling_id, request, db)
    student = db.get(Client, counseling.client_id)
    preparation = db.query(CounselingPreparation).filter_by(counseling_id=counseling_id).first()
    return {'success': True, 'student_name': student.name, 'data': serialize(preparation)}


@router.post('/{counseling_id}/generate')
def generate_preparation(counseling_id: int, request: Request,
                         data: PreparationGenerate | None = Body(default=None), db: Session = Depends(get_db)):
    counseling = authorized_counseling(counseling_id, request, db)
    previous = db.query(CounselingPreparation).filter_by(counseling_id=counseling_id).first()
    if previous and previous.status == 'confirmed':
        raise HTTPException(409, '확정된 상담 준비는 재생성할 수 없습니다.')
    revision = previous.revision if previous else None
    context = build_context(counseling, db)
    context['additional_prompt'] = data.additional_prompt.strip() if data else ''
    db.rollback()
    try:
        with httpx.Client(timeout=360) as ai:
            response = ai.post(f"{os.environ['AI_SERVER_URL'].rstrip('/')}/ai/preparation", json=context)
            response.raise_for_status()
        result = response.json()
        content = PreparationContent.model_validate(result['content'])
        evidence = [EvidenceItem.model_validate(e).model_dump() for e in result['evidence']]
        validate_sources(content, evidence)
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, ValueError) as error:
        locations = [{'location': item['loc'], 'type': item['type']} for item in error.errors()] if isinstance(error, ValidationError) else []
        logger.warning('상담 준비 생성 실패: 오류 종류=%s, 검증 위치=%s', type(error).__name__, locations)
        raise HTTPException(502, '상담 준비 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    values = dict(content=content.model_dump(), evidence=evidence, tool_trace=result['tool_trace'], status='draft')
    try:
        if revision is None:
            db.add(CounselingPreparation(counseling_id=counseling_id, **values))
        else:
            updated = db.query(CounselingPreparation).filter_by(
                counseling_id=counseling_id, revision=revision, status='draft',
            ).update({**values, 'revision': revision + 1})
            if not updated:
                raise HTTPException(409, '다른 변경이 저장되었습니다. 새로고침해 주세요.')
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, '다른 생성 결과가 저장되었습니다. 새로고침해 주세요.')
    return {'success': True, 'data': serialize(db.query(CounselingPreparation).filter_by(counseling_id=counseling_id).first())}


@router.put('/{counseling_id}')
def edit_preparation(counseling_id: int, data: PreparationEdit, request: Request, db: Session = Depends(get_db)):
    authorized_counseling(counseling_id, request, db)
    preparation = db.query(CounselingPreparation).filter_by(counseling_id=counseling_id).first()
    if not preparation:
        raise HTTPException(404, '먼저 상담 준비를 생성해 주세요.')
    validate_sources(data.content, preparation.evidence)
    if not db.query(CounselingPreparation).filter_by(counseling_id=counseling_id, revision=data.revision, status='draft').update({
        'content': data.content.model_dump(), 'revision': data.revision + 1,
    }):
        raise HTTPException(409, '확정되었거나 다른 변경이 저장되었습니다. 새로고침해 주세요.')
    db.commit()
    db.refresh(preparation)
    return {'success': True, 'data': serialize(preparation)}


@router.post('/{counseling_id}/confirm')
def confirm_preparation(counseling_id: int, data: PreparationConfirm, request: Request, db: Session = Depends(get_db)):
    authorized_counseling(counseling_id, request, db)
    if not db.query(CounselingPreparation).filter_by(counseling_id=counseling_id, revision=data.revision, status='draft').update({
        'status': 'confirmed', 'revision': data.revision + 1,
    }):
        raise HTTPException(409, '확정되었거나 다른 변경이 저장되었습니다. 새로고침해 주세요.')
    db.commit()
    return {'success': True, 'data': serialize(db.query(CounselingPreparation).filter_by(counseling_id=counseling_id).first())}
