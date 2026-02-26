import React, { useState } from 'react';
import styles from '../../../css/student_css/SMedCat.module.css';
import VideoCard from '../../../component/VideoCard';

function SMedCat() {
    // 현재 선택된 중분류의 ID 또는 이름을 저장하는 상태
    const [selectedSub, setSelectedSub] = useState(null);

    // 선택된 영상 리스트 (UI 유지용 더미 데이터)
    const [selectedVideos, setSelectedVideos] = useState([
        { id: 1, mainCategory: '위치·지도', subCategory: '중분류 2' }
    ]);

    // 중분류 클릭 핸들러 (상태값만 업데이트)
    const handleCardClick = (id) => {
        setSelectedSub(id);
        // 여기에 나중에 직접 데이터를 추가하는 로직을 넣으시면 됩니다.
    };

    // 삭제 핸들러 (UI 동작 확인용)
    const handleDelete = (id) => {
        setSelectedVideos(selectedVideos.filter(video => video.id !== id));
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>분야 선택</h1>
            <p className={styles.subtitle}>서로 다른 카테고리에서 3개의 영상을 선택하세요</p>

            <div className={styles.progressBadge}>
                <span>🛒 선택한 영상: {selectedVideos.length} / 3</span>
            </div>

            {/* <div className={styles.alertBox}>
                <span>ℹ️</span>
                <div>
                    이 카테고리에서 이미 영상을 선택했습니다.<br />
                    새로운 영상을 선택하면 기존 선택이 변경됩니다.
                </div>
            </div> */}

            <div className={styles.headerRow}>
                <button className={styles.backButton}>← 뒤로</button>
                <h2 className={styles.categoryTitle}>위치·지도</h2>
            </div>

            <div className={styles.cardGrid}>
                {/* 선택 여부에 따라 active 클래스를 조건부로 부여합니다 */}
                <div
                    className={`${styles.card} ${selectedSub === 1 ? styles.activeCard : ''}`}
                    onClick={() => handleCardClick(1)}
                >
                    중분류 1
                </div>
                <div
                    className={`${styles.card} ${selectedSub === 2 ? styles.activeCard : ''}`}
                    onClick={() => handleCardClick(2)}
                >
                    중분류 2
                </div>
                <div
                    className={`${styles.card} ${selectedSub === 3 ? styles.activeCard : ''}`}
                    onClick={() => handleCardClick(3)}
                >
                    중분류 3
                </div>
            </div>

            <div className={styles.selectedListContainer}>
                <h3 className={styles.listTitle}>선택된 영상</h3>
                <div className={styles.listWrapper}>
                    {selectedVideos.map((video) => (
                        <VideoCard key={video.id} video={video} handleDelete={handleDelete}/>
                    ))}
                </div>
            </div>

            <button className={styles.nextButton}>
                다음으로 ({selectedVideos.length}/3)
            </button>
        </div>
    );
};

export default SMedCat;