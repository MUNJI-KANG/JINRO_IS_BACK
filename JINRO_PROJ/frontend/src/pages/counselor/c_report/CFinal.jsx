import { useState, useRef, useEffect } from 'react';
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
import { Link, useLocation } from 'react-router-dom';
import api from '../../../services/app'

const CFinal = () => {
    const modalRef = useRef();
    const location = useLocation();

    const counselingId = location.state?.counselingId
    const studentName = location.state?.studentName || "학생";
    
    console.log("넘어온 상담 ID:", counselingId);


    const [studentId, setStudentId] = useState('');
    const [focusData, setFocusData] = useState([]);
    const [interestData, setInterestData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [report, setReport] = useState('');
    const [activeAlert, setActiveAlert] = useState(null);
    const [isComplete, setIsComplete] = useState(false);

    // useEffect(() => {
    //     if (location.state?.counselingId) {
    //         sessionStorage.setItem('counselingId_backup', location.state.counselingId);
    //         setCounselingId(location.state.counselingId);
    //     }
    // }, [location.state]);

    // =========================
    // 그래프 데이터 조회
    // =========================
    useEffect(() => {
        // 💡 [방어 코드] ID가 없으면 API 호출 차단 (422 에러 방지)
        if (!counselingId || counselingId === 'undefined') return;

        api.get(`/counselor/report/final/${counselingId}`)
            .then(res => res.data)
            .then(data => {
                if (data.success) {
                    setFocusData(data.focus);
                    setInterestData(data.interest);
                    setAlerts(data.alerts);
                }
            })
            .catch(err => {
                console.error("리포트 조회 실패", err);
            });
    }, [counselingId]);

    // =========================
    // 🔥 최종 리포트 조회
    // =========================
    useEffect(() => {
        // 💡 [방어 코드] ID가 없으면 API 호출 차단
        if (!counselingId || counselingId === 'undefined') return;

        api.get(`/counselor/report/final/comment/${counselingId}`)
            .then(res => res.data)
            .then(data => {
                if (data.success) {
                    setReport(data.comment || '');
                    setIsComplete(data.complete === "Y");
                }
            })
            .catch(err => {
                console.error("코멘트 조회 실패", err);
            });
    }, [counselingId]);

    // =========================
    // 🔥 수정 저장
    // =========================
    const handleSave = async (e) => {
        e.preventDefault();
        if (!counselingId) return alert("ID가 없습니다.");

        await api.post("/counselor/report/final/save", {
            counseling_id: counselingId,
            comment: report
        });

        alert("수정 저장되었습니다.");
    };

    // =========================
    // 🔥 작성 완료
    // =========================
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

    const handleAlertClick = (alert) => {
        setActiveAlert(alert);
        modalRef.current.showModal();
    };

    const handleReAnalyze = () => {
        alert(`${activeAlert.time} 영상 재분석을 시작합니다.`);
        setAlerts(prev => prev.filter(item => item.id !== activeAlert.id));
        modalRef.current.close();
        setActiveAlert(null);
    };

    return (
        <>
            <h2 className="student-info-title">{studentName}의 진로 상담 최종 리포트</h2>

            <div className="report-top-grid">
                {/* 영상별 집중도 */}
                <section className="report-card">
                    <h3>❶ 영상별 집중도 비교</h3>
                    <p className="sub-text">영상 3개 평균 집중도</p>
                    {alerts.length === 0 ? (
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

                {/* 관심도 그래프 */}
                <section className="report-card">
                    <h3>❷ 분야별 관심 비교 그래프</h3>
                    <p className="sub-text">관심도, 자신감, 실제 수행도 비교</p>
                    {alerts.length === 0 ? (
                        <div className="chart-box">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={interestData}>
                                    <XAxis dataKey="subject" />
                                    <Tooltip />
                                    <Bar dataKey="관심도" fill="var(--primary)" />
                                    <Bar dataKey="자신감" fill="var(--secondary)" />
                                    <Bar dataKey="수행도" fill="var(--accent)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-empty">
                            ⚠ 영상 분석 실패로 그래프를 표시할 수 없습니다.
                        </div>
                    )}
                </section>

                {/* 분석 실패 알림 */}
                <section className="report-card">
                    <h3>❸ 분석 대기/실패 알림</h3>
                    <p className="sub-text">AI 분석 실패 항목을 클릭하여 재요청하세요.</p>
                    <div className="alert-list">
                        {alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="alert-item clickable"
                                    onClick={() => handleAlertClick(alert)}
                                >
                                    <div className="alert-header">
                                        <span className="time">{alert.time}</span>
                                        <span className="badge high">{alert.level}</span>
                                    </div>
                                    <p>{alert.msg}</p>
                                </div>
                            ))
                        ) : (
                            <p className="empty-msg">모든 분석이 완료되었습니다. ✅</p>
                        )}
                    </div>
                </section>
            </div>

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

            <div className="analysis-button-group">

                <Link
                    to="/counselor/report/counseling"
                    state={{ counselingId, studentName }}
                >
                    <button className="btn-analysis">
                        상담일지 작성
                    </button>
                </Link>

                <Link
                    to="/counselor/report/video"
                    state={{ counselingId, studentName }}
                    className="btn-link"
                >
                    <button className="btn-analysis">
                        영상시청 분석
                    </button>
                </Link>

                <Link
                    to="/counselor/report/voice"
                    state={{ counselingId, studentName }}
                    className="btn-link"
                >
                    <button className="btn-analysis">
                        상담 대화 요약
                    </button>
                </Link>
            </div>

            {/* 모달 등 생략된 UI 구성 요소 */}
            <dialog ref={modalRef} className="modal">
                {activeAlert && (
                    <div>
                        <p>{activeAlert.time} 영상을 재분석하시겠습니까?</p>
                        <button onClick={handleReAnalyze}>확인</button>
                        <button onClick={() => modalRef.current.close()}>취소</button>
                    </div>
                )}
            </dialog>
        </>
    );
};

export default CFinal;