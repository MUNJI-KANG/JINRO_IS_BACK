from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# ---------------------------------------------------------
# [수정된 부분] MySQL 연결 URL 세팅
# 형식: "mysql+pymysql://사용자이름:비밀번호@호스트:포트/DB이름"
# ---------------------------------------------------------
DB_USERNAME = "jinro"          # MySQL 사용자 이름 (예: root)
DB_PASSWORD = "jinro1234"   # MySQL 비밀번호
DB_HOST = "127.0.0.1"         # 호스트 주소 (로컬이면 127.0.0.1 또는 localhost)
DB_PORT = "3306"              # MySQL 기본 포트
DB_NAME = "jinro"          # 미리 생성해둔 데이터베이스 이름

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# # SQLite에 있던 connect_args={"check_same_thread": False}는 제거합니다.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# # DB 세션 클래스 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # ORM 모델의 기본 클래스
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
