import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../../css/counselor_css/CCatDetail.css";

export default function CCatDetail() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/counselor/category/detail/${videoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDetailData(data.data);
        }
      })
      .catch((err) => console.error("상세 조회 실패:", err));
  }, [videoId]);

  if (!detailData) return <div>로딩 중...</div>;

  return (
    <div className="detail-page">
      <div className="detail-box">

        <h2 className="detail-title">카테고리 내용</h2>

        <div className="detail-content">
          <p>
            <strong>카테고리:</strong> {detailData.title}
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

          {detailData.survey?.map((q, idx) => (
            <div key={idx} className="question">
              <strong>질문 {idx + 1}:</strong> {q.questionText}
            </div>
          ))}
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