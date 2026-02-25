import { useState } from "react";
import "../../../css/counselor_css/CCatWrite.css";

export default function CCatWrite() {
  const [categoryName, setCategoryName] = useState("");
  const [url, setUrl] = useState("");

  const [questions, setQuestions] = useState([
    {
      questionText: "",
      options: ["", "", "", "", ""], // 5점 ~ 1점
    },
  ]);

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
        options: ["", "", "", "", ""],
      },
    ]);
  };

  const handleSave = () => {
    const payload = {
      categoryName,
      url,
      questions,
    };

    console.log(payload);
  };

  return (
    <div className="category-add-container">
      <h2>카테고리 추가</h2>

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

      {/* 질문 스크롤 영역 */}
      <div className="question-scroll-area">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-block">
            <div className="question-header">
              <span>질문 {qIndex + 1}</span>
            </div>

            {/* 질문 텍스트 */}
            <textarea
              placeholder="질문을 입력하세요"
              value={q.questionText}
              onChange={(e) =>
                handleQuestionChange(qIndex, e.target.value)
              }
            />

            {/* 5개 옵션 */}
            <div className="option-grid">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="option-item">
                  <label>{5 - oIndex}점</label>
                  <input
                    type="text"
                    placeholder="옵션 내용을 입력하세요"
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
        <button onClick={handleAddQuestion}>질문 추가</button>
      </div>

      {/* 하단 버튼 */}
      <div className="bottom-buttons">
        <button>취소</button>
        <button className="save-btn" onClick={handleSave}>
          저장
        </button>
      </div>
    </div>
  );
}