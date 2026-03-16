import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/HomeOnboarding.css";

const GUIDE_WIDTH = 420;
const SPOT_PADDING = 14;

export default function HomeOnboarding({ onClose }) {

  const [spotStyle, setSpotStyle] = useState({});
  const [guideStyle, setGuideStyle] = useState({});

  const updatePosition = () => {

    const el = document.querySelector(".onboard-start-card");
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;

    const guideHeight = 190;

    /* ⭐ spotlight */
    setSpotStyle({
      top: rect.top - SPOT_PADDING,
      left: rect.left - SPOT_PADDING,
      width: rect.width + SPOT_PADDING * 2,
      height: rect.height + SPOT_PADDING * 2
    });

    /* ⭐ 기본 = 카드 좌측 */
    let left = rect.left - GUIDE_WIDTH - 60;
    let top = rect.top + rect.height / 2 - guideHeight / 2;

    /* ⭐ 좌측 공간 부족 → 카드 아래 */
    if (left < 20) {
      left = rect.left + rect.width / 2 - GUIDE_WIDTH / 2;
      top = rect.bottom + 40;
    }

    /* ⭐ 아래 넘침 → 카드 위 */
    if (top + guideHeight > vh - 20) {
      top = rect.top - guideHeight - 30;
    }

    /* ⭐ 위도 넘침 → 화면 중앙 */
    if (top < 20) {
      top = vh / 2 - guideHeight / 2;
    }

    setGuideStyle({
      left,
      top,
      width: GUIDE_WIDTH
    });
  };

  useEffect(() => {

    const t = setTimeout(updatePosition, 80);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };

  }, []);

  /* ⭐ Enter / Space 로 종료 */
  useEffect(() => {

    const key = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);

  }, []);

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