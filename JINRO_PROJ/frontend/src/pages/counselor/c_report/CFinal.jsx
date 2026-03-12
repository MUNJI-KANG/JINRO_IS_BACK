import { useState, useEffect, useRef } from 'react';
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';

import '../../../css/common_css/base.css'
import '../../../css/counselor_css/cFinal.css'
import { useLocation, useParams } from 'react-router-dom';
import api from '../../../services/app'

const CFinal = () => {
    const { clientId, counselingId } = useParams();
    const location = useLocation();

    const studentName = location.state?.studentName || "학생";

    console.log("넘어온 상담 ID:", counselingId);



    const [focusData, setFocusData] = useState([]);
    const [interestData, setInterestData] = useState([]);
    const [report, setReport] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [llmResult, setLlmResult] = useState(null);
    const [aiStatus, setAiStatus] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 녹음 기능 관련
    const [recordState, setRecordState] = useState("idle");
    const [recordTime, setRecordTime] = useState(0);

    const timerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        if (!counselingId || counselingId === 'undefined') return;

        api.get(`/counselor/report/final/${counselingId}`)
            .then(res => res.data)
            .then(data => {
                if (data.success) {
                    setFocusData(data.focus);
                    setInterestData(data.interest);
                }
            })
            .catch(err => {
                console.error("리포트 조회 실패", err);
            });
    }, [counselingId]);

    useEffect(() => {

        if (!counselingId || counselingId === 'undefined') return;

        api.get(`/counselor/ai-report/${counselingId}`)
            .then(res => res.data)
            .then(data => {

                if (data.success && data.data && data.data.ai_m_comment) {

                    const parsed = JSON.parse(data.data.ai_m_comment);

                    setLlmResult(parsed);

                }

            })
            .catch(err => {
                console.error("LLM 결과 조회 실패", err);
            });

    }, [counselingId]);

    // 녹음 정리 useEffect
    useEffect(() => {

    return () => {

        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {

            mediaRecorderRef.current.stream
                .getTracks()
                .forEach(track => track.stop());

        }

        clearInterval(timerRef.current);

    };

}, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!counselingId) return alert("ID가 없습니다.");

        await api.post("/counselor/report/final/save", {
            counseling_id: counselingId,
            comment: report
        });

        alert("수정 저장되었습니다.");
    };

    // 시간 포맷
    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60).toString().padStart(2,"0");
        const seconds = (sec % 60).toString().padStart(2,"0");
        return `${minutes}:${seconds}`;
    };

    // 녹음 시작
    const startRecording = async () => {

        try {

            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {

                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }

            };

            mediaRecorderRef.current.start();

            setRecordState("recording");

            setRecordTime(0);

            timerRef.current = setInterval(() => {
                setRecordTime(prev => prev + 1);
            },1000);

        } catch (err) {

            alert("오디오 권한이 필요합니다.");
            console.error(err);

        }

    };

    // 녹음 종료
    const stopRecording = async () => {

        return new Promise((resolve) => {

            if (mediaRecorderRef.current) {

                mediaRecorderRef.current.onstop = async () => {

                    const blob = new Blob(audioChunksRef.current, {
                        type: "audio/webm"
                    });

                    const formData = new FormData();
                    formData.append("file", blob, "record.webm");

                    // stopRecording 상태 초기화
                    setIsAnalyzing(true);
                    setAiStatus(null);

                    await api.post(
                        `/counselor/report/con/${counselingId}/audio`,
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data"
                            }
                        }
                    );

                    // AI 처리 상태 polling 시작
                    pollAIStatus();

                    resolve();
                };

                mediaRecorderRef.current.stop();

                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            }

            setRecordState("idle");

            clearInterval(timerRef.current);

            setRecordTime(0);

        });

    };

    // 일시정지
    const pauseRecording = () => {

        if (mediaRecorderRef.current && recordState === "recording") {

            mediaRecorderRef.current.pause();

            setRecordState("paused");

            clearInterval(timerRef.current);

        }

    };

    // 재개
    const resumeRecording = () => {

        if (mediaRecorderRef.current && recordState === "paused") {

            mediaRecorderRef.current.resume();

            setRecordState("recording");

            timerRef.current = setInterval(() => {
                setRecordTime(prev => prev + 1);
            },1000);

        }

    };

    // Frontend STT -> LLM 분석 상태 polling
    const pollAIStatus = () => {

    let retry = 0;

    const checkStatus = async () => {

        try {

            const res = await api.get(`/counselor/report/status/${counselingId}`);

            if (!res.data.success) return;

            // pollAIStatus 상태 업데이트 추가
            const status = res.data.status;
            setAiStatus(status);

            if (status === "COMPLETED") {

                const result = await api.get(`/counselor/ai-report/${counselingId}`);

                if (result.data.success && result.data.data.ai_m_comment) {

                    const parsed = JSON.parse(result.data.data.ai_m_comment);

                    setLlmResult(parsed);

                }

                setIsAnalyzing(false);

                return;

            }

        } catch (e) {
            console.error("status polling error", e);
        }

        // 무제한 polling (3초 간격)
        if (!isAnalyzing) return; // 페이지 이동 or 컴포넌트 unmount 시 polling 자동 중지

        setTimeout(checkStatus, 3000);

    };

    checkStatus();

};

    const handleComplete = async (e) => {

        e.preventDefault();

        if (!counselingId) {
            alert("ID가 없습니다.");
            return;
        }

        await api.post("/counselor/report/final/complete", {
            counseling_id: counselingId,
            comment: report
        });

        alert("작성 완료되었습니다.");
        setIsComplete(true);

    };

    return (
        <>
            <h2 className="student-info-title">{studentName}의 진로 상담 최종 리포트</h2>

            <div className="report-top-grid">
                <section className="report-card">
                    <h3>❶ 분야별 관심 비교 그래프</h3>
                    {focusData.length > 0 ? (
                        <div className="chart-box">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={focusData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="subject" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="value"
                                        fill="var(--primary)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-empty">
                            ⚠ 영상 분석 실패로 그래프를 표시할 수 없습니다.
                        </div>
                    )}
                </section>

                <section className="report-card">
                    <h3>❷ 학생 성향 분석</h3>
                    
                    {/* UI 표시 (분석 중 메시지) */}
                   {isAnalyzing && !llmResult && (

                        <div className="chart-empty ai-loading">

                            <div className="ai-spinner"></div>

                            {aiStatus === "STT_PROCESSING" && "음성을 텍스트로 변환 중입니다..."}

                            {aiStatus === "LLM_PROCESSING" && "AI가 상담 내용을 분석 중입니다..."}

                            {!aiStatus && "AI 상담 분석을 준비 중입니다..."}

                        </div>

                    )}

                    {llmResult ? (

                        <div className="summary-box">
                            {llmResult.summary}
                        </div>

                    ) : isAnalyzing ? (

                        <div className="chart-empty ai-loading">

                            <div className="ai-spinner"></div>

                            {aiStatus === "STT_PROCESSING" && "음성을 분석 중입니다..."}

                            {aiStatus === "LLM_PROCESSING" && "AI가 상담 내용을 요약 중입니다..."}

                            {!aiStatus && "AI 분석 준비 중입니다..."}

                        </div>

                    ) : (

                        <div className="chart-empty">
                            상담이 완료된 후 자동으로 생성됩니다.
                        </div>

                    )}

                </section>

                <section className="report-card">

                    <h3>❸ 추천 진로 TOP5</h3>

                    {llmResult ? (

                        <div className="analysis-text">
                            {llmResult.career_recommendation}
                        </div>

                    ) : (

                        <div className="chart-empty">
                            상담이 완료된 후 자동으로 생성됩니다.
                        </div>

                    )}

                    </section>
            </div>

            <section className="report-card full-width">

                <div className="summary-header">

                    <h3>상담 대화 요약 (STT → LLM)</h3>

                    <div className="record-control">

                        {recordState === "idle" && (

                            <button
                                className="btn-record"
                                onClick={startRecording}
                            >
                                🎤 녹음 시작
                            </button>

                        )}

                        {recordState === "recording" && (

                            <div className="record-box">

                                <span className="rec-text">
                                    녹음중 <span className="rec-dot">●</span>
                                </span>

                                <span className="record-timer">
                                    {formatTime(recordTime)}
                                </span>

                                <button
                                    className="btn-record small"
                                    onClick={pauseRecording}
                                >
                                    중지
                                </button>

                            </div>

                        )}

                        {recordState === "paused" && (

                            <div className="record-box">

                                <span>일시정지</span>

                                <span className="record-timer">
                                    {formatTime(recordTime)}
                                </span>

                                <button
                                    className="btn-record small"
                                    onClick={resumeRecording}
                                >
                                    재시작
                                </button>

                                <button
                                    className="btn-record small"
                                    onClick={stopRecording}
                                >
                                    종료
                                </button>

                            </div>

                        )}

                    </div>

                </div>

                {llmResult ? (

                    <div className="summary-box">
                        {llmResult.summary}
                    </div>

                ) : (

                    <div className="chart-empty">
                        상담이 완료된 후 자동으로 생성됩니다.
                    </div>

                )}

            </section>

            <section className="report-card full-width">
                <div className="report-content-box">
                    <p>최종 리포트 내용</p>
                    <form className="final-report-comment" onSubmit={(e) => e.preventDefault()}>
                        <textarea
                            id="finalComment"
                            placeholder="상담 내용을 입력해주세요..."
                            value={report}
                            onChange={(e) => setReport(e.target.value)}
                            readOnly={isComplete}
                        />
                        {!isComplete && (
                            <div className="report-buttons">
                                <button type="button" className="btn-sub" onClick={handleSave}>수정 완료</button>
                                <button type="button" className="btn-main" onClick={handleComplete}>작성 완료</button>
                            </div>
                        )}
                    </form>
                </div>
            </section>
        </>
    );

    };

export default CFinal;