import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "../../css/student_css/SVideo.css";

function SVideo() {
  const navigate = useNavigate();
  const { categoryId } = useParams(); 
  const location = useLocation();

  // 📦 데이터 유실 방지: 앞 페이지에서 넘겨준 데이터가 없으면 빈 배열/0으로 초기화
  const selectedVideos = location.state?.selectedVideos || [];
  const currentIndex = location.state?.currentIndex || 0;

  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 유튜브 비디오 ID만 추출하여 embed 주소를 생성하는 가장 확실한 방법
  const getYoutubeSrc = (url) => {
    if (!url) return "";
    // URL에서 v= 뒤의 11자리 ID를 추출합니다.
    const videoId = url.split("v=")[1]?.split("&")[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&showinfo=0&controls=1`;
    }
    return url;
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        // DB에서 id=1인 영상 정보를 가져옵니다.
        const res = await axios.get(`http://127.0.0.1:8000/client/survey/${categoryId}`);
        if (res.data.success) {
          setCurrentVideo(res.data.data);
        }
      } catch (e) {
        console.error("데이터 로드 실패:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [categoryId]);

  // 설문 페이지로 데이터(리스트, 인덱스)를 그대로 들고 이동합니다.
  const handleGoSurvey = () => {
    navigate(`/student/survey/${categoryId}`, {
      state: { selectedVideos, currentIndex }
    });
  };

  if (loading || !currentVideo) return <div className="svideo-page">로딩 중...</div>;

  return (
    <div className="svideo-page">
      <div className="analysis-status">
        <span className="live-dot"></span>
        실시간 분석 중...
      </div>

      <div className="video-wrapper">
        <div className="video-order-badge">
          {currentIndex + 1}
        </div>

        {/* ⭐ 유튜브 iframe 박스 (원본 디자인 유지) */}
        <div className="video-container" style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }}>
          <iframe
            width="100%"
            height="100%"
            src={getYoutubeSrc(currentVideo.url)}
            title="YouTube Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <h3 className="video-title">{currentVideo.title}</h3>
      </div>

      <div className="svideo-bottom dual-buttons">
        <button
          className="survey-btn active"
          onClick={handleGoSurvey}
        >
          설문하러 가기
        </button>
      </div>
    </div>
  );
}

export default SVideo;