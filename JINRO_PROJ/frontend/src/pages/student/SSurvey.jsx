import React, { useState } from 'react';
import styles from '../../css/student_css/SSurvey.module.css';

function SSurvey() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState(null);

    const totalSteps = 6;
    const options = [
        { id: 1, text: '매우 설렌다' },
        { id: 2, text: '흥미롭다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '나와 맞지 않을 것 같다' },
    ];

    const handleSelect = (id) => {
        setSelectedOption(id);
    };

    return (
        <div className={styles.surveyContainer}>
            <div className={styles.surveyCard}>
                {/* 상단 버튼 영역 */}
                <button className={styles.backButton} onClick={() => console.log('이전으로')}>
                    ← 이전으로
                </button>

                {/* 헤더: 타이틀 & 진행도 */}
                <div className={styles.headerRow}>
                    <h1 className={styles.mainTitle}>
                        직업 흥미도 진단
                    </h1>
                    <span className={styles.stepIndicator}>{currentStep} / {totalSteps}</span>
                </div>
                <p className={styles.subTitle}>해당 세션의 직무 분야에 대한 당신의 생각은?</p>

                {/* 진행 바 */}
                <div className={styles.progressWrapper}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                </div>

                {/* 문항 질문 */}
                <h2 className={styles.questionText}>
                    방금 본 영상의 활동을 실제로 직업으로 삼는다면 어떨 것 같나요?
                </h2>

                {/* 선택지 목록 */}
                <div className={styles.optionsList}>
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={`${styles.optionItem} ${selectedOption === option.id ? styles.selected : ''}`}
                            onClick={() => handleSelect(option.id)}
                        >
                            <span className={styles.optionLabel}>{option.text}</span>
                            <div className={styles.radioCircle} />
                        </div>
                    ))}
                </div>

                <p className={styles.footerNotice}>
                    모든 문항에 답하면 다음 세션으로 넘어갑니다.
                </p>
            </div>
        </div>
    );
};

export default SSurvey;