import { useState, useEffect } from 'react';
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

import { Link, useParams, useNavigate  } from 'react-router-dom';
import api from '../services/app';
import styles from '../css/component_css/ReportAi.module.css';

const ReportAi = ({ pageTitle, studentName, apiUrl }) => {

  const { clientId, counselingId } = useParams();
  const navigate = useNavigate();

  const [videoList, setVideoList] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

  const [currentData, setCurrentData] = useState({
    focus: [],
    interest: [],
    summary: "",
    prompt: ""
  });

  const [prompt, setPrompt] = useState("");
  const [selectedDate, setSelectedDate] = useState('');
  const [dates, setDates] = useState([]);

  /* ---------------- AI 리포트 날짜 조회 ---------------- */

useEffect(() => {

  if (!counselingId) return;

  const fetchDates = async () => {

    try {

        const res = await api.get(`${apiUrl}/dates/${counselingId}`);

        if (!res.data.success) return;

        const first = res.data.data[0];

        if (!first) return;

        setDates([first]);
        setSelectedDate(first.ai_v_erp_id);
        loadReport(first.ai_v_erp_id);

        } catch (err) {

        console.error(err);

        }

    };

    fetchDates();

    }, [counselingId]);


  /* ---------------- AI 리포트 조회 ---------------- */

  const loadReport = (videoId) => {

    api.get(`${apiUrl}/video/${videoId}`)
      .then(res => res.data)
      .then(res => {

        if (!res.success) return;

        setCurrentData({
          focus: res.data.focus,
          interest: res.data.interest,
          summary: res.data.summary,
          prompt: res.data.prompt
        });

        setPrompt(res.data.prompt || "");

      })
      .catch(console.error);

  };


  const handleDateChange = (e) => {

    const videoId = e.target.value;

    setSelectedDate(videoId);

    if (videoId) {
      loadReport(videoId);
    }

  };


  /* ---------------- 영상 목록 조회 ---------------- */

  const handleVideoOpen = async () => {

        try {

            const res = await api.get(`/counselor/videos/${counselingId}`);

            setVideoList(res.data);
            setShowVideoModal(true);

        } catch (err) {

            console.error(err);
            alert("영상 목록 불러오기 실패");

        }

    };


  /* ---------------- 영상 선택 ---------------- */

  const handleSelectVideo = (url) => {

    setSelectedVideoUrl(`http://localhost:8000${url}`);

  };


  return (

    <div className={styles['analysis-page-container']}>

      <div className={styles['analysis-header']}>

        <button
          className={styles['btn-back']}
          onClick={() => navigate(-1)}
        >
          뒤로가기
        </button>

        <h2 className={styles['student-info-title']}>
          {studentName}의 {pageTitle}
        </h2>

        <select
          className={styles['date-select']}
          value={selectedDate}
          onChange={handleDateChange}
        >

          <option value="">날짜 선택</option>

          {dates.length > 0 && (
            <option value={dates[0].ai_v_erp_id}>
                {dates[0].date}
            </option>
            )}

        </select>

      </div>


      <div className={styles['video-wrap']}>

        <section className={styles['report-card']}>

          <div className={styles['inner-graph-grid']}>

            <div className={styles['chart-item']}>

              <h4 className={styles['chart-title']}>❶ 집중도 타임라인</h4>

              <ResponsiveContainer width="100%" height={220}>

                <LineChart data={currentData.focus}>

                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="time"/>
                  <YAxis/>
                  <Tooltip/>

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

                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="subject"/>
                  <Tooltip/>

                  <Bar
                    dataKey="관심도"
                    fill="var(--primary)"
                    radius={[4,4,0,0]}
                  />

                  <Bar
                    dataKey="자신감"
                    fill="var(--secondary)"
                    radius={[4,4,0,0]}
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

      </div>


      {/* ---------------- 영상 모달 ---------------- */}

      {showVideoModal && (

        <div className={styles["video-modal"]}>

          <div className={styles["video-modal-content"]}>

            <h3>영상 목록</h3>

            <ul className={styles["video-list"]}>

              {videoList.map(v => (

                <li key={v.id}>

                <button
                    className={styles["video-select-btn"]}
                    onClick={() => handleSelectVideo(v.url)}
                >
                    {v.name}
                </button>

                </li>

                ))}

            </ul>

            {selectedVideoUrl && (

              <video
                src={selectedVideoUrl}
                controls
                autoPlay
                className={styles["video-player"]}
              />

            )}

            <button
              className={styles["video-close-btn"]}
              onClick={()=>{
                setShowVideoModal(false);
                setSelectedVideoUrl("");
              }}
            >
              닫기
            </button>

          </div>

        </div>

      )}

    </div>

  );

};

export default ReportAi;