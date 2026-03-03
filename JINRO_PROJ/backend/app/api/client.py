from fastapi import APIRouter

# prefix="/client"로 설정하면 이 파일의 모든 API 주소 앞에 /client가 자동으로 붙습니다.
router = APIRouter(prefix="/client", tags=["Client (내담자)"])

@router.get("/")
def get_client_list():
    return {"message": "내담자 목록 조회 API 입니다."}

@router.get("/{client_id}")
def get_client_detail(client_id: int):
    return {"message": f"{client_id}번 내담자 상세 정보 조회 API 입니다."}