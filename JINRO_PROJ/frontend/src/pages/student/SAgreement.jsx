import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Agreement() {
  // 체크 상태
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);

  const navigate = useNavigate();
  // 두 항목 모두 동의 여부
  const allAgreed = agree1 && agree2;

  return (
    <div>
      <h2>진단 시작 전 동의서</h2>

      {/* 동의서 1 */}
      <div>
        <h4>정보 수집 및 이용 동의</h4>
        <p>
          본 서비스는 진로 흥미도 분석을 위해 영상 시청 중 귀하의 반응
          데이터를 수집합니다.
        </p>

        <label>
          <input
            type="checkbox"
            checked={agree1}
            onChange={(e) => setAgree1(e.target.checked)}
          />
          위 내용에 동의합니다
        </label>
      </div>

      {/* 동의서 2 */}
      <div>
        <h4>카메라를 통한 얼굴 촬영 동의</h4>
        <p>
          AI 기반 감정 분석을 위해 상담 중 귀하의 얼굴 표정이
          실시간으로 촬영됩니다.
        </p>

        <label>
          <input
            type="checkbox"
            checked={agree2}
            onChange={(e) => setAgree2(e.target.checked)}
          />
          위 내용에 동의합니다
        </label>
      </div>

      {/* 안내 메시지 */}
      {!allAgreed && (
        <p>모든 항목에 동의해주세요.</p>
      )}

      {/* 시작 버튼 */}
      <button
        disabled={!allAgreed}
        onClick={() => navigate("/student/video")}
      >
        {allAgreed ? "시작하기" : "동의 필요"}
      </button>
    </div>
  );
}

export default Agreement;