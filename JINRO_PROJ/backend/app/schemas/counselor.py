from pydantic import BaseModel

class CounselorLoginRequest(BaseModel):
    login_id: str
    pw: str

class CounselorModifyInfo(BaseModel):
    name : str
    phone : str
    email : str