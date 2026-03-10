import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../../../services/app";

import styles from "../../../css/component_css/ReportAi.module.css";

const CReportAiSimple = ({ pageTitle, apiUrl }) => {

  const location = useLocation();
  const { clientId, counselingId } = useParams();
  const studentName = location.state?.studentName;
  // const counselingId = location.state?.counselingId;

  const [summary, setSummary] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dates, setDates] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");

  /* ==============================
     날짜 목록 가져오기
  ============================== */

  useEffect(() => {

    if (!counselingId) return;

    api
      .get(`/counselor/recording/dates/${clientId}`)
      .then((res) => res.data)
      .then((res) => {

        if (res.success) {

          setDates(res.data);

          if (res.data.length > 0) {
            // loadReport(res.data[0].ai_v_erp_id);
            // setSelectedDate(res.data[0].ai_v_erp_id);
          }

        }

      })
      .catch((err) => console.error(err));

  }, [counselingId]);


  /* ==============================
     리포트 조회
  ============================== */

  const loadReport = (videoId) => {

    api
      .get(`/counselor/ai-report/${counselingId}/${videoId}`)
      .then((res) => res.data)
      .then((res) => {

        if (res.success) {

          setSummary(res.data.summary || "");
          setPrompt(res.data.prompt || "");

        }

      })
      .catch((err) => console.error(err));

  };


  /* ==============================
     날짜 변경
  ============================== */

  const handleDateChange = (e) => {

    const videoId = e.target.value;

    setSelectedDate(videoId);

    if (videoId) {
      loadReport(videoId);
    }

  };


  /* ==============================
     영상 보기
  ============================== */

  const handleVideoOpen = () => {

    if (!videoUrl) {
      alert("영상이 없습니다.");
      return;
    }

    window.open(videoUrl);

  };

  const handleAnalyze = async (e) => {
        e.preventDefault();

        const response = await api.post("/counselor/recording/analyze", {
          client_id: clientId,
          counseling_id: counselingId,
          prompt: prompt,
        })
    }


  return (
    <div className={styles["analysis-page-container"]}>

      {/* ================= HEADER ================= */}

      <div className={styles["analysis-header"]}>

        <h2 className={styles["student-info-title"]}>
          {studentName}의 상담대화 요약
        </h2>

        <select
          className={styles["date-select"]}
          value={selectedDate}
          onChange={handleDateChange}
        >
          {dates.map((d) => (
            <option key={d.counseling_id} value={d.counseling_id}>
              {d.regdate}
            </option>
          ))}

        </select>

      </div>


      <div className={styles["video-wrap"]}>

        {/* ================= 요약 ================= */}

        <section className={styles["report-card"]}>

          <div className={styles["analysis-summary-box"]}>

            {summary ? (
              <p className={styles["analysis-text"]}>
                {summary}
              </p>
            ) : (
              <p className={styles["analysis-text"]}>
                분석 결과가 없습니다.
              </p>
            )}

            <div className={styles["video-btn-wrap"]}>

              <button
                className={styles["btn-video-small"]}
                onClick={handleVideoOpen}
              >
                음성파일 보기
              </button>

            </div>

          </div>

        </section>


        {/* ================= 메모 ================= */}

        <section className={styles["report-card"]}>

          <label className={styles["report-label"]}>
            메모를 입력하세요
          </label>

          <textarea
            className={styles["prompt-textarea"]}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="AI에게 요청할 추가 분석 내용을 입력하세요..."
          />

        </section>

      </div>


      {/* ================= 버튼 ================= */}

      <div className={styles["report-buttons"]}>

        <div className={styles["left-btn-area"]}>

          <Link
            to={`/counselor/report/final/${clientId}/${counselingId}`}
            state={{ counselingId, studentName }}
            className={styles["btn-link"]}
          >
            <button className={styles["btn-action-sub"]}>
              뒤로가기
            </button>
          </Link>

        </div>


        <div className={styles["right-btn-area"]}>

          <button className={styles["btn-action-sub"]}>
            재분석 요청
          </button>

          <button className={styles["btn-action-main"]}>
            최종 리포트에 적용
          </button>

        </div>

      </div>

    </div>
  );
};

export default CReportAiSimple;