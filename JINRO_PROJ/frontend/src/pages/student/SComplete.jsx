import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../css/student_css/SComplete.module.css';

function SComplete() {

    const navigate = useNavigate();

    useEffect(() => {

        // localStorage 정리
        localStorage.removeItem("counselingId");
        localStorage.removeItem("reportIds");
        localStorage.removeItem("videoStarted");

        // ⭐ 카메라 강제 종료
        const stopCamera = async () => {

            try {

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

                stream.getTracks().forEach(track => track.stop());

            } catch (err) {

                console.log("카메라 종료:", err);

            }

        };

        stopCamera();

    }, []);

    const handleGoHome = () => {

        navigate('/');

    };

    return (

        <main className={styles.container}>

            <div className={styles.iconWrapper}>
                <div className={styles.checkIcon}></div>
            </div>

            <h1 className={styles.title}>
                모든 상담이 완료되었습니다!
            </h1>

            <p className={styles.description}>
                오늘 참여해주신 소중한 상담 데이터 분석이 끝났습니다.
                <span className={styles.highlight}>
                    이제 당신의 마음 리포트를 확인해 보세요.
                </span>
            </p>

            <button
                className={styles.homeButton}
                onClick={handleGoHome}
            >
                홈으로 돌아가기
            </button>

        </main>

    );

}

export default SComplete;