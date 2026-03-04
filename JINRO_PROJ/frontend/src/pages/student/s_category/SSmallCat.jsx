import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../../css/student_css/SSmallCat.module.css";
import VideoCard from "../../../component/VideoCard";
import { useSelector, useDispatch } from 'react-redux';
import { addVideo, deleteVideo } from '../../../redux/cVideos'

function SSmallCat() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const select = useSelector((state) => state.cVideos)

    const { midId, bigName, midName } = location.state || {};

    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const selectedVideos = useSelector((state) => state.cVideos); // 🔥 더미 제거

    // 🔥 DB에서 데이터만 불러오기
    useEffect(() => {
        if (!midId) {
            console.error("midId 없음", location.state);
            return;
        }

        fetch(`http://127.0.0.1:8000/counselor/category/kind/${midId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("서버 응답 오류");
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setVideos(data.data || []);
                } else {
                    setVideos([]);
                }
            })
            .catch(err => {
                console.error("영상 불러오기 실패:", err);
                setVideos([]);
            });

    }, [midId]);

    const handleCardClick = (video) => {
            setSelectedVideo(null);
            // 2. 이미 선택된 영상인지 확인
            if (selectedVideos.find(v => v.id === video.c_id) || select.find(v => v.id === video.c_id)) {
                return; // 이미 있으면 중단
            }

            // 3. 최대 3개까지만 추가 가능하도록 로직 변경
            if (selectedVideos.length < 3) {
                const newVideo = {
                    id: video.c_id,
                    mainCategory: bigName,
                    subCategory: video.title
                };

                // 1. 단순 UI 선택 상태 업데이트
                setSelectedVideo(video.c_id);
                // ✅ [수정] 상태 업데이트는 순수하게 데이터만 추가합니다.
                setSelectedVideos(prev => [...prev, newVideo]);
            }
        };

    const handleDelete = (id) => {
        dispatch(deleteVideo(id));
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleNext = () => {
        dispatch(addVideo(selectedVideos.filter(data => data.id === selectedVideo)))
        navigate('/student/category/checkout');
    };

    const handelNextVideoSelect = () => {
        dispatch(addVideo(selectedVideos.filter(data => data.id === selectedVideo)))
        navigate('/student/category/big')
    }

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

            {/* 🔥 DB 데이터만 렌더링 */}
            <div className={styles.cardGrid}>
                {videos.map(video => (
                    <div
                        key={video.c_id}
                        className={`${styles.card} ${selectedVideo === video.c_id ? styles.activeCard : ""
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
                    {select.map((video, idx) => (
                        <VideoCard
                            key={idx}
                            video={video}
                            handleDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>

            {selectedVideos.length == 3 ? (
                <div>
                    <button className={`${styles.nextButton} ${selectedVideo != null ? styles.activeNewxButton : ''}`} onClick={handleNext} disabled={selectedVideos.length === 0}>
                        영상보기
                    </button>
                </div>
            ) : (
                <div>
                    <button className={`${styles.nextButton} ${selectedVideo != null ? styles.activeNewxButton : ''}`} onClick={handelNextVideoSelect} disabled={selectedVideo == null}>
                        다음영상고르기 ({select.length}/3)
                    </button>
                </div>
            )}
        </div>
    );
}

export default SSmallCat;