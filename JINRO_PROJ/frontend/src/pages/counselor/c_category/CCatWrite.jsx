import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../../css/counselor_css/CCatWrite.css";

export default function CCatWrite() {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state; // 🔥 detail에서 넘어온 데이터

  // 🔥 나중에 이전 페이지에서 넘겨줄 kindId (넘겨주지 않으면 기본값 3)
  const currentKindId = editData?.kindId || 3;

  const [categoryName, setCategoryName] = useState("");
  const [url, setUrl] = useState("");

  const [questions, setQuestions] = useState([
    {
      questionText: "",
      options: ["매우 잘 맞는다", "잘 맞는 편이다", "보통이다", "잘 맞지 않는다", "전혀 맞지 않는다"],
    },
  ]);

  /* 🔥 수정 모드일 경우 값 채우기 */
  useEffect(() => {
    if (editData) {
      setCategoryName(editData.title || editData.category || "");
      setUrl(editData.url || "");

      if (editData.survey && editData.survey.length > 0) {
        setQuestions(editData.survey);
      } else {
        setQuestions([
          {
            questionText: editData.question || "",
            options: ["매우 잘 맞는다", "잘 맞는 편이다", "보통이다", "잘 맞지 않는다", "전혀 맞지 않는다"],
          },
        ]);
      }
    }
  }, [editData]);

  /* 질문 텍스트 변경 */
  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index].questionText = value;
    setQuestions(updated);
  };

  /* 옵션 변경 */
  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  /* 질문 추가 */
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        options: ["매우 잘 맞는다", "잘 맞는 편이다", "보통이다", "잘 맞지 않는다", "전혀 맞지 않는다"],
      },
    ]);
  };

  const handleSave = async (e) => {
    e.preventDefault(); // 폼 새로고침 방지

    // 유효성 검사
    if (!categoryName || !url) {
      alert("카테고리, URL를 모두 입력해주세요.");
      return;
    }

    // 🌟 요청할 페이로드(데이터) 조합 (테이블 컬럼명에 맞춤)
    const payload = {
      title: categoryName,
      url: url,
      kind: currentKindId, // 🔥 위에서 선언한 currentKindId 변수를 사용
      survey: questions, 
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/counselor/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        navigate(-1); // 이전 페이지로 돌아가기
      } else {
        alert("저장 실패: " + data.message);
      }
    } catch (error) {
      console.error("저장 통신 에러:", error);
      alert("서버와 통신하는 데 문제가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleSave}>
      <div className="category-add-container">
        <h2>{editData ? "카테고리 수정" : "카테고리 추가"}</h2>
        {/* hidden 인풋은 삭제하셔도 됩니다. */}
        
        {/* 카테고리 */}
        <div className="form-row">
          <label>카테고리:</label>
          <input
            className="wide-input"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>

        {/* URL */}
        <div className="form-row">
          <label>URL:</label>
          <input
            className="wide-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        {/* 질문 영역 */}
        <div className="question-scroll-area">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-block">
              <div className="question-header">
                <span>질문 {qIndex + 1}</span>
              </div>

              <textarea
                placeholder="질문을 입력하세요"
                value={q.questionText}
                onChange={(e) =>
                  handleQuestionChange(qIndex, e.target.value)
                }
              />

              <div className="option-grid">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="option-item">
                    <label>{5 - oIndex}점</label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(
                          qIndex,
                          oIndex,
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 질문 추가 버튼 */}
        <div className="add-question-btn">
          <button type="button" onClick={handleAddQuestion}>질문 추가</button>
        </div>

        {/* 하단 버튼 */}
        <div className="bottom-buttons">
          <button type="button" onClick={() => navigate(-1)}>취소</button>
          <button className="save-btn" type="submit">
            저장
          </button>
        </div>
      </div>
    </form>
  );
}