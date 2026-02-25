import React from 'react';
import '../../css/common_css/home.css'; 

const Home = () => {
  return (
    <div className="home-container">
      {/* 상단 로고 및 타이틀 영역 */}
      <div className="header-section">
        <div className="logo-placeholder">로고</div>
        <h1 className="main-title">너, 내 진로가 되라</h1>
      </div>

      {/* 카드 레이아웃 영역 */}
      <div className="cards-wrapper">
        
        {/* 첫 번째 카드: 내담자용 */}
        <div className="card client-card">
          <div className="icon-placeholder"></div>
          <h2 className="card-title">내담자용</h2>
          <p className="card-desc">
            상담 영상을 시청하고<br />
            흥미도 분석을 시작합니다
          </p>
        </div>

        {/* 두 번째 카드: 상담사용 */}
        <div className="card counselor-card">
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