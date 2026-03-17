import os
from dotenv import load_dotenv
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

if __name__ == "__main__":
    # app 폴더 안의 main.py에 있는 app 객체를 실행합니다.
    # reload=True는 코드를 수정하면 서버가 자동으로 재시작되는 설정입니다.
    uvicorn.run("app.main:app", host="0.0.0.0", port=9000,reload=True ) # 서버 동작 
    # uvicorn.run("app.main:app", host="127.0.0.1", port=8001,reload=True ) # 로컬동작  