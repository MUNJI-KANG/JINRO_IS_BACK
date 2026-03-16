import { useState, useEffect } from "react";
import "../../../css/counselor_css/onboarding/CategoryOnboarding.css";

function CategoryOnboarding({
  onClose,
  selectedBigId,
  selectedMidId,
  setSelectedBigId,
  setSelectedMidId,
}) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  /* ⭐ 현재 화면 phase */
  const phase =
    selectedBigId == null
      ? "big"
      : selectedMidId == null
      ? "mid"
      : "small";

  /* ⭐ config */
  const config = {
    big:{
      target:".category-grid",
      title:"대분류 선택",
      text:"상담할 직무 분야를 먼저 선택합니다."
    },
    mid:{
      target:".mid-grid",
      title:"중분류 선택",
      text:"보다 구체적인 직무 영역을 선택합니다."
    },
    small1:{
      target:".list-container",
      title:"상세 항목",
      text:"등록된 상담 콘텐츠를 확인할 수 있습니다."
    },
    small2:{
      target:".add-btn",
      title:"콘텐츠 추가",
      text:"새 상담 콘텐츠를 등록할 수 있습니다."
    }
  };

  /* ⭐ scroll lock */
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

  /* ⭐ spotlight tracking */
  useEffect(()=>{

    const update = ()=>{

      let key;

      if(phase==="big") key="big";
      else if(phase==="mid") key="mid";
      else key = step===1 ? "small1" : "small2";

      const el = document.querySelector(config[key].target);
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

    window.addEventListener("resize",update);
    window.addEventListener("scroll",update,true);

    return ()=>{
      clearTimeout(t);
      window.removeEventListener("resize",update);
      window.removeEventListener("scroll",update,true);
    };

  },[phase,step]);


  const next = ()=>{

    /* 대분류 화면 → 자동 선택 */
    if(phase==="big"){
      setSelectedBigId(1);
      return;
    }

    /* 중분류 화면 → 자동 선택 */
    if(phase==="mid"){
      setSelectedMidId(101);
      return;
    }

    /* 소분류 내부 step */
    if(step===1){
      setStep(2);
      return;
    }

    setSelectedBigId(null);
    setSelectedMidId(null);
    onClose();
  };

  if(!rect) return null;

  let key;
  if(phase==="big") key="big";
  else if(phase==="mid") key="mid";
  else key = step===1 ? "small1" : "small2";

  const guideStyleMap = {

        big:{
            top:"60%",
            left:"56%",
            transform:"translate(-50%,-50%)"
        },

        mid:{
            top:"60%",
            left:"56%",
            transform:"translate(-50%,-50%)"
        },

        small1:{
            top: rect.bottom + 70,
            left:"56%",
            transform:"translateX(-50%)"
        },

        small2:{
            top: rect.top - 160,
            left: rect.right - 420
        }

    };
    const bodyOffset = Math.abs(parseInt(document.body.style.top || "0"));

    const pad = phase === "small" && step === 1 ? 25 : 10;

    const smallDown = phase === "small" && step === 1 ? 30 : 0;

    return(
    <div className="cat-onboard-layer">

      
        <div
            className="cat-onboard-spot"
            style={{
                top: rect.top + bodyOffset - pad + smallDown,
                left: rect.left - pad,
                width: rect.width + pad * 2,
                height: rect.height + pad * 2
            }}
        />
      <div
        className="cat-onboard-guide"
        style={guideStyleMap[key]}
        >

        <div className="cat-onboard-title">
          {config[key].title}
        </div>

        <div className="cat-onboard-desc">
          {config[key].text}
        </div>

        <button
          className="cat-onboard-btn"
          onClick={next}
        >
          {phase==="small" && step===2 ? "시작하기" : "다음"}
        </button>
      </div>

    </div>
  );
}

export default CategoryOnboarding;