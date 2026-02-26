import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/student_css/SVideo.css";

function SVideo() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

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
  const [videoEnded, setVideoEnded] = useState(false);

  const currentVideo = selectedVideos[currentIndex];
  const isLastVideo = currentIndex === selectedVideos.length - 1;

  /* 영상 바뀌면 초기화 */
  useEffect(() => {
    setVideoEnded(false);

    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [currentIndex]);

  /* 영상 끝났을 때 */
  const handleEnded = () => {
    setVideoEnded(true);
  };

  /* 다음 영상 버튼 */
  const handleNextVideo = () => {
    if (!isLastVideo) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  /* 설문 버튼 */
  const handleSurvey = () => {
    if (!videoEnded) return;

    navigate("/student/survey", {
      state: { videoIndex: currentIndex },
    });
  };

  return (
    <div className="svideo-page">

      <div className="analysis-status">
        <span className="live-dot"></span>
        실시간 녹화 중...
      </div>

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

      {/* 하단 버튼 영역 */}
      <div className="svideo-bottom dual-buttons">

        {/* 설문 버튼 */}
        <button
          className={`survey-btn ${videoEnded ? "active" : ""}`}
          disabled={!videoEnded}
          onClick={handleSurvey}
        >
          설문하러 가기
        </button>

        {/* 다음 영상 버튼 */}
        {!isLastVideo && (
          <button
            className="next-btn active"
            onClick={handleNextVideo}
          >
            다음 영상
          </button>
        )}

      </div>
    </div>
  );
}

export default SVideo;