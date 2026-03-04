import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../css/student_css/SComplete.module.css';

function SComplete() {

    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <main className={styles.container}>

            {/* 상단 체크 아이콘 영역 */}
            <div className={styles.iconWrapper}>
                <div className={styles.checkIcon}></div>
            </div>

            {/* 텍스트 영역 */}
            <h1 className={styles.title}>모든 상담이 완료되었습니다!</h1>

            <p className={styles.description}>
                오늘 참여해주신 소중한 상담 데이터 분석이 끝났습니다.
                <span className={styles.highlight}>
                    이제 당신의 마음 리포트를 확인해 보세요.
                </span>
            </p>

            {/* 홈으로 버튼 */}
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