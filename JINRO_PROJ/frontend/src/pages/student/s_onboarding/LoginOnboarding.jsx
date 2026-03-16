import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/LoginOnboarding.css";

const steps = [
  { target: ".onboard-name", title: "이름 입력", desc: "내담자의 이름을 입력해주세요." },
  { target: ".onboard-ssn", title: "주민등록번호", desc: "앞자리 7자와 뒷자리 첫자리를 입력해주세요." },
  { target: ".onboard-phone", title: "핸드폰", desc: "연락이 가능한 번호를 입력해주세요." },
  { target: ".onboard-email", title: "이메일", desc: "최종결과를 받아보실 이메일을 입력해주세요." },
  { target: ".onboard-start-btn", title: "진단 시작", desc: "버튼을 눌러 진단을 시작해주세요." }
];

const GUIDE_WIDTH = 420;
const GUIDE_HEIGHT = 190;
const SPOT_PADDING = 8;

export default function LoginOnboarding({ onClose }) {

  const [index, setIndex] = useState(0);
  const [spotStyle, setSpotStyle] = useState({});
  const [guideStyle, setGuideStyle] = useState({});

  const next = () => {
    if (index === steps.length - 1) onClose();
    else setIndex(i => i + 1);
  };

  useEffect(() => {

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

      setSpotStyle({
        top: Math.round(rect.top - SPOT_PADDING),
        left: Math.round(rect.left - SPOT_PADDING),
        width: Math.round(rect.width + SPOT_PADDING * 2),
        height: Math.round(rect.height + SPOT_PADDING * 2),
        borderRadius: "18px"
      });

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
      <div className="login-onboard-layer" />

      <div
        className="login-onboard-spot"
        style={spotStyle}
      />

      <div
        className="login-onboard-guide"
        style={guideStyle}
      >
        <div className="login-onboard-title">
          {steps[index].title}
        </div>

        <div className="login-onboard-desc">
          {steps[index].desc}
        </div>

        <button
          className="login-onboard-btn"
          onClick={next}
          type="button"
        >
          {index === steps.length - 1 ? "시작하기" : "다음"}
        </button>
      </div>
    </>
  );
}