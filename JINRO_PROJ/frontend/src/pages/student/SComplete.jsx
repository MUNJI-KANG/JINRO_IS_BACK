import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/app.js';
import styles from '../../css/student_css/SComplete.module.css';

function SComplete() {
    const navigate = useNavigate();
    const [counselingVal, setCounselingVal] = useState(null);

    const checkIsOnboarding = () => {
        return localStorage.getItem("skip_all_onboarding") === "true" || 
               document.body.classList.contains("onboarding-lock");
    };

    useEffect(() => {
        if (checkIsOnboarding()) {
            console.log("온보딩 진행 중: AI 분석 요청 및 카메라 제어 중지");
            return; 
        }

        const triggerAIAnalysis = async () => {
            try {
                const counselingId = localStorage.getItem("counselingId");
                const clientId = localStorage.getItem("client_id");

                setCounselingVal(counselingId);

                if (!counselingId || !clientId) {
                    console.error("상담 ID 또는 학생 ID를 찾을 수 없습니다.");
                    return;
                }

                const response = await api.post('/client/complete/video', {
                    counseling_id: counselingId,
                    client_id: clientId
                });

                console.log("빽단에 분석 백그라운드 요청 완료:", response.data);

                localStorage.removeItem("counselingId");
                localStorage.removeItem("reportIds");
                localStorage.removeItem("videoStarted");
            } catch (error) {
                console.error("분석 요청 실패:", error);
            }
        };

        triggerAIAnalysis();

        const stopCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.log("카메라 종료:", err);
            }
        };
        stopCamera();
    }, []);

    const handleGoHome = (e) => {
        // ⭐ 온보딩 중일 때 홈 버튼 클릭도 막고 싶다면 이 주석을 해제하세요.
        /*
        if (checkIsOnboarding()) {
            e.preventDefault();
            return;
        }
        */
        
        localStorage.setItem("visited", "yes");
        navigate('/');
    };

    return (
        <main className={`${styles.container} global-complete-card`}>
            <div className={styles.iconWrapper}><div className={styles.checkIcon}></div></div>
            <h1 className={styles.title}>모든 상담이 완료되었습니다!</h1>
            <p className={styles.description}>
                오늘 참여해주신 소중한 상담 데이터 분석이 끝났습니다.<br />
                <span className={styles.highlight}>이제 당신의 마음 리포트를 확인해 보세요.</span>
            </p>
            <button className={`${styles.homeButton} global-complete-home`} onClick={handleGoHome}>
                홈으로 돌아가기
            </button>
        </main>
    );
}

export default SComplete;