import { useNavigate } from "react-router-dom";
import "../../../css/student_css/Checkout.css";

function Checkout() {
  const navigate = useNavigate();


  /* =========================================================
     실제 적용 시 (SSmallCat에서 선택된 영상 가져오기)
  ========================================================= */
  const mockVideos = [
    {
      id: 1,
      big: "사업관리",
      mid: "중분류 2",
      title: "중분류 2 영상",
      thumbnail:
        "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    },
    {
      id: 2,
      big: "영업·서비스",
      mid: "소분류 2",
      title: "소분류 2 영상",
      thumbnail:
        "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    },
    {
      id: 3,
      big: "금융·보험",
      mid: "중분류 3",
      title: "중분류 3 영상",
      thumbnail:
        "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    },
  ];

  return (
    <div className="cart-page">
      <div className="cart-container">

        {/* 상단 */}
        <div className="cart-header">
          <h2>선택 내역</h2>
          <div className="total-count">
            총 선택 <span>{mockVideos.length}개</span>
          </div>
        </div>

        {/* 영상 리스트 */}
        <div className="video-list">
          {mockVideos.map((video, index) => (
            <div key={video.id} className="video-card">

              <div className="video-order">
                {index + 1}
              </div>

              <div className="video-thumb">
                <img src={video.thumbnail} alt="thumbnail" />
              </div>

              <div className="video-info">
                <span className="category-tag">{video.big}</span>
                <h4>{video.title}</h4>
                <p>{video.mid} · 영상</p>
              </div>

            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="cart-bottom">
          <button
            className="cart-btn secondary"
            onClick={() => navigate("/student/category/big")}
          >
            ← 다시 선택
          </button>

          <button
            className="cart-btn primary"
            onClick={() => navigate("/student/video")}
          >
            영상 시청 시작
          </button>
        </div>

      </div>
    </div>
  );
}

export default Checkout;