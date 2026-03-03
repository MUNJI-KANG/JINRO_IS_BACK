import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import style from '../../css/student_css/SLogin.module.css';

const SLogin = () => {
    const navigate = useNavigate();

    // 1. 입력값을 관리할 상태(State) 선언
    const [formData, setFormData] = useState({
        name: "",
        ssn: "",
        phone: "",
        email: ""
    });

    // 2. 입력값이 변경될 때 상태를 업데이트하는 함수
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBack = () => {
        navigate("/student/agreement");  
    };

    // 3. 진단 시작 버튼 클릭 시 실행될 검증 함수
    const handleStartDiagnosis = async () => {
        const { name, ssn, phone, email } = formData;

        // 하나라도 비어있는 값이 있다면 알림을 띄우고 함수 종료(이동 불가)
        if (!name.trim() || !ssn.trim() || !phone.trim() || !email.trim()) {
            alert("모든 기본 정보를 입력해주세요.");
            return;
        }

        try {
            // 백엔드(FastAPI)로 POST 요청 전송
            const response = await fetch("http://localhost:8000/client/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name,
                    birthdate: ssn,     // 프론트엔드의 ssn을 백엔드의 birthdate에 매핑
                    phone_num: phone,   // 프론트엔드의 phone을 백엔드의 phone_num에 매핑
                    email: email
                }),
            });

            // 응답이 정상(200~299)이 아닐 경우 에러 처리
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "서버와의 통신에 실패했습니다.");
            }

            // 응답 데이터 파싱
            const data = await response.json();
            console.log("로그인(회원가입) 성공:", data);

            // 향후 상담 진행이나 다른 페이지에서 사용할 수 있도록 client_id를 localStorage에 저장
            localStorage.setItem("client_id", data.client_id);

            // 모든 처리가 완료되면 다음 페이지로 이동
            navigate("/student/category/big");

        } catch (error) {
            console.error("로그인 에러:", error);
            alert(`정보 처리 중 오류가 발생했습니다: ${error.message}\n잠시 후 다시 시도해주세요.`);
        }
    };

    return (
        <div className={style.container}>
            <div className={style.card}>
                
                {/* 1. 이전으로 버튼 */}
                <button 
                    className={style.backButton}
                    onClick={handleBack}
                    type="button"
                >
                    <div className={style.backCircle}>←</div>
                    <span className={style.backText}>이전으로</span>
                </button>

                {/* 헤더 */}
                <div className={style.header}>
                    <h1>환영합니다!</h1>
                    <p>기본 정보를 입력해주세요</p>
                </div>

                {/* 입력창 세트 */}
                <div className={style.formContainer}>
                    <div className={style.formGroup}>
                        <label>이름</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="예 : 홍길동" 
                        />
                    </div>

                    <div className={style.formGroup}>
                        <label>주민번호 7자리</label>
                        <input 
                            type="text" 
                            name="ssn"
                            value={formData.ssn}
                            onChange={handleChange}
                            placeholder="예 : 0001011" 
                        />
                    </div>

                    <div className={style.formGroup}>
                        <label>핸드폰 번호</label>
                        <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="예 : 01011112222" 
                        />
                    </div>

                    <div className={style.formGroup}>
                        <label>이메일</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="예 : aaaaa@example.com" 
                        />
                    </div>
                </div>

                {/* 하단 버튼 */}
                <button 
                    className={style.submitButton} 
                    type="button" 
                    onClick={handleStartDiagnosis}
                >
                    <span className={style.submitText}>진단 시작하기</span>
                </button>
            </div>
        </div>
    );
};

export default SLogin;