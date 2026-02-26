import { useParams, useNavigate } from "react-router-dom";
import "../../../css/counselor_css/CCatDetail.css";

export default function CCatDetail() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  // 🔥 추후 API로 교체 가능
  const detailData = {
    id: videoId,
    category: "축구",
    url: "https://www.example.com",
    question: "진로상담 내용이 만족스러웠나요?",
  };

  return (
    <div className="detail-page">
      <div className="detail-box">

        <h2 className="detail-title">카테고리 내용</h2>

        <div className="detail-content">
          <p>
            <strong>카테고리:</strong> {detailData.category}
          </p>

          <p>
            <strong>URL:</strong>{" "}
            <a
              href={detailData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-link"
            >
              {detailData.url}
            </a>
          </p>

          <p className="question">
            <strong>질문:</strong> {detailData.question}
          </p>

          <div className="rating-group">
            {["매우만족", "만족", "보통", "불만족", "매우불만족"].map(
              (label) => (
                <button key={label} className="rating-btn">
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="detail-btn-wrapper">
            <button
            onClick={() =>
                navigate("/counselor/category/write", {
                state: detailData,
                })
            }
            >
            수정
            </button>
          <button
            className="list-btn"
            onClick={() => navigate(-1)}
          >
            목록
          </button>
        </div>

      </div>
    </div>
  );
}