import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, JSON, Enum
from sqlalchemy.sql import func
# database.py에서 생성한 Base를 가져옵니다. 경로에 맞게 수정해주세요.
from app.db.database import Base 

# MySQL의 ENUM 타입을 Python의 Enum 클래스로 정의
class ReCommentEnum(enum.Enum):
    SUCCESS = '영상저장성공'
    FAIL = '영상저장실패'
    ANALYZED = '분석완료'
    ANALYZE_FAIL = '분석실패'

class Category(Base):
    __tablename__ = 'CATEGORY'
    
    c_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    title = Column(String(20), unique=True, comment='분야 카테고리')
    survey = Column(JSON, nullable=False, comment='설문지')
    url = Column(String(200), nullable=False, comment='영상 URL')
    kind = Column(Integer, nullable=False, comment='중분류 ID')

class Client(Base):
    __tablename__ = 'CLIENT'
    
    # DB 컬럼명은 'CLINET_ID'로 생성되지만, 코드에서는 client_id로 접근
    client_id = Column('CLINET_ID', Integer, primary_key=True, autoincrement=True, comment='PK')
    c_id = Column(String(100), unique=True, nullable=False, comment='고유번호')
    name = Column(String(100), nullable=False, comment='이름')
    phone_num = Column(String(100), unique=True, nullable=False, comment='전화번호')
    email = Column(String(100), nullable=False, comment='이메일')
    birthdate = Column(String(100), nullable=False, comment='생년월일/성별')
    agree = Column(String(1), default='N', nullable=False, comment='약정동의')

class Counselor(Base):
    __tablename__ = 'COUNSELOR'
    
    counselor_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    login_id = Column(String(100), unique=True, nullable=False, comment='ID')
    pw = Column(String(100), nullable=False, comment='PW')
    name = Column(String(100), nullable=False, comment='이름')
    phone_num = Column(String(100), unique=True, nullable=False, comment='전화번호')
    email = Column(String(100), unique=True, nullable=False, comment='이메일')
    active_yn = Column(String(1), default='N', nullable=False, comment='활성화')

class Counseling(Base):
    __tablename__ = 'COUNSELING'
    
    counseling_id = Column(Integer, primary_key=True, autoincrement=True, comment='상담_ID')
    datetime = Column(Date, comment='상담날짜')
    reservation_time = Column(DateTime, comment='예약시간')
    complete_yn = Column(Integer, nullable=False, comment='상담완료여부 1(영상), 2(예정), 3(완료)')
    regdate = Column(DateTime, nullable=False, comment='생성일자')
    counselor_id = Column(Integer, ForeignKey('COUNSELOR.COUNSELOR_ID'), nullable=False)
    client_id = Column(Integer, ForeignKey('CLIENT.CLINET_ID'), nullable=False)

class ReporCon(Base):
    __tablename__ = 'REPOR_CON'
    
    con_rep_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    con_rep_comment = Column(Text, nullable=False, comment='상담 일지')
    reg_date = Column(DateTime, default=func.now(), nullable=False, comment='리포트 생성 날짜')
    complete_yn = Column(String(1), default='N', nullable=False, comment='상담여부')
    counseling_id = Column(Integer, ForeignKey('COUNSELING.COUNSELING_ID'), nullable=False)
    re_comment = Column(Enum(ReCommentEnum), comment='분석여부')

class ReportAiM(Base):
    __tablename__ = 'REPORT_AI_M'
    
    ai_m_rep_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    ai_m_comment = Column(Text, nullable=False, comment='행동 요약')
    emotion_m_score = Column(JSON, nullable=False, comment='감정 점수')
    reg_date = Column(DateTime, default=func.now(), nullable=False, comment='리포트 생성 날짜')
    prompt = Column(String(300), comment='프롬프트')
    con_rep_id = Column(Integer, ForeignKey('REPOR_CON.CON_REP_ID'), nullable=False)

class ReportAiV(Base):
    __tablename__ = 'REPORT_AI_V'
    
    ai_v_erp_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    reg_date = Column(DateTime, default=func.now(), nullable=False, comment='리포트 생성 날짜')
    update_date = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, comment='리포트 수정 날짜')
    category = Column(String(20), nullable=False, comment='영상 카테고리')
    url = Column(String(2000), nullable=False, comment='영상 URL')
    answer = Column(JSON, comment='내담자 설문지 답변')
    counseling_id = Column(Integer, ForeignKey('COUNSELING.COUNSELING_ID'), nullable=False)
    re_comment = Column(Enum(ReCommentEnum), comment='분석여부')

class AiVideoAnalyze(Base):
    __tablename__ = 'AI_VIDEO_ANALYZE'
    
    analyze_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    ai_v_comment = Column(Text, nullable=False, comment='행동 요약')
    emotion_v_score = Column(JSON, nullable=False, comment='감정 점수')
    prompt = Column(String(300), comment='프롬프트')
    reg_date = Column(DateTime, default=func.now(), nullable=False, comment='생성날짜')
    ai_v_erp_id = Column(Integer, ForeignKey('REPORT_AI_V.AI_V_ERP_ID'), nullable=False)

class ReportFinal(Base):
    __tablename__ = 'REPROT_FINAL'
    
    final_id = Column(Integer, primary_key=True, autoincrement=True, comment='PK')
    reg_date = Column(DateTime, default=func.now(), nullable=False, comment='리포트 생성 날짜')
    final_comment = Column(Text, nullable=False, comment='상담 요약')
    update_date = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, comment='리포트 수정 날짜')
    complete_yn = Column(String(1), default='N', nullable=False, comment='최종작성여부')
    counseling_id = Column(Integer, ForeignKey('COUNSELING.COUNSELING_ID'), nullable=False)