import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/student_css/SVideo.css";

function SVideo() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);

  /* ======================================================
     🔥 실제 연동 시
     const selectedVideos = location.state?.selectedVideos || [];
  ====================================================== */

  /* 현재는 임시 데이터 */
  const selectedVideos = [
    {
      id: 1,
      title: "1번 영상",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    {
      id: 2,
      title: "2번 영상",
      url: "https://www.w3schools.com/html/movie.mp4",
    },
    {
      id: 3,
      title: "3번 영상",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentVideo = selectedVideos[currentIndex];

  /* 영상 끝나면 다음 영상 */
  const handleEnded = () => {
    if (currentIndex < selectedVideos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setFinished(true);
    }
  };

  /* 영상 바뀌면 자동 재생 */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [currentIndex]);

  return (
    <div className="svideo-page">

      <div className="analysis-status">
        <span className="live-dot"></span>
        실시간 녹화 중...
      </div>

      {/* =======================
         2️⃣ 영상 영역
      ======================= */}
      <div className="video-wrapper">
        <div className="video-order-badge">
          {currentIndex + 1}
        </div>

        <video
          ref={videoRef}
          width="100%"
          controls
          onEnded={handleEnded}
        >
          <source src={currentVideo.url} type="video/mp4" />
        </video>

        <h3 className="video-title">{currentVideo.title}</h3>
      </div>

      {/* =======================
         3️⃣ 하단 버튼
      ======================= */}
      <div className="svideo-bottom">
        <button
          className={`next-session ${finished ? "active" : ""}`}
          disabled={!finished}
          onClick={() => navigate("/student/result")}
        >
          다음 세션으로
        </button>
      </div>

    </div>
  );
}

export default SVideo;