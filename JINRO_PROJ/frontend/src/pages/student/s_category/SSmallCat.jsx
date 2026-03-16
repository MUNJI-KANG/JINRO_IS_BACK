import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addVideo, deleteVideo } from "../../../redux/cVideos";
import StudentCategory from "../../common/StudentCategory";
import styles from "../../../css/student_css/SSmallCat.module.css";
import api from "../../../services/app";

import CatSmallOnboarding from "../s_onboarding/CatSmallOnboarding.jsx";

function SSmallCat() {

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const select = useSelector((state) => state.cVideos);

  const { midId, bigName, midName } = location.state || {};

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [onboard, setOnboard] = useState(false);

  const isComplete = select.length === 3;

  const extractVideoId = (url) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtu.be"))
        return parsed.pathname.slice(1);

      if (parsed.searchParams.get("v"))
        return parsed.searchParams.get("v");

      return null;
    } catch {
      return null;
    }
  };

  /* ⭐ 영상 조회 */
  useEffect(() => {

    if (!midId) {
      navigate("/student/category/big");
      return;
    }

    api.get(`/counselor/category/kind/${midId}`)
      .then(res => {
        if (res.data.success) setVideos(res.data.data || []);
        else setVideos([]);
      })
      .catch(() => setVideos([]));

  }, [midId, navigate]);

  useEffect(()=>{


    const skip = localStorage.getItem("skip_all_onboarding");
    const done = localStorage.getItem("small_cat_onboarding_done");

    if(skip === "true") return;
    if(done === "true") return;

    setTimeout(()=>{
        setOnboard(true);
    },600);

  },[]);

  const handleCardClick = (video) => {

    if (select.find(v => v.id === video.c_id)) {
      alert("이미 선택된 영상입니다.");
      return;
    }

    if (select.length >= 3) {
      alert("최대 3개까지만 선택 가능합니다.");
      return;
    }

    const newVideo = {
      id: video.c_id,
      mainCategory: bigName,
      subCategory: video.title
    };

    dispatch(addVideo([newVideo]));
    setSelectedVideo(video.c_id);
  };

  const handleDelete = (id) => dispatch(deleteVideo(id));

  return (
    <StudentCategory>
      <div className="student-page">

        {onboard && (
          <CatSmallOnboarding onClose={() => setOnboard(false)} />
        )}

        <h1 className="student-title">분야 선택</h1>

        <p className="student-subtitle">
          서로 다른 카테고리에서 3개의 영상을 선택하세요
        </p>

        <div className={`student-progress onboard-target-cart`}>
          🛒 선택한 영상: {select.length} / 3
        </div>

        <div className="student-header">
          <button
            className="student-back-btn"
            onClick={() => navigate(-1)}
          >
            ← 뒤로
          </button>

          <h2 className="student-category-title">
            {bigName} &gt; {midName}
          </h2>
        </div>

        <div className={`${styles.cardGrid} onboard-target-card-grid small-card-grid`}>

          {videos.map(video => {

            const alreadySelected = select.some(v => v.id === video.c_id);

            return (

              <div
                key={video.c_id}
                className={`${styles.card} 
                  ${selectedVideo === video.c_id ? styles.activeCard : ""}
                  ${alreadySelected ? styles.alreadySelected : ""}
                `}
                onClick={() => {
                  if (alreadySelected) return;
                  handleCardClick(video);
                }}
              >

                <div className={styles.imageContainer}>
                  <img
                    src={`https://img.youtube.com/vi/${extractVideoId(video.url)}/hqdefault.jpg`}
                    className={styles.thumbnail}
                  />
                </div>

                <div className={styles.content}>
                  <strong className={styles.title}>{video.title}</strong>
                  <p className={styles.duration}>
                    {alreadySelected ? "이미 선택됨" : "영상보기"}
                  </p>
                </div>

              </div>

            );

          })}

        </div>

        {select.length > 0 && (

          <div className="selected-video-container  onboard-target-cart">

            <h3>선택된 영상</h3>

            {select.map(video => (

              <div key={video.id} className="selected-video-item">

                <span>{video.subCategory}</span>

                <button
                  className="delete-button"
                  onClick={() => handleDelete(video.id)}
                >
                  ✕
                </button>

              </div>

            ))}

          </div>

        )}

        <button
          className={`next-button ${isComplete ? "next-button-active" : ""}`}
          onClick={() =>
            isComplete
              ? navigate("/student/category/checkout")
              : navigate("/student/category/big")
          }
        >
          {isComplete
            ? "영상보기"
            : `카테고리로 이동 (${select.length}/3)`}
        </button>

      </div>
    
    </StudentCategory>
  );
}

export default SSmallCat;