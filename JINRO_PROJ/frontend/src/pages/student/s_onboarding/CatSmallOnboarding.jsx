import { useState, useEffect } from "react";
import "../../../css/student_css/s_onboarding/SmallCatOnboarding.css";

function CatSmallOnboarding({ onClose }) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  const config = {
    1:{
      target: ".onboard-target-card-grid",
      title:"영상 선택",
      text:"관심있는 영상을 클릭하면 선택됩니다"
    },
    2:{
      target: ".onboard-target-cart",
      title:"선택 상태 확인",
      text:"선택된 영상 개수를 여기서 확인할 수 있습니다"
    },
    3:{
      target: ".onboard-target-next",
      title:"다음 단계 이동",
      text:"영상 3개 선택 후 다음 단계로 이동할 수 있습니다"
    }
  };

  /* ⭐ body scroll 고정 */
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

  /* 키보드 진행 */
  useEffect(()=>{

    const handleKey = (e)=>{

      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();

        if(step===3){
          localStorage.setItem("small_cat_onboarding_done","true");
          onClose();
          return;
        }

        setStep(prev=>prev+1);
      }

    };

    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);

  },[step]);

  /* spotlight tracking */
  useEffect(()=>{

    const update = ()=>{

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

    window.addEventListener("resize",update);
    window.addEventListener("scroll",update,true);

    return ()=>{
      clearTimeout(t);
      window.removeEventListener("resize",update);
      window.removeEventListener("scroll",update,true);
    };

  },[step]);

  const next = ()=>{

    if(step===3){
      localStorage.setItem("small_cat_onboarding_done","true");
      onClose();
      return;
    }

    setStep(prev=>prev+1);
  };

  if(!rect) return null;

  return(
    <div className="onboard-overlay">

      <div
        className="onboard-spotlight"
        style={{
          top: Math.round(rect.top-8),
          left: Math.round(rect.left-8),
          width: Math.round(rect.width+16),
          height: Math.round(rect.height+16)
        }}
      />

      {/* ⭐ step1 */}
      {step === 1 && (
        <div
          className="onboard-box"
          style={{
            top: rect.bottom + 20,
            left:"50%",
            transform:"translateX(-50%)"
          }}
        >
          <h3>{config[step].title}</h3>
          <p>{config[step].text}</p>

          <button className="onboard-next" onClick={next}>
            다음
          </button>
        </div>
      )}

      {/* ⭐ step2 */}
      {step === 2 && (
        <div
          className="onboard-box"
          style={{
            top: rect.top + rect.height/2 + 50,
            left: rect.right - 300
          }}
        >
          <h3>{config[step].title}</h3>
          <p>{config[step].text}</p>

          <button className="onboard-next" onClick={next}>
            다음
          </button>
        </div>
      )}

      {/* ⭐ step3 */}
      {step === 3 && (
        <div
          className="onboard-box"
          style={{
            position:"fixed",
            top:"55%",
            left:"50%",
            transform:"translate(-50%,-50%)"
          }}
        >
          <h3>{config[step].title}</h3>
          <p>{config[step].text}</p>

          <button className="onboard-next" onClick={next}>
            확인
          </button>
        </div>
      )}

    </div>
  );
}

export default CatSmallOnboarding;