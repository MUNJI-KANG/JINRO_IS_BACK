import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Select() {
  const navigate = useNavigate();

  // 선택된 분야
  const [selected, setSelected] = useState([]);

  const fields = ["IT", "디자인", "의료", "경영", "예술"];

  const toggleField = (field) => {
    if (selected.includes(field)) {
      setSelected(selected.filter((f) => f !== field));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, field]);
      }
    }
  };

  return (
    <div>
      <h2>진로 분야 선택</h2>
      <p>관심 있는 분야를 3개 선택하세요</p>

      {/* 분야 목록 */}
      <div>
        {fields.map((field) => (
          <button
            key={field}
            onClick={() => toggleField(field)}
            style={{
              margin: "10px",
              background: selected.includes(field)
                ? "#4CAF50"
                : "#ddd",
            }}
          >
            {field}
          </button>
        ))}
      </div>

      <p>선택된 분야: {selected.join(", ")}</p>

      {/* 다음 버튼 */}
      <button
        disabled={selected.length !== 3}
        onClick={() => navigate("/student/video")}
      >
        다음
      </button>
    </div>
  );
}

export default Select;