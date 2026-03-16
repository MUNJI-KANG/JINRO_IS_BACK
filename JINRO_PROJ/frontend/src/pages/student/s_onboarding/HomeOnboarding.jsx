import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/HomeOnboarding.css";

const GUIDE_WIDTH = 420;

export default function HomeOnboarding({ onClose }) {

  const [spotStyle, setSpotStyle] = useState({});
  const [guideStyle, setGuideStyle] = useState({});

  useEffect(() => {

    let frame;

    const update = () => {

      const el = document.querySelector(".onboard-start-card");

      if (!el) {
        frame = requestAnimationFrame(update);
        return;
      }

      const rect = el.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        frame = requestAnimationFrame(update);
        return;
      }

      const vh = window.innerHeight;
      const guideHeight = 190;

      setSpotStyle({
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        borderRadius: "18px"
      });

      let left = rect.left - GUIDE_WIDTH - 60;
      let top = rect.top + rect.height / 2 - guideHeight / 2;

      if (left < 20) {
        left = rect.left + rect.width / 2 - GUIDE_WIDTH / 2;
        top = rect.bottom + 40;
      }

      if (top + guideHeight > vh - 20) {
        top = rect.top - guideHeight - 30;
      }

      if (top < 20) {
        top = vh / 2 - guideHeight / 2;
      }

      setGuideStyle({
        left: Math.round(left),
        top: Math.round(top),
        width: GUIDE_WIDTH
      });

    };

    frame = requestAnimationFrame(update);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };

  }, []);

  useEffect(() => {

    const key = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);

  }, [onClose]);

  return (
    <>
      <div className="home-onboard-layer" />

      <div
        className="home-onboard-spot"
        style={spotStyle}
      />

      <div
        className="home-onboard-guide"
        style={guideStyle}
      >
        <div className="home-onboard-title">
          진단 시작
        </div>

        <div className="home-onboard-desc">
          내담자용 카드를 눌러<br/>
          진단 절차를 시작해주세요.
        </div>

        <button
          className="home-onboard-btn"
          onClick={onClose}
          type="button"
        >
          시작하기
        </button>
      </div>
    </>
  );
}