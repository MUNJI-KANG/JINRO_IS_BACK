import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Link, useLocation } from 'react-router-dom';

import styles from '../css/component_css/ReportAi.module.css';

const ReportAi = ({ pageTitle, studentName, apiUrl }) => {

    const location = useLocation();
    const counselingId = location.state?.counselingId;

    const [currentData, setCurrentData] = useState({
        focus: [],
        interest: [],
        summary: "",
        prompt: ""
    });

    const [prompt, setPrompt] = useState("");
    const [selectedDate, setSelectedDate] = useState('');
    const [dates, setDates] = useState([]);
    const [videoUrl, setVideoUrl] = useState("");



    // 날짜 목록 가져오기
    useEffect(() => {

        if (!counselingId) return;

        fetch(`${apiUrl}/dates/${counselingId}`)
            .then(res => res.json())
            .then(res => {

                if (res.success) {

                    setDates(res.data);

                    // 첫번째 데이터 자동 로딩
                    if (res.data.length > 0) {
                        loadReport(res.data[0].ai_v_erp_id);
                        setSelectedDate(res.data[0].ai_v_erp_id);
                    }

                }

            })
            .catch(err => console.error(err));

    }, [counselingId]);



    // 리포트 조회 함수
    const loadReport = (videoId) => {

        fetch(`${apiUrl}/video/${videoId}`)
            .then(res => res.json())
            .then(res => {

                if (res.success) {

                    setCurrentData({
                        focus: res.data.focus,
                        interest: res.data.interest,
                        summary: res.data.summary,
                        prompt: res.data.prompt
                    });

                    setPrompt(res.data.prompt || "");
                    setVideoUrl(res.data.url || "");

                }

            })
            .catch(err => console.error(err));

    };



    // 날짜 변경
    const handleDateChange = (e) => {

        const videoId = e.target.value;

        setSelectedDate(videoId);

        if (videoId) {
            loadReport(videoId);
        }

    };



    // 영상보기
    const handleVideoOpen = () => {

        if (!videoUrl) {
            alert("영상이 없습니다.");
            return;
        }

        window.open(videoUrl);

    };



    return (
        <div className={styles['analysis-page-container']}>

            <div className={styles['analysis-header']}>

                <h2 className={styles['student-info-title']}>
                    {studentName}의 {pageTitle}
                </h2>

                <select
                    className={styles['date-select']}
                    value={selectedDate}
                    onChange={handleDateChange}
                >

                    <option value="">날짜 선택</option>

                    {dates.map(d => (

                        <option key={d.ai_v_erp_id} value={d.ai_v_erp_id}>
                            {d.date}
                        </option>

                    ))}

                </select>

            </div>



            <div className={styles['video-wrap']}>

                {/* 그래프 카드 */}
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

                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        dot={{ r: 5 }}
                                    />

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

                                    <Bar
                                        dataKey="관심도"
                                        fill="var(--primary)"
                                        radius={[4, 4, 0, 0]}
                                    />

                                    <Bar
                                        dataKey="자신감"
                                        fill="var(--secondary)"
                                        radius={[4, 4, 0, 0]}
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        </div>

                    </div>



                    <div className={styles['analysis-summary-box']}>

                        <p className={styles['analysis-text']}>
                            {currentData.summary}
                        </p>

                        <div className={styles['video-btn-wrap']}>

                            <button
                                className={styles['btn-video-small']}
                                onClick={handleVideoOpen}
                            >
                                영상보기
                            </button>

                        </div>

                    </div>

                </section>



                {/* 메모 입력 */}
                <section className={styles['report-card']}>

                    <label className={styles['report-label']}>
                        메모를 입력하세요
                    </label>

                    <textarea
                        className={styles['prompt-textarea']}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="AI에게 요청할 추가 분석 내용을 입력하세요..."
                    />

                </section>

            </div>



            <div className={styles['report-buttons']}>

                <div className={styles['left-btn-area']}>

                    <Link
                        to="/counselor/report/final"
                        state={{ counselingId }}
                        className={styles['btn-link']}
                    >

                        <button className={styles['btn-action-sub']}>
                            뒤로가기
                        </button>

                    </Link>

                </div>



                <div className={styles['right-btn-area']}>

                    <button className={styles['btn-action-sub']}>
                        재분석 요청
                    </button>

                    <button className={styles['btn-action-main']}>
                        최종 리포트에 적용
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ReportAi;