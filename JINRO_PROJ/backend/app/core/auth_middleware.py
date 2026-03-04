from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse


class AuthMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        path = request.url.path

        # 로그인 API만 허용
        if path.startswith("/client/login"):
            return await call_next(request)

        client_id = request.session.get("client_id")

        print("MIDDLEWARE PATH:", path)
        print("MIDDLEWARE SESSION:", request.session)

        if not client_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "LOGIN_REQUIRED"}
            )

        response = await call_next(request)
        return response