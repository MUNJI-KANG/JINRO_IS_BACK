// import "../../../css/student_css/s_onboarding/CatOnboarding.css"

function CheckoutOnboarding({ onClose }) {

  const rect = document.querySelector(".cart-btn.primary")?.getBoundingClientRect();

  return (
    <div className="onboard-overlay">

      {rect && (
        <>
          <div
            className="onboard-spotlight"
            style={{
              top: rect.top-6,
              left: rect.left-6,
              width: rect.width+12,
              height: rect.height+12
            }}
          />

          <div
            className="onboard-box"
            style={{
              top: rect.top-120,
              left: rect.left-60
            }}
          >
            <h3>영상 시청 시작</h3>
            <p>
              선택한 영상 순서대로 시청하며<br/>
              AI가 집중도를 분석합니다
            </p>

            <button className="onboard-next" onClick={onClose}>
              시작
            </button>
          </div>
        </>
      )}

    </div>
  );
}

export default CheckoutOnboarding;