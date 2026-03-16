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
const SPOT_PADDING = 14;

export default function AgreementOnboarding({ onClose }) {

  const [index, setIndex] = useState(0);
  const [spotStyle, setSpotStyle] = useState({});
  const [guideStyle, setGuideStyle] = useState({});

  const next = () => {
    if (index === steps.length - 1) onClose();
    else setIndex(i => i + 1);
  };

  useEffect(() => {

    const update = () => {

      const el = document.querySelector(steps[index].target);
      if (!el) return;

      const rect = el.getBoundingClientRect();

      /* ⭐ spotlight */
      setSpotStyle({
        top: rect.top - SPOT_PADDING,
        left: rect.left - SPOT_PADDING,
        width: rect.width + SPOT_PADDING * 2,
        height: rect.height + SPOT_PADDING * 2
      });

      /* ⭐ 우측 기본 */
      let left = rect.right + 60;
      let top = rect.top + rect.height / 2 - 90;

      /* ⭐ 화면 벗어나면 아래 중앙 */
      if (left + GUIDE_WIDTH > window.innerWidth) {
        left = rect.left + rect.width / 2 - GUIDE_WIDTH / 2;
        top = rect.bottom + 40;
      }

      setGuideStyle({
        left,
        top,
        width: GUIDE_WIDTH
      });
    };

    const t = setTimeout(update, 60);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };

  }, [index]);

  /* ⭐ 키보드 제어 */
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
      <div className="agree-onboard-spot" style={spotStyle} />

      <div className="agree-onboard-guide" style={guideStyle}>
        <div className="agree-onboard-title">{steps[index].title}</div>
        <div className="agree-onboard-desc">{steps[index].desc}</div>

        <button className="agree-onboard-btn" onClick={next}>
          {index === steps.length - 1 ? "시작하기" : "다음"}
        </button>
      </div>
    </>
  );
}