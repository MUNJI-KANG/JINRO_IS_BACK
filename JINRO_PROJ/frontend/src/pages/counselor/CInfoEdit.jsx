import { useState, useEffect } from "react";
import "../../css/counselor_css/CInfoEdit.css";

function CInfoEdit() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const fetchCounselorInfo = async () => {
      const counselorId = localStorage.getItem("counselor_id");
      if (!counselorId) return;

      try {
        const response = await fetch(
          `http://localhost:8000/counselor/${counselorId}`
        );

        const data = await response.json();

        if (data.success) {
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
          });
        }
      } catch (error) {
        console.error("정보 조회 실패:", error);
      }
    };

    fetchCounselorInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const counselorId = localStorage.getItem("counselor_id");
    if (!counselorId) return;

    try {
      await fetch(`http://localhost:8000/counselor/${counselorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      alert("정보가 저장되었습니다.");
    } catch (error) {
      console.error("수정 실패:", error);
    }
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