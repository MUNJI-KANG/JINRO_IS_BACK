import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from '../../css/student_css/SSurvey.module.css';
import api from '../../services/app';
import SSurveyOnboarding from '../student/s_onboarding/SurveyOnboarding.jsx';

function SSurvey() {

    const [onboard,setOnboard] = useState(false);

    const { categoryId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const selectedVideos = useSelector((state) => state.cVideos);
    const { currentIndex = 0 } = location.state || {};

    const [surveyInfo, setSurveyInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);

    const reduxCounselingId = useSelector((state) => state.counselingId);
    const counselingId = reduxCounselingId || localStorage.getItem('counselingId');

    /* ⭐⭐⭐ Survey 온보딩 */
    useEffect(()=>{

        // ⭐ 최초 진입 즉시 차단
        if(localStorage.getItem("skip_all_onboarding")==="true")
            return;

        const done = localStorage.getItem("ssurvey_onboard_done");
        if(done==="true") return;

        let t = setTimeout(()=>{

            // ⭐ 타이머 실행 시점 재확인 (중요)
            if(localStorage.getItem("skip_all_onboarding")==="true")
                return;

            setOnboard(true);

        },400);

        return ()=>clearTimeout(t);

    },[]);

    /* ⭐ 설문 fetch */
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

        if (!counselingId) {
            console.error("상담 ID 없음");
            alert("상담 정보가 없습니다.");
            return;
        }

        try {

            const reportIds = JSON.parse(localStorage.getItem("reportIds") || "[]");
            const currentReportId = reportIds[currentIndex];

            if (!currentReportId) {
                console.error("report_id 없음");
                alert("리포트 정보가 없습니다.");
                return;
            }

            await api.post("/client/pComplete", {
                counseling_id: Number(counselingId),
                report_id: currentReportId,
                answer: answers
            });

            const nextIdx = currentIndex + 1;

            if (!selectedVideos || nextIdx >= selectedVideos.length) {
                navigate("/student/complete");
                localStorage.removeItem("videoStarted");
                return;
            }

            const nextVideoId = Number(selectedVideos[nextIdx].id);

            navigate(`/student/video/${nextVideoId}`, {
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

            {onboard && (
                <SSurveyOnboarding
                    onClose={()=>setOnboard(false)}
                />
            )}

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

                <div className={`${styles.progressWrapper} survey-progress`}>
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

                <div className={`${styles.optionsList} survey-options`}>

                    {questions[currentStep].options.map((option, idx) => (

                        <div
                            key={idx}
                            className={`${styles.optionItem} ${
                                answers[currentStep] === (4 - idx)
                                    ? styles.selected
                                    : ""
                            }`}
                            onClick={() =>
                                setAnswers(prev => ({
                                    ...prev,
                                    [currentStep]: 4 - idx
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
                        className={`${styles.nextButton} survey-next-btn`}
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