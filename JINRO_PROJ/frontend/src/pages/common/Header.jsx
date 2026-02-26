import React from "react";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 🔥 나중에 여기서 토큰 삭제, 세션 삭제 처리 가능
    // localStorage.removeItem("accessToken");

    navigate("/");  // 👉 http://localhost:5173/
  };

  return (
    <header className="header">
      <div className="logo-box">로고</div>
      <div className="logout-btn" onClick={handleLogout}>
        로그아웃
      </div>
    </header>
  );
}

export default Header;