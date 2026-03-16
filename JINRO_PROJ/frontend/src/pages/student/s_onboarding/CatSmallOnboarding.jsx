import { useState, useEffect } from "react";
import "../../../css/student_css/s_onboarding/SmallCatOnboarding.css";

function CatSmallOnboarding({ onClose }) {

  const [step,setStep]=useState(1);
  const [rect,setRect]=useState(null);

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

  useEffect(()=>{

    const handleKey=(e)=>{
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

  useEffect(()=>{

    let frame;

    const update = ()=>{

      const el = document.querySelector(config[step].target);

      if(!el){
        frame = requestAnimationFrame(update);
        return;
      }

      const r = el.getBoundingClientRect();

      if(r.width===0 || r.height===0){
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

      <div
        className="onboard-box"
        style={{
          top: rect.bottom+60,
          left:"50%",
          transform:"translateX(-50%)"
        }}
      >
        <h3>{config[step].title}</h3>
        <p>{config[step].text}</p>

        <button className="onboard-next" onClick={next}>
          {step===3 ? "확인" : "다음"}
        </button>
      </div>

    </div>
  );
}

export default CatSmallOnboarding;