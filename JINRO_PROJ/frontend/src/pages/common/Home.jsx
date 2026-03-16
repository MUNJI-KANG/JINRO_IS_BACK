import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../../css/common_css/home.css";
import HomeOnboarding from "../student/s_onboarding/HomeOnboarding.jsx";
import mainLogo from "../../assets/logo/main_logo.png";
import clientImg from "../../assets/logo/char1.png";
import counselorImg from "../../assets/logo/char2.png";

const Home = () => {
  const navigate = useNavigate();

  const [ask, setAsk] = useState(true);
  const [onboard, setOnboard] = useState(false);

  const handleYes = () => {

    localStorage.setItem("home_onboarding_done", "true");
    localStorage.removeItem("skip_all_onboarding");

    localStorage.setItem("needAgreementOnboarding", "true");

    setAsk(false);

    setTimeout(() => {
      setOnboard(true);
    }, 150);
  };

  const handleNo = () => {

    localStorage.setItem("skip_all_onboarding","true");

    setAsk(false);
  };

  useEffect(() => {

    const skip = localStorage.getItem("skip_all_onboarding");
    const done = localStorage.getItem("home_onboarding_done");

    if(skip === "true"){
      setAsk(false);
      return;
    }

    if(done === "true"){
      setAsk(false);
      return;
    }

  }, []);
  return (
    <div className={`home-container ${ask ? "modal-open" : ""}`}>
      {ask && (
        <div className="first-modal-wrap">
          <div className="first-modal">
            <h2 className="first-modal-title">처음 방문하셨나요?</h2>

            <div className="first-modal-btns">
              <button className="first-modal-btn yes" onClick={handleYes} type="button">
                네
              </button>

              <button className="first-modal-btn no" onClick={handleNo} type="button">
                아니요
              </button>
            </div>
          </div>
        </div>
      )}

      {onboard && <HomeOnboarding onClose={() => setOnboard(false)} />}

      <div className="header-section">
        <img 
          src={mainLogo}
          alt="main logo"
          className="main-logo"
        />
      </div>

      <div className="cards-wrapper">
        <div
          className="card onboard-start-card"
          onClick={() => navigate("/student/agreement")}
        >
          <img 
            src={clientImg}
            alt="client"
            className="card-icon"
          />
          <h2 className="card-title">내담자용</h2>
          <p className="card-desc">
            상담 영상을 시청하고
            <br />
            흥미도 분석을 시작합니다
          </p>
        </div>

        <div
          className="card"
          onClick={() => navigate("/counselor/login")}
        >
          <img 
            src={counselorImg}
            alt="counselor"
            className="card-icon"
          />
          <h2 className="card-title">상담사용</h2>
          <p className="card-desc">
            리포트를 확인하고
            <br />
            상담을 관리합니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;