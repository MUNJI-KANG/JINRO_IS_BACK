import { useState, useEffect } from "react";
import "../../../css/student_css/s_onboarding/MedCatOnboarding.css";

function CatMedOnboarding({ onClose }) {

  const [step,setStep]=useState(1);
  const [rect,setRect]=useState(null);

  const config = {
    1:{ target:".cardGrid", text:"세부 분야를 선택합니다" },
    2:{ target:".progressBadge", text:"현재 선택한 영상 개수를 확인할 수 있습니다" }
  };

 useEffect(()=>{

    let frame;

    const update = ()=>{

      const el = document.querySelector(config[step].target);

      if(!el){
        frame = requestAnimationFrame(update);
        return;
      }

      const r = el.getBoundingClientRect();

      if(r.width === 0 || r.height === 0){
        frame = requestAnimationFrame(update);
        return;
      }

      setRect({
        top:r.top,
        left:r.left,
        width:r.width,
        height:r.height,
        bottom:r.bottom,
        right:r.right
      });

    };

    frame = requestAnimationFrame(update);

    window.addEventListener("resize",update);
    window.addEventListener("scroll",update,true);

    return ()=>{
      cancelAnimationFrame(frame);
      window.removeEventListener("resize",update);
      window.removeEventListener("scroll",update,true);
    };

  },[step]);

  useEffect(()=>{

    const handleKey=(e)=>{

      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();

        if(step===2){
          onClose();
          return;
        }

        setStep(prev=>prev+1);
      }

    };

    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);

  },[step]);

  const next=()=>{
    if(step===2) onClose();
    else setStep(step+1);
  };

  if(!rect) return null;

  return(
    <div className="onboard-overlay">

      <div
        className="onboard-spotlight"
        style={{
          top:rect.top-6,
          left:rect.left-6,
          width:rect.width+12,
          height:rect.height+12
        }}
      />

      <div
        className="onboard-box"
        style={{
          top:rect.bottom+24,
          left:Math.max(20, rect.left + rect.width/2 - 200),
          width:400
        }}
      >
        <h3>세부 분야 선택</h3>
        <p>{config[step].text}</p>

        <button className="onboard-next" onClick={next}>
          {step===2 ? "확인" : "다음"}
        </button>
      </div>

    </div>
  );
}

export default CatMedOnboarding;