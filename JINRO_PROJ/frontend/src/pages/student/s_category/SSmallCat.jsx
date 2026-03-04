import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../../css/student_css/SSmallCat.module.css";
import VideoCard from "../../../component/VideoCard";
import { useSelector, useDispatch } from "react-redux";
import { addVideo, deleteVideo } from "../../../redux/cVideos";

function SSmallCat() {

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const select = useSelector((state) => state.cVideos);

    const { midId, bigName, midName } = location.state ?? {};

    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {

        if (!midId) {
            console.error("midId 없음 → big 카테고리로 이동");
            navigate("/student/category/big");
            return;
        }

        fetch(`http://127.0.0.1:8000/counselor/category/kind/${midId}`)
            .then((res) => {
                if (!res.ok) throw new Error("서버 응답 오류");
                return res.json();
            })
            .then((data) => {
                if (data.success) {
                    setVideos(data.data || []);
                } else {
                    setVideos([]);
                }
            })
            .catch((err) => {
                console.error("영상 불러오기 실패:", err);
                setVideos([]);
            });

    }, [midId, navigate]);


    const handleCardClick = (video) => {

        if (!video) return;

        if (select.find((v) => v.id === video.c_id)) return;

        if (select.length >= 3) return;

        const newVideo = {
            id: video.c_id,
            mainCategory: bigName,
            subCategory: video.title,
        };

        // 🔥 Redux slice 구조에 맞게 배열로 전달
        dispatch(addVideo([newVideo]));

        setSelectedVideo(video.c_id);
    };


    const handleDelete = (id) => {
        dispatch(deleteVideo(id));
    };


    const handleBack = () => {
        navigate(-1);
    };


    const handleNext = () => {
        navigate("/student/category/checkout");
    };


    const handelNextVideoSelect = () => {
        navigate("/student/category/big");
    };


    return (
        <div className={styles.container}>

            <h1 className={styles.title}>분야 선택</h1>

            <p className={styles.subtitle}>
                서로 다른 카테고리에서 3개의 영상을 선택하세요
            </p>

            <div className={styles.progressBadge}>
                <span>🛒 선택한 영상: {select.length} / 3</span>
            </div>

            <div className={styles.headerRow}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← 뒤로
                </button>

                <h2 className={styles.categoryTitle}>
                    {bigName} &gt; {midName}
                </h2>
            </div>


            <div className={styles.cardGrid}>
                {videos.map((video) => (

                    <div
                        key={video.c_id}
                        className={`${styles.card} ${
                            selectedVideo === video.c_id ? styles.activeCard : ""
                        }`}
                        onClick={() => handleCardClick(video)}
                    >

                        <div className={styles.imageContainer}>
                            <div style={{
                                color: "#E50914",
                                fontSize: "48px",
                                fontWeight: "bold"
                            }}>
                                N
                            </div>
                        </div>

                        <div className={styles.content}>
                            <strong className={styles.title}>
                                {video.title}
                            </strong>
                            <p className={styles.duration}>영상보기</p>
                        </div>

                    </div>

                ))}
            </div>


            <div className={styles.selectedListContainer}>

                <h3 className={styles.listTitle}>선택된 영상</h3>

                <div className={styles.listWrapper}>

                    {select.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            handleDelete={handleDelete}
                        />
                    ))}

                </div>

            </div>


            {select.length === 3 ? (

                <button
                    className={`${styles.nextButton} ${styles.activeNextButton}`}
                    onClick={handleNext}
                >
                    영상보기
                </button>

            ) : (

                <button
                    className={styles.nextButton}
                    onClick={handelNextVideoSelect}
                >
                    다음영상고르기 ({select.length}/3)
                </button>

            )}

        </div>
    );
}

export default SSmallCat;