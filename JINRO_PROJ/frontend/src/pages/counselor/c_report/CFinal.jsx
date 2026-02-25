import { useState, useRef } from 'react';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';

import '../../../css/common_css/base.css'
import '../../../css/counselor_css/cFinal.css'
import { Link } from 'react-router-dom';


const CFinal = () => {
    const modalRef = useRef();

    const focusData = [
        { time: '00', value: 60 }, { time: '03', value: 75 }, { time: '06', value: 65 },
        { time: '09', value: 85 }, { time: '12', value: 70 }, { time: '15', value: 90 },
    ];

    const interestData = [
        { subject: '국어', 관심도: 80, 자신감: 70, 수행도: 85 },
        { subject: '수학', 관심도: 60, 자신감: 50, 수행도: 65 },
        { subject: '사회', 관심도: 90, 자신감: 85, 수행도: 95 },
        { subject: '과학', 관심도: 40, 자신감: 30, 수행도: 45 },
        { subject: '영어', 관심도: 75, 자신감: 80, 수행도: 70 },
    ];

    const [report, setReport] = useState('');


    const [alerts, setAlerts] = useState([
        { id: 1, time: "[05:30] 가정사", level: "높음", msg: '"가정사" 관련 상담 진행 중 시선이 여러 번 흔들리는 것이 감지되었습니다.', videoId: "v001" },
        { id: 2, time: "[09:45] 성적", level: "보통", msg: '"성적" 키워드 언급 시 불안 신호가 감지되었습니다.', videoId: "v002" }
    ]);

    // 현재 선택된 알림 데이터 상태
    const [activeAlert, setActiveAlert] = useState(null);

    // 알림 클릭시 모달 열기
    const handleAlertClick = (alert) => {
        setActiveAlert(alert);
        modalRef.current.showModal();
    };

    // 재분석 요청 버튼 클릭 시
    const handleReAnalyze = () => {
        // (나중에 여기에 API 호출 기술 구현 예정)
        alert(`${activeAlert.time} 영상 재분석을 시작합니다.`);

        // 3. UI 처리: 해당 알림 삭제 + 모달 닫기
        setAlerts(prev => prev.filter(item => item.id !== activeAlert.id));
        modalRef.current.close();
        setActiveAlert(null);
    };
    return (
        <>
            <h2 className="student-info-title">김민준 진로상담 2026-02-16</h2>
            {/* 상단 3개 섹션 */}
            <div className="report-top-grid">
                {/* 1. 집중도 타임라인 */}
                <section className="report-card">
                    <h3>❶ 집중도 타임라인</h3>
                    <p className="sub-text">학습 시간 동안의 집중도</p>
                    <div className="chart-box">
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={focusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* 2. 분야별 관심 비교 그래프 */}
                <section className="report-card">
                    <h3>❷ 분야별 관심 비교 그래프</h3>
                    <p className="sub-text">관심도, 자신감, 실제 수행도 비교</p>
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
                </section>

                {/* 3. 불일치 알림 */}
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

            {/* 중앙 리포트 내용 */}
            <section className="report-card full-width">
                <div className="report-content-box">
                    <p>최종 리포트 내용</p>
                    <form className="final-report-comment" id='final-report'>
                        <textarea id='finalComment'
                            name='comment'
                            placeholder="상담 내용을 입력해주세요..."
                            value={report}
                            onChange={(e) => setReport(e.target.value)}></textarea>
                        <div className="report-buttons">
                            <button className="btn-sub">수정 완료</button>
                            <button className="btn-main">작성 완료</button>
                        </div>
                    </form>
                </div>
            </section>

            {/* 하단 분석 버튼들 */}
            <div className="analysis-button-group">
                <button className="btn-analysis">상담일지 작성</button>
                <button className="btn-analysis">영상시청 분석</button>
                <Link to="/counselor/report/video" className="btn-link">
                    <button className="btn-analysis">상담영상 분석</button>
                </Link>
                <button className="btn-analysis">ai 분석 재요청</button>
            </div>

            <dialog ref={modalRef} className="modal-dialog">
                {activeAlert && (
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>분석 실패 영상 확인</h3>
                            <button className="close-x" onClick={() => modalRef.current.close()}>&times;</button>
                        </div>

                        <div className="modal-body">
                            <div className="video-placeholder">
                                {/* 실제 기술구현 시 여기에 비디오 썸네일 등이 들어감 */}
                                <span>📹 Video ID: {activeAlert.videoId}</span>
                            </div>
                            <p className="modal-desc">
                                <strong>{activeAlert.time}</strong> 시점의 분석이 중단되었습니다.<br />
                                해당 영상을 다시 분석하시겠습니까?
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-sub" onClick={() => modalRef.current.close()}>닫기</button>
                            <button className="btn-main" onClick={handleReAnalyze}>재분석 요청</button>
                        </div>
                    </div>
                )}
            </dialog>
        </>
    );
};

export default CFinal;