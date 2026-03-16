import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/CheckoutOnboarding.css";

function CheckoutOnboarding({ onClose }) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  const config = {
    1:{
      target: ".video-list",
      title: "선택된 영상",
      text: "선택한 영상들이 순서대로 표시됩니다."
    },
    2:{
      target: ".video-order",
      title: "영상 진행 순서",
      text: "영상은 위에서부터 자동으로 재생됩니다."
    },
    3:{
      target: ".cart-btn.primary",
      title: "영상 시청 시작",
      text: "버튼을 누르면 상담 영상 시청이 시작됩니다."
    },
    4:{
      target: ".cart-btn.secondary",
      title: "다시 선택",
      text: "영상 선택 화면으로 돌아갈 수 있습니다."
    }
  };

  const next = ()=>{
    if(step === 4){
      localStorage.setItem("checkout_onboarding_done","true");
      onClose();
      return;
    }
    setStep(prev=>prev+1);
  };

  useEffect(()=>{

    const handleKey = (e)=>{
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();

        if(step === 4){
          localStorage.setItem("checkout_onboarding_done","true");
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

  return(
    <>
      <div className="onboard-overlay"/>

      {rect && (
        <>
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
              top:
                step >= 3
                  ? rect.top - 250
                  : rect.bottom + 50,
              left:"50%",
              transform:"translateX(-50%)"
            }}
          >
            <h3>{config[step].title}</h3>
            <p>{config[step].text}</p>

            <button className="onboard-next" onClick={next}>
              {step===4 ? "확인" : "다음"}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default CheckoutOnboarding;