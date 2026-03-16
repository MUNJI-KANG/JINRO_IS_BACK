import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/SurveyOnboarding.css"

function SSurveyOnboarding({ onClose }) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  const config = {
    1:{
      target: ".survey-progress",
      title: "설문 진행 상태",
      text: "현재 설문 진행률을 확인할 수 있습니다."
    },
    2:{
      target: ".survey-options",
      title: "문항 선택",
      text: "가장 적합한 항목을 선택하세요."
    },
    3:{
      target: ".survey-next-btn",
      title: "다음 문항 이동",
      text: "선택 후 버튼을 눌러 다음 문항으로 이동합니다."
    }
  };

  const next = ()=>{

    if(step===3){
      localStorage.setItem("ssurvey_onboard_done","true");
      onClose();
      return;
    }

    setStep(prev=>prev+1);
  };

  /* 키보드 이동 */
  useEffect(()=>{

    const handleKey = (e)=>{
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();
        next();
      }
    };

    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);

  },[step]);

  /* spotlight tracking */
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

      setRect(r);
      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);

    return ()=>cancelAnimationFrame(frame);

  },[step]);

  return(
    <>
      <div className="ssurvey-onboard-dim"/>

      {rect && (
        <>
          <div
            className="ssurvey-onboard-spot"
            style={{
              top: rect.top - 10,
              left: rect.left - 10,
              width: rect.width + 20,
              height: rect.height + 20
            }}
          />

          <div
            className="ssurvey-onboard-box"
            style={{
              top:
                rect.top > window.innerHeight / 2
                  ? rect.top - 260
                  : rect.bottom + 30,
              left:"50%",
              transform:"translateX(-50%)"
            }}
          >
            <h3>{config[step].title}</h3>
            <p>{config[step].text}</p>

            <button
              className="ssurvey-onboard-btn"
              onClick={next}
            >
              {step===3 ? "확인" : "다음"}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default SSurveyOnboarding;