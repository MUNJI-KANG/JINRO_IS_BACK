// src/pages/counselor/CInfoEdit.jsx

import { useState } from "react";
import "../../css/counselor_css/CInfoEdit.css";

function CInfoEdit() {
  const [formData, setFormData] = useState({
    name: "홍길동",
    phone: "010-1234-5678",
    email: "000123@naver.com",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("수정 데이터:", formData);
    alert("정보가 저장되었습니다.");
  };

  return (
      <div className="cinfoedit-container">
        <h2 className="content-title">정보수정</h2>

        <div className="cinfoedit-form">
          <div className="form-row">
            <label>이름:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>전화번호:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>e-mail:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="button-wrapper">
            <button className="save-btn" onClick={handleSubmit}>
              저장
            </button>
          </div>
        </div>
      </div>
  );
}

export default CInfoEdit;