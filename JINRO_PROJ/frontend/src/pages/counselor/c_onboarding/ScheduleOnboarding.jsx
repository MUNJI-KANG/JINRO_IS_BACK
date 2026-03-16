import { useState, useEffect } from "react";
import "../../../css/counselor_css/onboarding/ScheduleOnboarding.css";

function CSchedulerOnboarding({ onClose }) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  const config = {
    1:{
      target:".calendar-section",
      title:"상담 캘린더",
      text:"날짜를 클릭하면 해당 날짜의 상담 일정이 표시됩니다."
    },
    2:{
      target:".add-btn",
      title:"일정 추가",
      text:"대상 학생을 선택하여 상담 일정을 등록할 수 있습니다."
    },
    3:{
      target:".empty-box",
      title:"일정 상태",
      text:"해당 날짜에 등록된 상담 학생 리스트를 띄워줍니다. 클릭시 최종리포트로 이동합니다."
    }
  };

  /* ⭐ body scroll lock */
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

  /* ⭐ 키보드 진행 */
  useEffect(()=>{

    const key = (e)=>{
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();
        next();
      }
    };

    window.addEventListener("keydown",key);
    return ()=>window.removeEventListener("keydown",key);

  },[step]);

  /* ⭐ spotlight tracking */
  useEffect(()=>{

    const update = ()=>{

      const el = document.querySelector(config[step].target);

      /* 🔥 step3인데 empty-box 없으면 → skip */
      if(!el){
        if(step===3){
          onClose();
          return;
        }
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
      onClose();
      return;
    }

    setStep(prev=>prev+1);
  };

  if(!rect) return null;

  return(
    <div className="sched-onboard-layer">

      <div
        className="sched-onboard-spot"
        style={{
          top:Math.round(rect.top-8),
          left:Math.round(rect.left-8),
          width:Math.round(rect.width+16),
          height:Math.round(rect.height+16)
        }}
      />

      {/* ⭐ STEP 1 */}
      {step===1 && (
        <div
          className="sched-onboard-guide"
          style={{
            top: rect.bottom - 400,
            left:"65%",
            transform:"translateX(-50%)"
          }}
        >
          <div className="sched-onboard-title">{config[step].title}</div>
          <div className="sched-onboard-desc">{config[step].text}</div>

          <button className="sched-onboard-btn" onClick={next}>
            다음
          </button>
        </div>
      )}

      {/* ⭐ STEP 2 */}
      {step===2 && (
        <div
          className="sched-onboard-guide"
          style={{
            top: rect.bottom + 20,
            left: rect.right - 320
          }}
        >
          <div className="sched-onboard-title">{config[step].title}</div>
          <div className="sched-onboard-desc">{config[step].text}</div>

          <button className="sched-onboard-btn" onClick={next}>
            다음
          </button>
        </div>
      )}

      {/* ⭐ STEP 3 */}
      {step===3 && (
        <div
          className="sched-onboard-guide"
          style={{
            position:"fixed",
            top:"50%",
            left:"38%",
            transform:"translate(-50%,-50%)"
          }}
        >
          <div className="sched-onboard-title">{config[step].title}</div>
          <div className="sched-onboard-desc">{config[step].text}</div>

          <button className="sched-onboard-btn" onClick={next}>
            확인
          </button>
        </div>
      )}

    </div>
  );
}

export default CSchedulerOnboarding;