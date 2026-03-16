import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/AgreementOnboarding.css";

const steps = [
  {
    target: ".onboard-agree1",
    title: "정보 수집 동의",
    desc: "AI 분석을 위해 필요한 반응 데이터 수집 동의입니다."
  },
  {
    target: ".onboard-agree2",
    title: "얼굴 촬영 동의",
    desc: "감정 분석을 위한 얼굴 촬영 동의입니다."
  },
  {
    target: ".onboard-start-btn",
    title: "진단 시작",
    desc: "모든 동의 후 버튼을 눌러 진단을 시작하세요."
  }
];

const GUIDE_WIDTH = 420;
const GUIDE_HEIGHT = 190;
const SPOT_PADDING = 16;

export default function AgreementOnboarding({ onClose }) {

  const [index, setIndex] = useState(0);
  const [spotStyle, setSpotStyle] = useState({});
  const [guideStyle, setGuideStyle] = useState({});

  const next = () => {
    if (index === steps.length - 1) onClose();
    else setIndex(i => i + 1);
  };

  useEffect(() => {

    document.body.classList.add("onboarding-active");

    let frame;

    const update = () => {

      const el = document.querySelector(steps[index].target);

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

      // ===== spotlight (HOME 기준 통일)
      setSpotStyle({
        top: Math.round(rect.top - SPOT_PADDING),
        left: Math.round(rect.left - SPOT_PADDING),
        width: Math.round(rect.width + SPOT_PADDING * 2),
        height: Math.round(rect.height + SPOT_PADDING * 2),
        borderRadius: "18px"
      });

            // ===== guide 위치 계산 (HOME 규격 완전 동일)
      let left = rect.right + 60;
      let top = rect.top + rect.height / 2 - GUIDE_HEIGHT / 2;

      if (left + GUIDE_WIDTH > window.innerWidth - 20) {
        left = rect.left + rect.width / 2 - GUIDE_WIDTH / 2;
        top = rect.bottom + 40;
      }

      if (top + GUIDE_HEIGHT > window.innerHeight - 20) {
        top = rect.top - GUIDE_HEIGHT - 30;
      }

      if (top < 20) {
        top = window.innerHeight / 2 - GUIDE_HEIGHT / 2;
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
      document.body.classList.remove("onboarding-active");
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };

  }, [index]);

  useEffect(() => {

    const key = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      }
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);

  }, [index]);

  return (
    <>
      <div className="agree-onboard-layer" />

      <div
        className="agree-onboard-spot"
        style={spotStyle}
      />

      <div
        className="agree-onboard-guide"
        style={guideStyle}
      >
        <div className="agree-onboard-title">
          {steps[index].title}
        </div>

        <div className="agree-onboard-desc">
          {steps[index].desc}
        </div>

        <button
          className="agree-onboard-btn"
          onClick={next}
          type="button"
        >
          {index === steps.length - 1 ? "시작하기" : "다음"}
        </button>
      </div>
    </>
  );
}