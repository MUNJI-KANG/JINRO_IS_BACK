import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import style from '../../css/student_css/SLogin.module.css';

const SLogin = () => {
    const navigate = useNavigate();

    // 1. 상태 관리: 세분화된 입력값 대응
    const [formData, setFormData] = useState({
        name: "",
        ssn1: "", // 주민번호 앞 6자리
        ssn2: "", // 주민번호 뒤 1자리
        phone1: "010", // 휴대폰 첫자리 (기본값 010)
        phone2: "",
        phone3: "",
        emailId: "", // 이메일 아이디
        emailDomain: "", // 선택된 도메인
        customEmailDomain: "" // 직접 입력용 도메인
    });

    // 2. 입력값 변경 핸들러
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

    // 3. 진단 시작 및 데이터 검증
    const handleStartDiagnosis = async () => {
        const { 
            name, ssn1, ssn2, 
            phone1, phone2, phone3, 
            emailId, emailDomain, customEmailDomain 
        } = formData;

        const finalEmailDomain = emailDomain === "custom" ? customEmailDomain : emailDomain;

        if (
            !name.trim() || !ssn1.trim() || !ssn2.trim() || 
            !phone2.trim() || !phone3.trim() || 
            !emailId.trim() || !finalEmailDomain
        ) {
            alert("모든 정보를 정확히 입력해주세요.");
            return;
        }

        const fullSsn = `${ssn1}${ssn2}`;
        const fullPhone = `${phone1}${phone2}${phone3}`;
        const fullEmail = `${emailId}@${finalEmailDomain}`;

        try {
            const response = await fetch("http://localhost:8000/client/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    birthdate: fullSsn,
                    phone_num: fullPhone,
                    email: fullEmail
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "서버 통신 실패");
            }

            const data = await response.json();
            localStorage.setItem("client_id", data.client_id);
            navigate("/student/category/big");

        } catch (error) {
            console.error("로그인 에러:", error);
            alert(`오류: ${error.message}`);
        }
    };

    return (
        <div className={style.container}>
            <div className={style.card}>
                <button className={style.backButton} onClick={handleBack} type="button">
                    <div className={style.backCircle}>←</div>
                    <span className={style.backText}>이전으로</span>
                </button>

                <div className={style.header}>
                    <h1>환영합니다!</h1>
                    <p>기본 정보를 입력해주세요</p>
                </div>

                <div className={style.formContainer}>
                    {/* 이름 */}
                    <div className={style.formGroup}>
                        <label>이름</label>
                        <div className={style.inputRow}>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="예 : 홍길동" 
                                className={style.nameInput}
                            />
                        </div>
                    </div>

                    {/* 주민번호 */}
                    <div className={style.formGroup}>
                        <label>주민등록번호</label>
                        <div className={style.inputRow}>
                            <input type="text" name="ssn1" maxLength="6" value={formData.ssn1} onChange={handleChange} placeholder="앞 6자리" style={{ flex: 2 }} />
                            <span>-</span>
                            <input type="text" name="ssn2" maxLength="1" value={formData.ssn2} onChange={handleChange} style={{ width: '45px', textAlign: 'center' }} />
                            <span className={style.ssnMask}>******</span>
                        </div>
                    </div>

                    {/* 핸드폰 */}
                    <div className={style.formGroup}>
                        <label>핸드폰 번호</label>
                        <div className={style.inputRow}>
                            <select name="phone1" value={formData.phone1} onChange={handleChange} style={{ width: '85px' }}>
                                <option value="010">010</option>
                                <option value="011">011</option>
                                <option value="012">012</option>
                            </select>
                            <span>-</span>
                            <input type="text" name="phone2" maxLength="4" value={formData.phone2} onChange={handleChange} style={{ flex: 1, textAlign: 'center' }} />
                            <span>-</span>
                            <input type="text" name="phone3" maxLength="4" value={formData.phone3} onChange={handleChange} style={{ flex: 1, textAlign: 'center' }} />
                        </div>
                    </div>

                    {/* 이메일 */}
                    <div className={style.formGroup}>
                        <label>이메일</label>
                        <div className={style.inputRow}>
                            <input type="text" name="emailId" value={formData.emailId} onChange={handleChange} placeholder="이메일" style={{ flex: 1 }} />
                            <span>@</span>
                            {formData.emailDomain === "custom" ? (
                                <div style={{ flex: 1.2, display: 'flex', gap: '4px' }}>
                                    <input type="text" name="customEmailDomain" value={formData.customEmailDomain} onChange={handleChange} placeholder="직접 입력" style={{ width: '100%' }} />
                                    <button type="button" onClick={() => setFormData(p => ({...p, emailDomain: ""}))} className={style.resetBtn}>✕</button>
                                </div>
                            ) : (
                                <select name="emailDomain" value={formData.emailDomain} onChange={handleChange} style={{ flex: 1.2 }}>
                                    <option value="">선택하세요</option>
                                    <option value="naver.com">naver.com</option>
                                    <option value="gmail.com">gmail.com</option>
                                    <option value="daum.net">daum.net</option>
                                    <option value="custom">직접 입력</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                <button className={style.submitButton} type="button" onClick={handleStartDiagnosis}>
                    <span className={style.submitText}>진단 시작하기</span>
                </button>
            </div>
        </div>
    );
};

export default SLogin;