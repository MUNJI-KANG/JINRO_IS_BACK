import { useState } from "react";
import api from '../../services/app';
import { useNavigate } from "react-router-dom";
import mainLogo from "../../assets/logo/main_logo.png";

function Header() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const isConfirmed = window.confirm("로그아웃 하시겠습니까?");

    if (isConfirmed) {
      setLoggingOut(true);
      try {
        await api.post('/counselor/logout');
        localStorage.removeItem('counselor_id');
        sessionStorage.clear();
        navigate('/', { replace: true });
      } catch {
        alert('로그아웃하지 못했습니다. 다시 시도해 주세요.');
      } finally {
        setLoggingOut(false);
      }
    }
    
  };

  const handleLogo = () => {
    navigate("/counselor/scheduler");
  };

  return (
    <header className="header">
      <div className="logo-box" onClick={handleLogo}>
        <img src={mainLogo} alt="logo" className="logo-img" />
      </div>
      <button type="button" className="logout-btn" disabled={loggingOut} onClick={handleLogout}>
        로그아웃
      </button>
    </header>
  );
}

export default Header;
