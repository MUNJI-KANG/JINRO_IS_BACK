
import { useState } from "react";
import "../../../css/student_css/s_onboarding/CatOnboarding.css"

function CatMedOnboarding({ onClose }) {

  const [step,setStep]=useState(1);

  const config = {
    1:{
      target: ".cardGrid",
      text: "세부 분야를 선택합니다"
    },
    2:{
      target: ".progressBadge",
      text: "현재 선택한 영상 개수를 확인할 수 있습니다"
    }
  };

  const next = ()=>{
    if(step===2) onClose();
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
            <h3>세부 분야 선택</h3>
            <p>{config[step].text}</p>
            <button className="onboard-next" onClick={next}>
              {step===2?"확인":"다음"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CatMedOnboarding;