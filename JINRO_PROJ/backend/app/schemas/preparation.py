from pydantic import BaseModel, Field, model_validator


class EvidenceItem(BaseModel):
    id: str
    title: str
    detail: str
    url: str | None = Field(default=None, pattern=r'^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$')


class YouTubeVideo(BaseModel):
    video_id: str = Field(pattern=r'^[A-Za-z0-9_-]{11}$')
    title: str = Field(min_length=1, max_length=200)
    channel: str = Field(max_length=200)
    url: str

    @model_validator(mode='after')
    def validate_url(self):
        if self.url != f'https://www.youtube.com/watch?v={self.video_id}':
            raise ValueError('유튜브 영상 번호와 링크가 일치하지 않습니다.')
        return self


class PreparationQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    rationale: str = Field(min_length=1, max_length=1000)
    source_ids: list[str]


class PreparationObservation(BaseModel):
    statement: str = Field(min_length=1, max_length=1000)
    source_ids: list[str] = Field(min_length=1)


class PreparationContent(BaseModel):
    summary: str = Field(min_length=1, max_length=3000)
    observations: list[PreparationObservation] = Field(max_length=8)
    questions: list[PreparationQuestion] = Field(min_length=5, max_length=5)
    gaps: list[str] = Field(max_length=8)
    suggested_video_ids: list[int] = Field(max_length=5)
    suggested_youtube_video: YouTubeVideo | None = None


class PreparationEdit(BaseModel):
    revision: int = Field(ge=1)
    content: PreparationContent


class PreparationConfirm(BaseModel):
    revision: int = Field(ge=1)


class PreparationGenerate(BaseModel):
    additional_prompt: str = Field(default='', max_length=2000)
