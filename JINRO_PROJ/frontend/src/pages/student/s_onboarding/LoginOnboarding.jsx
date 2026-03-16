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
const SPOT_PADDING = 14;

export default function LoginOnboarding({ onClose }) {

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

      setSpotStyle({
        top: rect.top - SPOT_PADDING,
        left: rect.left - SPOT_PADDING,
        width: rect.width + SPOT_PADDING * 2,
        height: rect.height + SPOT_PADDING * 2
      });

      let left = rect.right + 60;
      let top = rect.top + rect.height / 2 - 90;

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
      <div className="login-onboard-spot" style={spotStyle} />

      <div className="login-onboard-guide" style={guideStyle}>
        <div className="login-onboard-title">{steps[index].title}</div>
        <div className="login-onboard-desc">{steps[index].desc}</div>

        <button className="login-onboard-btn" onClick={next}>
          {index === steps.length - 1 ? "시작하기" : "다음"}
        </button>
      </div>
    </>
  );
}