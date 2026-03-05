import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from '../../css/student_css/SSurvey.module.css';
import api from '../../services/app'

function SSurvey() {

    const { categoryId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const selectedVideos = useSelector((state) => state.cVideos);
    const { currentIndex = 0 } = location.state || {};

    const counselingId = useSelector((state) => state.counselingId);
    const [surveyInfo, setSurveyInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchSurvey = async () => {

            try {

                const response = await api.get(
                    `/client/survey/${categoryId}`
                );

                if (response.data.success) {
                    setSurveyInfo(response.data.data);
                }

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }

        };

        fetchSurvey();

    }, [categoryId]);

    const handleNext = async () => {

        const questions = typeof surveyInfo.survey === "string"
            ? JSON.parse(surveyInfo.survey)
            : surveyInfo.survey;

        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
            return;
        }

        try {

            const payload = {
                counseling_id: counselingId,
                category: surveyInfo.title,
                url: surveyInfo.url || "",
                answer: answers
            };

            await api.post(
                "/client/survey/submit",
                payload
            );

            const nextIdx = currentIndex + 1;

            if (!selectedVideos || nextIdx >= selectedVideos.length) {
                navigate("/student/complete");
                return;
            }

            const nextVideo = selectedVideos[nextIdx];

            if (!nextVideo) {
                navigate("/student/complete");
                return;
            }

            navigate(`/student/video/${nextVideo.id}`, {
                state: { currentIndex: nextIdx }
            });

        } catch (err) {
            console.error(err);
        }
    };



    const questions = React.useMemo(() => {
        if (!surveyInfo) return [];
        return typeof surveyInfo.survey === "string"
            ? JSON.parse(surveyInfo.survey)
            : surveyInfo.survey;
    }, [surveyInfo]);

    if (loading || !surveyInfo) {
        return <div className={styles.surveyContainer}>로딩 중...</div>;
    }

    const isLastQuestion = currentStep === questions.length - 1;

    const isLastVideo =
        selectedVideos &&
        selectedVideos.length > 0 &&
        currentIndex === selectedVideos.length - 1;

    let buttonText = "다음 문항";

    if (isLastQuestion) {
        buttonText = isLastVideo ? "결과 제출" : "다음 섹션으로";
    }

    return (
        <div className={styles.surveyContainer}>

            <div className={styles.surveyCard}>

                <button
                    className={styles.backButton}
                    onClick={() =>
                        currentStep > 0
                            ? setCurrentStep(prev => prev - 1)
                            : navigate(-1)
                    }
                >
                    ← 이전으로
                </button>

                <div className={styles.headerRow}>
                    <h1 className={styles.mainTitle}>
                        {surveyInfo.title} 진단
                    </h1>

                    <span className={styles.stepIndicator}>
                        {currentStep + 1} / {questions.length}
                    </span>
                </div>

                <div className={styles.progressWrapper}>
                    <div
                        className={styles.progressBar}
                        style={{
                            width: `${((currentStep + 1) / questions.length) * 100}%`
                        }}
                    />
                </div>

                <h2 className={styles.questionText}>
                    {questions[currentStep].questionText}
                </h2>

                <div className={styles.optionsList}>

                    {questions[currentStep].options.map((option, idx) => (

                        <div
                            key={idx}
                            className={`${styles.optionItem} ${
                                answers[currentStep] === idx ? styles.selected : ""
                            }`}
                            onClick={() =>
                                setAnswers(prev => ({
                                    ...prev,
                                    [currentStep]: idx
                                }))
                            }
                        >

                            <span className={styles.optionLabel}>
                                {option}
                            </span>

                            <div className={styles.radioCircle} />

                        </div>

                    ))}

                </div>

                <div style={{ textAlign: "center", marginTop: "30px" }}>

                    <button
                        className={styles.nextButton}
                        onClick={handleNext}
                        disabled={answers[currentStep] === undefined}
                        style={{
                            padding: "12px 60px",
                            backgroundColor:
                                answers[currentStep] !== undefined
                                    ? "#E50914"
                                    : "#ccc",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "18px",
                            fontWeight: "bold"
                        }}
                    >
                        {buttonText}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default SSurvey;