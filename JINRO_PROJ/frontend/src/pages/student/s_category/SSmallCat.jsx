import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../../css/student_css/SSmallCat.module.css";
import { useSelector, useDispatch } from "react-redux";
import { addVideo, deleteVideo } from "../../../redux/cVideos";
import axios from 'axios';
import api from '../../../services/app'

function SSmallCat() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const host = import.meta.env.VITE_HOST;

    const select = useSelector((state) => state.cVideos);

    const { midId, bigName, midName } = location.state || {};

    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

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
    useEffect(() => {

        if (!midId) {
            navigate("/student/category/big");
            return;
        }

        api.get(`/counselor/category/kind/${midId}`)
            .then((res) => {
                return res.data;
            })
            .then((data) => {

                if (data.success) {
                    setVideos(data.data || []);
                } else {
                    setVideos([]);
                }

            })
            .catch(() => setVideos([]));

    }, [midId, navigate]);


    const handleCardClick = (video) => {

        if (!video) return;

        if (select.find((v) => v.id === video.c_id)) {
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
            subCategory: video.title,
        };

        dispatch(addVideo([newVideo]));
        setSelectedVideo(video.c_id);
    };


    const handleDelete = (id) => {
        dispatch(deleteVideo(id));
    };

    const handleBack = () => navigate(-1);

    const handleNext = async () => {
        const payload = [];

        for (let d of select) {
            payload.push({id: String(d.id)});
        }
        const result = {
            videos: payload
        }
        try {
            const response = await api.post(`/client/counselling`, result);

            if (response.data.success) {
                navigate("/student/category/checkout");
            } else {
                alert('전송 실패')
            }
        } catch (error) {
            alert('전송 실패')
        }
    };

    const handleNextVideoSelect = () => {
        navigate("/student/category/big");
    };


    return (
        <div className={styles.container}>

            <h1 className={styles.title}>분야 선택</h1>

            <p className={styles.subtitle}>
                서로 다른 카테고리에서 3개의 영상을 선택하세요
            </p>

            <div className={styles.progressBadge}>
                🛒 선택한 영상: {select.length} / 3
            </div>


            <div className={styles.headerRow}>

                <button
                    className={styles.backButton}
                    onClick={handleBack}
                >
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
                        className={`${styles.card} ${selectedVideo === video.c_id ? styles.activeCard : ""}`}
                        onClick={() => handleCardClick(video)}
                    >

                    <div className={styles.imageContainer}>

                        <img
                            src={`https://img.youtube.com/vi/${extractVideoId(video.url)}/hqdefault.jpg`}
                            alt={video.title}
                            className={styles.thumbnail}
                        />

                    </div>
                        <div className={styles.content}>

                            <strong className={styles.title}>
                                {video.title}
                            </strong>

                            <p className={styles.duration}>
                                영상보기
                            </p>

                        </div>

                    </div>

                ))}

            </div>


            {/* Big과 동일한 선택 영상 UI */}
            {select.length > 0 && (

                <div className="selected-video-container">

                    <h3>선택된 영상</h3>

                    {select.map((video) => (

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
                    onClick={handleNextVideoSelect}
                >
                    카테고리로 이동 ({select.length}/3)
                </button>

            )}

        </div>
    );

}

export default SSmallCat;