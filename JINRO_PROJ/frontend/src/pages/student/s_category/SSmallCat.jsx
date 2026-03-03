import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../../css/student_css/SSmallCat.module.css";
import VideoCard from "../../../component/VideoCard";

function SSmallCat() {
    const navigate = useNavigate();
    const location = useLocation();

    const { midId, bigName, midName } = location.state || {};

    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedVideos, setSelectedVideos] = useState([]); // 🔥 더미 제거

    // 🔥 DB에서 데이터만 불러오기
    useEffect(() => {
        if (!midId) return;

        fetch(`http://127.0.0.1:8000/counselor/category/${midId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("서버 응답 오류");
                }
                return res.json();
            })
            .then(data => {
                setVideos(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("영상 불러오기 실패:", err);
                setVideos([]);
            });

    }, [midId]);

    const handleCardClick = (video) => {
        setSelectedVideo(video.c_id);

        // 🔥 선택 목록 추가 (최대 3개)
        if (selectedVideos.length < 3) {
            setSelectedVideos(prev => {
                if (prev.find(v => v.id === video.c_id)) return prev;
                return [
                    ...prev,
                    {
                        id: video.c_id,
                        mainCategory: bigName,
                        subCategory: video.title
                    }
                ];
            });
        }
    };

    const handleDelete = (id) => {
        setSelectedVideos(selectedVideos.filter(video => video.id !== id));
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleNext = () => {
        navigate('/student/category/checkout'); 
    };

    const handelNextVideoSelect = () => {
        navigate('/student/category/big')
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>분야 선택</h1>
            <p className={styles.subtitle}>
                서로 다른 카테고리에서 3개의 영상을 선택하세요
            </p>

            <div className={styles.progressBadge}>
                <span>🛒 선택한 영상: {selectedVideos.length} / 3</span>
            </div>

            <div className={styles.headerRow}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← 뒤로
                </button>
                <h2 className={styles.categoryTitle}>
                    {bigName} &gt; {midName}
                </h2>
            </div>

            {/* 🔥 DB 데이터만 렌더링 */}
            <div className={styles.cardGrid}>
                {videos.map(video => (
                    <div
                        key={video.c_id}
                        className={`${styles.card} ${
                            selectedVideo === video.c_id ? styles.activeCard : ""
                        }`}
                        onClick={() => handleCardClick(video)}
                    >
                        <div className={styles.imageContainer}>
                            <div style={{ color: "#E50914", fontSize: "48px", fontWeight: "bold" }}>
                                N
                            </div>
                        </div>

                        <div className={styles.content}>
                            <strong className={styles.title}>{video.title}</strong>
                            <p className={styles.duration}>영상보기</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🔥 선택된 영상 리스트 (DB 기반) */}
            <div className={styles.selectedListContainer}>
                <h3 className={styles.listTitle}>선택된 영상</h3>
                <div className={styles.listWrapper}>
                    {selectedVideos.map(video => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            handleDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>

            {selectedVideos.length >= 2 ?(
                <div>
                    <button className={`${styles.nextButton} ${selectedVideo != null ? styles.activeNewxButton : ''}`} onClick={handleNext} disabled={selectedVideo == null}>
                        영상보기
                    </button>
                </div>
            ) : (
                <div>
                    <button className={`${styles.nextButton} ${selectedVideo != null ? styles.activeNewxButton : ''}`} onClick={handelNextVideoSelect} disabled={selectedVideo == null}>
                        다음영상고르기 ({selectedVideos.length}/3)
                    </button>
                </div>
            )}
        </div>
    );
}

export default SSmallCat;