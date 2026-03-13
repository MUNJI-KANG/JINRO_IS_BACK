import { useState, useEffect } from "react";
import "../../../css/student_css/s_onboarding/SmallCatOnboarding.css";

function CatSmallOnboarding({ onClose }) {

  const [step,setStep]=useState(1);
  const [rect,setRect]=useState(null);

  const config = {
    1:{
      target: ".onboard-target-card-grid",
      title:"영상 선택",
      text:"영상을 클릭하면 선택됩니다"
    },
    2:{
      target: ".onboard-target-next",
      title:"다음 단계 이동",
      text:"3개 선택 후 다음 단계로 이동합니다"
    }
  };

  
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

  useEffect(()=>{

    const update = ()=>{

      const el = document.querySelector(config[step].target);
      if(!el){
        setRect(null);
        return;
      }

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

    const t = setTimeout(update,350);

    window.addEventListener("resize",update);
    window.addEventListener("scroll",update,true);

    return ()=>{
      clearTimeout(t);
      window.removeEventListener("resize",update);
      window.removeEventListener("scroll",update,true);
    };

  },[step]);

  const next = ()=>{
    if(step===2){
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
          top:rect.top-6,
          left:rect.left-6,
          width:rect.width+12,
          height:rect.height+12
        }}
      />

      <div
        className="onboard-box"
        style={{
          top:rect.bottom + 60,
          left:rect.left + rect.width/2
        }}
      >
        <h3>{config[step].title}</h3>
        <p>{config[step].text}</p>

        <button className="onboard-next" onClick={next}>
          {step===2 ? "확인" : "다음"}
        </button>

      </div>

    </div>
  );
}

export default CatSmallOnboarding;