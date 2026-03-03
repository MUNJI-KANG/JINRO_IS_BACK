from pydantic import BaseModel

class ClientCreate(BaseModel):
    name: str
    birthdate: str  # 프론트엔드의 ssn(주민번호 7자리) 매핑
    phone_num: str  # 프론트엔드의 phone 매핑
    email: str

