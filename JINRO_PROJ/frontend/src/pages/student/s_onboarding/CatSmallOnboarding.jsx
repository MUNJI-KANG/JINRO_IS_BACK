import { useState } from "react";
import "../../../css/student_css/s_onboarding/CatOnboarding.css"

function CatSmallOnboarding({ onClose }) {

  const [step,setStep]=useState(1);

  const config = {
    1:{
      target: ".cardGrid",
      text:"영상을 클릭하면 선택됩니다"
    },
    2:{
      target: ".selected-video-container",
      text:"선택된 영상은 여기서 확인 가능합니다"
    },
    3:{
      target: ".nextButton",
      text:"3개 선택 후 다음 단계로 이동합니다"
    }
  };

  const next=()=>{
    if(step===3) onClose();
    else setStep(step+1);
  };

  const rect = document.querySelector(config[step].target)?.getBoundingClientRect();

  return(
    <div className="onboard-overlay">
      {rect && (
        <>
          <div className="onboard-spotlight"
            style={{
              top:rect.top-6,
              left:rect.left-6,
              width:rect.width+12,
              height:rect.height+12
            }}
          />

          <div className="onboard-box"
            style={{
              top:rect.bottom+15,
              left:rect.left
            }}
          >
            <h3>영상 선택</h3>
            <p>{config[step].text}</p>
            <button className="onboard-next" onClick={next}>
              {step===3?"확인":"다음"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CatSmallOnboarding;