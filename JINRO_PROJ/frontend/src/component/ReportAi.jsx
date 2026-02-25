import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import styles from '../css/component_css/ReportAi.module.css';

const ReportAi = ({ pageTitle, studentName }) => {
    const allData = {
        '2026-02-18 (최신)': {
            focus: [{ time: '00', value: 60 }, { time: '03', value: 75 }, { time: '06', value: 65 }, { time: '09', value: 85 }, { time: '12', value: 70 }, { time: '15', value: 90 }],
            interest: [{ subject: '국어', 관심도: 80, 자신감: 70 }, { subject: '수학', 관심도: 60, 자신감: 50 }, { subject: '사회', 관심도: 90, 자신감: 85 }, { subject: '과학', 관심도: 40, 자신감: 30 }, { subject: '영어', 관심도: 75, 자신감: 80 }],
            summary: "2월 18일 분석 결과: 시선 추적 결과 학습자의 집중도가 특정 구간에서 급격히 상승했습니다.",
            prompt: ""
        },
        '2026-02-17 (과거2)': {
            focus: [{ time: '00', value: 40 }, { time: '03', value: 50 }, { time: '06', value: 80 }, { time: '09', value: 60 }, { time: '12', value: 55 }, { time: '15', value: 70 }],
            interest: [{ subject: '국어', 관심도: 50, 자신감: 40 }, { subject: '수학', 관심도: 80, 자신감: 90 }, { subject: '사회', 관심도: 60, 자신감: 50 }, { subject: '과학', 관심도: 70, 자신감: 60 }, { subject: '영어', 관심도: 40, 자신감: 30 }],
            summary: "2월 17일 분석 결과: 수학 과목에 대한 자신감이 매우 높게 측정되었으나 영어는 다소 낮습니다.",
            prompt: "영어 보충 학습 권장"
        },
        '2026-02-16 (과거1)': {
            focus: [{ time: '00', value: 90 }, { time: '03', value: 85 }, { time: '06', value: 70 }, { time: '09', value: 50 }, { time: '12', value: 40 }, { time: '15', value: 30 }],
            interest: [{ subject: '국어', 관심도: 90, 자신감: 80 }, { subject: '수학', 관심도: 40, 자신감: 30 }, { subject: '사회', 관심도: 70, 자신감: 80 }, { subject: '과학', 관심도: 50, 자신감: 40 }, { subject: '영어', 관심도: 80, 자신감: 70 }],
            summary: "2월 16일 분석 결과: 초반 집중도는 매우 좋았으나 시간이 갈수록 피로도가 누적되어 하락했습니다.",
            prompt: "충분한 휴식 시간 배치 필요"
        }
    };

    const [selectedDate, setSelectedDate] = useState('2026-02-18 (최신)');
    const [prompt, setPrompt] = useState(allData[selectedDate].prompt);
    const currentData = allData[selectedDate];

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        setPrompt(allData[newDate].prompt);
    };

    return (
        <div className={styles['analysis-page-container']}>
            <div className={styles['analysis-header']}>
                <h2 className={styles['student-info-title']}>{studentName}의 {pageTitle}</h2>
                <select className={styles['date-select']} value={selectedDate} onChange={handleDateChange}>
                    {Object.keys(allData).map(date => (
                        <option key={date} value={date}>{date}</option>
                    ))}
                </select>
            </div>

            <div className={styles['video-wrap']}>
                {/* 📍 1번 영역: 그래프와 텍스트 요약이 통합된 카드 */}
                <section className={styles['report-card']}>
                    <div className={styles['inner-graph-grid']}>
                        <div className={styles['chart-item']}>
                            <h4 className={styles['chart-title']}>❶ 집중도 타임라인</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={currentData.focus}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className={styles['chart-item']}>
                            <h4 className={styles['chart-title']}>❷ 분야별 관심도</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={currentData.interest}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="subject" />
                                    <Tooltip />
                                    <Bar dataKey="관심도" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="자신감" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles['analysis-summary-box']}>
                        <p className={styles['analysis-text']}>{currentData.summary}</p>
                        <div className={styles['video-btn-wrap']}>
                            <button className={styles['btn-video-small']}>영상보기</button>
                        </div>
                    </div>
                </section>

                {/* 2번 영역: 메모 입력창 */}
                <section className={styles['report-card']}>
                    <label className={styles['report-label']}>메모를 입력하세요</label>
                    <textarea
                        className={styles['prompt-textarea']}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="AI에게 요청할 추가 분석 내용을 입력하세요..."
                    />
                </section>
            </div>

            <div className={styles['report-buttons']}>
                <button className={styles['btn-sub']}>재분석 요청</button>
                <button className={styles['btn-main']}>최종 리포트에 적용</button>
            </div>
        </div>
    );
};

export default ReportAi;