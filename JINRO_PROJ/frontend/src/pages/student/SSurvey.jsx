import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../../css/student_css/SSurvey.module.css';

function SSurvey() {
    const { categoryId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { selectedVideos = [], currentIndex = 0 } = location.state || {};
    const [surveyInfo, setSurveyInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); 
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/client/survey/${categoryId}`);
                if (response.data.success) setSurveyInfo(response.data.data);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        };
        fetchSurvey();
    }, [categoryId]);

    const handleNext = async () => {
        const questions = typeof surveyInfo.survey === 'string' ? JSON.parse(surveyInfo.survey) : surveyInfo.survey;
        
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            try {
                const payload = {
                    counseling_id: 1, 
                    category: surveyInfo.title,
                    url: surveyInfo.url,
                    answer: answers 
                };

                const res = await axios.post('http://127.0.0.1:8000/client/survey/submit', payload);

                if (res.data.success) {
                    const nextIdx = currentIndex + 1;
                    if (nextIdx < selectedVideos.length) {
                        const nextId = selectedVideos[nextIdx].id;
                        navigate(`/student/video/${nextId}`, { state: { selectedVideos, currentIndex: nextIdx } });
                    } else {
                        navigate('/student/complete');
                    }
                }
            } catch (err) { console.error(err); }
        }
    };

    if (loading || !surveyInfo) return <div className={styles.surveyContainer}>로딩 중...</div>;
    const questions = typeof surveyInfo.survey === 'string' ? JSON.parse(surveyInfo.survey) : surveyInfo.survey;

    return (
        <div className={styles.surveyContainer}>
            <div className={styles.surveyCard}>
                <button className={styles.backButton} onClick={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : navigate(-1)}>
                    ← 이전으로
                </button>
                <div className={styles.headerRow}>
                    <h1 className={styles.mainTitle}>{surveyInfo.title} 진단</h1>
                    <span className={styles.stepIndicator}>{currentStep + 1} / {questions.length}</span>
                </div>
                <div className={styles.progressWrapper}>
                    <div className={styles.progressBar} style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }} />
                </div>
                <h2 className={styles.questionText}>{questions[currentStep].questionText}</h2>
                <div className={styles.optionsList}>
                    {questions[currentStep].options.map((option, idx) => (
                        <div key={idx} className={`${styles.optionItem} ${answers[currentStep] === idx ? styles.selected : ''}`} onClick={() => setAnswers({...answers, [currentStep]: idx})}>
                            <span className={styles.optionLabel}>{option}</span>
                            <div className={styles.radioCircle} />
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button className={styles.nextButton} onClick={handleNext} disabled={answers[currentStep] === undefined}
                        style={{ padding: '12px 60px', backgroundColor: answers[currentStep] !== undefined ? '#E50914' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
                        {currentStep === questions.length - 1 ? "제출 및 다음" : "다음 문항"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SSurvey;