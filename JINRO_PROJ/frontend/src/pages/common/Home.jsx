import React, { useEffect } from "react";
import { useNavigate, useNavigationType  } from "react-router-dom";
import "../../css/common_css/home.css";
import api from '../../services/app'
import { useDispatch } from 'react-redux';
import { clearVideos } from '../../redux/cVideos'

const Home = () => {
  const navigate = useNavigate();
<<<<<<< Updated upstream
  const dispatch = useDispatch();
=======

>>>>>>> Stashed changes

  useEffect(() => {
    sessionStorage.clear();
    localStorage.clear();
    dispatch(clearVideos());
    api.get('client/sesstion/clear');

  }, []);

  const handleCounselorClick = () => {
    navigate("/counselor/login");
  };

  // ✅ 이거 추가 안 해서 에러난 거야
  const handleStudentClick = () => {
    navigate("/student/agreement");
  };

  return (
    <div className="home-container">
      <div className="header-section">
        <div className="logo-placeholder">로고</div>
        <h1 className="main-title">너, 내 진로가 되라</h1>
      </div>

      <div className="cards-wrapper">
        <div
          className="card client-card"
          onClick={handleStudentClick}
          style={{ cursor: "pointer" }}
        >
          <div className="icon-placeholder"></div>
          <h2 className="card-title">내담자용</h2>
          <p className="card-desc">
            상담 영상을 시청하고<br />
            흥미도 분석을 시작합니다
          </p>
        </div>

        <div
          className="card counselor-card"
          onClick={handleCounselorClick}
          style={{ cursor: "pointer" }}
        >
          <div className="icon-placeholder"></div>
          <h2 className="card-title">상담사용</h2>
          <p className="card-desc">
            내담자의 흥미도 리포트와<br />
            상세 지표를 관리합니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;