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

// PDF 라이브러리 추가
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CFinal = () => {
    const { clientId, counselingId } = useParams();
    const location = useLocation();
    const studentName = location.state?.studentName || "학생";

    // PDF 관련 상태 및 Ref
    const printRef = useRef(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // 상담 데이터 관련 상태
    const [focusData, setFocusData] = useState([]);
    const [interestData, setInterestData] = useState([]);
    const [report, setReport] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [llmResult, setLlmResult] = useState(null);
    const [aiStatus, setAiStatus] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 녹음 관련 상태
    const [recordState, setRecordState] = useState("idle");
    const [recordTime, setRecordTime] = useState(0);
    const timerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // ---------------------------------------------------------
    // PDF 생성 및 미리보기 로직
    // ---------------------------------------------------------
    const generatePDF = async (action = 'download') => {
        const element = printRef.current;
        if (!element) return;

        try {
            // PDF 생성 중에는 잠시 로딩 표시를 하거나 버튼을 숨길 수 있습니다.
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                // data-html2canvas-ignore 속성이 있는 요소는 제외함
                ignoreElements: (el) => el.getAttribute('data-html2canvas-ignore') === 'true'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            if (action === 'download') {
                pdf.save(`${studentName}_진로상담_리포트.pdf`);
            } else if (action === 'preview') {
                const blob = pdf.output('blob');
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
                setShowPreview(true);
            }
        } catch (error) {
            console.error("PDF 생성 실패:", error);
            alert("PDF 생성 중 오류가 발생했습니다.");
        }
    };

    // modalStyle 변수 없음 => 런타임 에러 발생 될 수 있어서 임시로 추가 0313 - 12:17 AHW
    const modalStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    };

    // ---------------------------------------------------------
    // 데이터 로딩 및 녹음 로직 (기존 유지)
    // ---------------------------------------------------------
    useEffect(() => {
        if (!counselingId || counselingId === 'undefined') return;
        api.get(`/counselor/report/final/${counselingId}`)
            .then(res => res.data)
            .then(data => {
                if (data.success) {
                    setFocusData(data.focus);
                    setInterestData(data.interest);
                }
            }).catch(err => console.error("리포트 조회 실패", err));
    }, [counselingId]);

    // 페이지 진입 시 status 확인
    useEffect(() => {
        if (!counselingId || counselingId === 'undefined') return;

        api.get(`/counselor/ai-report/${counselingId}`)
            .then(res => res.data)
            .then(data => {

                if (data.success && data.data && data.data.ai_m_comment) {

                    const parsed = data.data.ai_m_comment;

                    setLlmResult(parsed);

                }

            })
            .catch(err => {
                console.error("LLM 결과 조회 실패", err);
            });

    }, [counselingId]);

    useEffect(() => {
        if (!counselingId || counselingId === 'undefined') return;
        api.get(`/counselor/report/final/comment/${counselingId}`)
            .then(res => res.data)
            .then(data => {
                if (!data.success) return;
                setReport(data.comment || "");
                setIsComplete(data.complete === "Y");
            }).catch(err => console.error("최종 리포트 조회 실패", err));
    }, [counselingId]);

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

    const handleComplete = async (e) => {
        e.preventDefault();
        if (!counselingId) return alert("ID가 없습니다.");
        await api.post("/counselor/report/final/complete", {
            counseling_id: counselingId,
            comment: report
        });
        alert("작성 완료되었습니다.");
        setIsComplete(true);
    };

    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60).toString().padStart(2,"0");
        const seconds = (sec % 60).toString().padStart(2,"0");
        return `${minutes}:${seconds}`;
    };

    const startRecording = async () => {
        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.start();
            setRecordState("recording");
            setRecordTime(0);
            timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
        } catch (err) {
            alert("오디오 권한이 필요합니다.");
        }
    };

    const stopRecording = async () => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.onstop = async () => {
                    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    const formData = new FormData();
                    formData.append("file", blob, "record.webm");

                    // stopRecording 상태 초기화
                    setIsAnalyzing(true);
                    setAiStatus(null);
                    await api.post(`/counselor/report/con/${counselingId}/audio`, formData, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
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

    const pauseRecording = () => {
        if (mediaRecorderRef.current && recordState === "recording") {
            mediaRecorderRef.current.pause();
            setRecordState("paused");
            clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && recordState === "paused") {
            mediaRecorderRef.current.resume();
            setRecordState("recording");
            timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
        }
    };

    const pollAIStatus = () => {

        let retry = 0;
        const maxRetry = 30;

        const checkStatus = async () => {

            try {

                const res = await api.get(`/counselor/report/status/${counselingId}`);

                if (!res.data.success) return;

                const status = res.data.status;
                setAiStatus(status);

                if (status === "COMPLETED") {

                    const result = await api.get(`/counselor/ai-report/${counselingId}`);

                    if (result.data.success && result.data.data.ai_m_comment) {

                        const parsed = result.data.data.ai_m_comment;

                        setLlmResult(parsed);

                    }

                    setIsAnalyzing(false);
                    return;

                }

            } catch (e) {

                console.error("status polling error", e);

            }

            retry++;

            if (retry < maxRetry && isAnalyzing) {

                setTimeout(checkStatus, 3000);

            } else {

                setIsAnalyzing(false);

            }

        };

        checkStatus();

    };

    return (
        <>
            {/* PDF 미리보기 모달 */}
            {showPreview && (
                <div className="pdf-preview-modal" style={modalStyle}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', width: '85%', height: '90%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0 }}>리포트 미리보기</h3>
                            <div>
                                <button className="btn-main" style={{ marginRight: '10px' }} onClick={() => generatePDF('download')}>다운로드</button>
                                <button className="btn-sub" onClick={() => setShowPreview(false)}>닫기</button>
                            </div>
                        </div>
                        <iframe src={pdfUrl} width="100%" height="100%" style={{ border: '1px solid #ddd' }} title="PDF Preview" />
                    </div>
                </div>
            )}

            {/* PDF 추출 컨트롤 버튼 (PDF 스캔 영역 밖) */}
            <div className="pdf-action-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px' }}>
                <button className="btn-sub" onClick={() => generatePDF('preview')}>PDF 미리보기</button>
                <button className="btn-main" onClick={() => generatePDF('download')}>PDF 다운로드</button>
            </div>

            {/* 메인 리포트 영역 시작 */}
            <div ref={printRef} className="pdf-export-container" style={{ padding: '20px', backgroundColor: '#fff' }}>
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
                                        <Bar dataKey="value" fill="#4A90E2" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="chart-empty">⚠ 분석 데이터가 없습니다.</div>
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
                            {llmResult?.summary}
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
                        {
                            (llmResult?.analysis?.career_recommendation || [])
                                .map((item, index) => (
                                    <div key={index}>{item.trim()}</div>
                            ))
                        }
                        </div>

                    ) : (

                        <div className="chart-empty">
                            상담이 완료된 후 자동으로 생성됩니다.
                        </div>

                    )}

                    </section>
                </div>

                <section className="report-card full-width">
                    <h3>AI 상담 대화 요약</h3>

                    {llmResult ? (

                        <div className="summary-box">
                            {llmResult?.summary}
                        </div>

                    ) : (

                        <div className="chart-empty">
                            상담이 완료된 후 자동으로 생성됩니다.
                        </div>

                    )}

                </section>

                <section className="report-card full-width">
                    <div className="report-content-box">
                        <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>상담 기록 및 종합 리포트</p>
                            
                            {/* 녹음 컨트롤 - PDF에서는 보이지 않도록 처리 */}
                            <div className="record-control" data-html2canvas-ignore="true">
                                {recordState === "idle" && <button className="btn-record" onClick={startRecording}>🎤 녹음 시작</button>}
                                {recordState === "recording" && (
                                    <div className="record-box">
                                        <span className="rec-text">녹음중 <span className="rec-dot">●</span> {formatTime(recordTime)}</span>
                                        <button className="btn-record small" onClick={pauseRecording}>중지</button>
                                    </div>
                                )}
                                {recordState === "paused" && (
                                    <div className="record-box">
                                        <span>일시정지 {formatTime(recordTime)}</span>
                                        <button className="btn-record small" onClick={resumeRecording}>재시작</button>
                                        <button className="btn-record small" onClick={stopRecording}>종료</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PDF 생성 시 Textarea의 스크롤 문제를 방지하기 위해, 
                            작성 완료 상태이거나 PDF 출력시에는 일반 div로 보여줍니다. */}
                        <div className="final-report-content">
                            {isComplete ? (
                                <div className="report-text-display" style={{ minHeight: '150px', whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '15px' }}>
                                    {report || "입력된 상담 내용이 없습니다."}
                                </div>
                            ) : (
                                <textarea
                                    id="finalComment"
                                    style={{ width: '100%', minHeight: '150px' }}
                                    placeholder="학생과의 상담 내용을 입력해주세요."
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                </section>
            </div>
            {/* 메인 리포트 영역 끝 */}

            {/* 하단 저장 버튼 영역 - PDF 제외 */}
            {!isComplete && (
                <div className="report-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }} data-html2canvas-ignore="true">
                    <button type="button" className="btn-sub" onClick={handleSave}>수정 저장</button>
                    <button type="button" className="btn-main" onClick={handleComplete}>작성 완료</button>
                </div>
            )}
        </>
    );
};

export default CFinal;