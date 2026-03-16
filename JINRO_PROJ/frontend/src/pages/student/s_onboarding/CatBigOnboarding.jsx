import { useState, useEffect } from "react";
import "../../../css/student_css/s_onboarding/BigCatOnboarding.css";

function CatBigOnboarding({ onClose, onStepChange }) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  const config = {
    1:{ target:".category-grid", text:"관심있는 큰 분야를 먼저 선택합니다" },
    2:{ target:".progress-badge-target", text:"영상은 최대 3개까지 선택할 수 있습니다" },
    3:{ target:".onboard-dummy-target", text:"선택된 영상은 이렇게 카트처럼 쌓입니다 ✕ 버튼으로 취소할 수 있습니다" }
  };

  const dummyVideos = [
    {id:1, subCategory:"경영·회계·사무"},
    {id:2, subCategory:"정보통신"}
  ];

  /* ⭐ body scroll 완전 고정 */
  useEffect(()=>{

    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return ()=>{
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0,scrollY);
    };

  },[]);

  useEffect(()=>{
    onStepChange?.(step);
  },[step]);

  /* 키보드 진행 */
  useEffect(()=>{

    const handleKey = (e) => {

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();

        if(step === 3){
          onClose();
          return;
        }

        setStep(prev => prev + 1);
      }

    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);

  }, [step]);

  /* ⭐ spotlight tracking (step3에서는 중단) */
  useEffect(()=>{

    if(step === 3) return;

    const update = () => {

      const el = document.querySelector(config[step].target);
      if(!el) return;

      const r = el.getBoundingClientRect();

      setRect({
        top:r.top,
        left:r.left,
        width:r.width,
        height:r.height,
        bottom:r.bottom,
        right:r.right
      });

    };

    const t = setTimeout(update,120);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update,true);

    return ()=>{
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update,true);
    };

  },[step]);

  const next = ()=>{
    if(step===3){
      onClose();
      return;
    }
    setStep(step+1);
  };

  if(step !== 3 && !rect) return null;

  return (
    <>
      <div className="cat-onboard-layer"/>

      {step !== 3 && (
        <div
          className="cat-onboard-spot"
          style={{
            top: Math.round(rect.top - 8),
            left: Math.round(rect.left - 8),
            width: Math.round(rect.width + 16),
            height: Math.round(rect.height + 16),
            borderRadius: "18px"
          }}
        />
      )}

      {step === 1 && (
        <div
          className="cat-onboard-guide"
          style={{
            top: rect.bottom - 400,
            left: rect.left + rect.width/2 - 210
          }}
        >
          <div className="cat-onboard-title">카테고리 선택 안내</div>
          <div className="cat-onboard-desc">{config[step].text}</div>
          <button className="cat-onboard-btn" onClick={next}>다음</button>
        </div>
      )}

      {step === 2 && (
        <div
          className="cat-onboard-guide"
          style={{
            top: rect.top + rect.height/2 - 120,
            left: rect.right + 20
          }}
        >
          <div className="cat-onboard-title">영상 선택 안내</div>
          <div className="cat-onboard-desc">{config[step].text}</div>
          <button className="cat-onboard-btn" onClick={next}>다음</button>
        </div>
      )}

      {step === 3 && (
        <div
          className="cat-onboard-guide"
          style={{
            position:"fixed",
            top:"57%",
            bottom:500,
            left:"50%",
            transform:"translate(-50%,-50%)",
            width:520
          }}
        >
          <div className="cat-onboard-title">영상 선택 결과</div>

          <div className="cat-onboard-desc">
            {config[step].text}
          </div>

          <button
            className="cat-onboard-btn"
            onClick={next}
            style={{marginTop:20}}
          >
            시작하기
          </button>

          <div className="cat-demo-cart-box">
            {dummyVideos.map(v=>(
              <div key={v.id} className="cat-demo-item">
                <span>{v.subCategory}</span>
                <button className="cat-demo-x">✕</button>
              </div>
            ))}
          </div>

        </div>
      )}
    </>
  );
}

export default CatBigOnboarding;