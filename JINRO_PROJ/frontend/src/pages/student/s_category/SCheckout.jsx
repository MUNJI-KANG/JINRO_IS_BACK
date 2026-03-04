import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../css/student_css/Checkout.css";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedVideos = useSelector((state) => state.cVideos);

  useEffect(() => {
    if (selectedVideos.length === 0) {
      alert("선택된 영상이 없습니다. 영상 선택 화면으로 이동합니다.");
      navigate("/student/category/big");
    }
  }, [selectedVideos, navigate]);

  const handleStartVideo = () => {
    if (selectedVideos.length === 0) return;

    const firstVideoId = selectedVideos[0].id;
    navigate(`/student/video/${firstVideoId}`, { 
      state: { 
        selectedVideos: selectedVideos,
        currentIndex: 0 
      } 
    });
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h2>선택 내역</h2>
          <div className="total-count">
            총 선택 <span>{selectedVideos.length}개</span>
          </div>
        </div>

        <div className="video-list">
          {selectedVideos.map((video, index) => (
            <div key={video.id} className="video-card">
              <div className="video-order">
                {index + 1}
              </div>
              <div className="video-thumb">
                <div className="temp-thumb">
                    <span style={{ color: '#E50914', fontSize: '24px', fontWeight: 'bold' }}>N</span>
                </div>
              </div>
              <div className="video-info">
                <span className="category-tag">ID: {video.id}</span>
                <h4>{video.subCategory}</h4>
                <p>준비된 영상을 시청하신 후 설문이 진행됩니다.</p>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-bottom">
          <button
            className="cart-btn secondary"
            onClick={() => navigate("/student/category/big", { state: { selectedVideos } })}
          >
            ← 다시 선택
          </button>
          <button
            className="cart-btn primary"
            onClick={handleStartVideo}
          >
            영상 시청 시작
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;