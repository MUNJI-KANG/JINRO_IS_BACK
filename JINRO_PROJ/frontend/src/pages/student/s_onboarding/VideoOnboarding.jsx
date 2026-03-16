import { useEffect, useState } from "react";
import "../../../css/student_css/s_onboarding/VideoOnboarding.css"

function SVideoOnboarding({ phase, onClose }) {

  const [step,setStep] = useState(1);
  const [rect,setRect] = useState(null);

  const camConfig = {
    1:{ target: ".webcam-view", title:"웹캠 분석", text:"웹캠으로 얼굴 방향을 분석합니다." },
    2:{ target: ".analysis-status", title:"정면 유지", text:"정면을 3초 유지하면 영상이 시작됩니다." }
  };

  const watchConfig = {
    1:{ target: ".video-container", title:"영상 시청", text:"영상 시청하시는 모습이 녹화됩니다." },
    2:{ target: ".survey-btn", title:"설문 이동", text:"영상 종료 후 버튼이 설문 단계버튼이 활성됩니다." }
  };

  const config = phase===1 ? camConfig : watchConfig;

  const next = ()=>{

    if(step===2){

      if(phase===1)
        localStorage.setItem("svideo_cam_onboard_done","true");

      if(phase===2)
        localStorage.setItem("svideo_watch_onboard_done","true");

      onClose();
      return;
    }

    setStep(prev=>prev+1);
  };

  useEffect(()=>{

    let frame;

    const update = ()=>{

      const el = document.querySelector(config[step].target);

      if(!el){
        frame=requestAnimationFrame(update);
        return;
      }

      const r = el.getBoundingClientRect();

      if(r.width===0 || r.height===0){
        frame=requestAnimationFrame(update);
        return;
      }

      setRect(r);

      frame=requestAnimationFrame(update);
    };

    frame=requestAnimationFrame(update);

    return ()=> cancelAnimationFrame(frame);

  },[step,phase]);

  return(
    <>
      <div className="svideo-onboard-dim"/>

      {rect && (
        <>
          <div
            className="svideo-onboard-spot"
            style={{
              top:rect.top-10,
              left:rect.left-10,
              width:rect.width+20,
              height:rect.height+20
            }}
          />

          <div
            className="svideo-onboard-box"
            style={{
            top:
                rect.top > window.innerHeight / 2
                ? rect.top - 250   // 대상이 아래쪽 → 박스 위로
                : rect.bottom - 400, // 대상이 위쪽 → 박스 아래로
            left: "50%",
            transform: "translateX(-50%)"
            }}
          >
            <h3>{config[step].title}</h3>
            <p>{config[step].text}</p>

            <button className="svideo-onboard-btn" onClick={next}>
              {step===2 ? "확인" : "다음"}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default SVideoOnboarding;