import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import style from '../../css/student_css/SLogin.module.css';
import api from '../../services/app.js';
import { useDispatch } from 'react-redux';
import { clearVideos, addVideo } from '../../redux/cVideos';

const SLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false); // 이어볼 영상이 있는지 확인


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

        if (isLoading) return;

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
            const response = await api.post("/client/login", {
                name: name,
                birthdate: fullSsn,
                phone_num: fullPhone,
                email: fullEmail,

            });

            const data = response.data;
            localStorage.setItem("client_id", data.client_id);
            
            if (data.has_unfinished_video) {
                const wantsToContinue = window.confirm('아직 완료하지 않은 영상이 있습니다. 이어보시겠습니까?');
                if (wantsToContinue) {
                    // 1. 리덕스에 남은 영상 목록 채워넣기
                    if (data.video_list && data.video_list.length > 0) {
                        dispatch(addVideo(data.video_list));
                    }
                    
                    // 2. localStorage 대신 navigate의 state로 데이터를 숨겨서 전달!
                    navigate(`/student/video/${data.category_id}`, { 
                        state: { 
                            isResume: true, 
                            counseling_id: data.counseling_id,
                            report_ids: data.report_ids
                        } 
                    });
                    return; 
                } else {
                    try {
                        // 1. 백엔드에 기존 상담 세션(Counseling, ReportAiV) 삭제 요청
                        await api.delete(`/client/counselling/${data.counseling_id}`);
                        
                        // 2. 혹시 남아있을지 모르는 로컬 데이터도 안전하게 초기화
                        localStorage.removeItem("counseling_id");
                        localStorage.removeItem("report_ids");
                        dispatch(clearVideos()); // 리덕스 초기화
                        
                    } catch (err) {
                        console.error("기존 기록 삭제 실패:", err);
                        alert("기존 기록을 삭제하는 중 문제가 발생했습니다.");
                        setIsLoading(false); // 에러 발생 시 로딩 풀어주기
                        return; // 삭제에 실패하면 다음 페이지로 넘어가지 않도록 막음
                    }
                }
            }

            navigate("/student/category/big");

        } catch (error) {
            console.error("로그인 에러:", error);
            alert(`오류: ${error.message}`);
        }
    };

    useEffect(() => {
        sessionStorage.clear();
        localStorage.clear();
        dispatch(clearVideos());
        api.get('client/sesstion/clear');
    }, []);

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
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, emailDomain: "" }))} className={style.resetBtn}>✕</button>
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