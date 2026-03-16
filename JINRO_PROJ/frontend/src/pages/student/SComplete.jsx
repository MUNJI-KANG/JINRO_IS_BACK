// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import styles from '../../css/student_css/SComplete.module.css';

// function SComplete() {

//     const navigate = useNavigate();

//     useEffect(() => {

//         // localStorage 정리
//         localStorage.removeItem("counselingId");
//         localStorage.removeItem("reportIds");
//         localStorage.removeItem("videoStarted");

//         // ⭐ 카메라 강제 종료
//         const stopCamera = async () => {

//             try {

//                 const stream = await navigator.mediaDevices.getUserMedia({
//                     video: true,
//                     audio: false
//                 });

//                 stream.getTracks().forEach(track => track.stop());

//             } catch (err) {

//                 console.log("카메라 종료:", err);

//             }

//         };

//         stopCamera();

//     }, []);

//     const handleGoHome = () => {

//         navigate('/');

//     };

//     return (

//         <main className={styles.container}>

//             <div className={styles.iconWrapper}>
//                 <div className={styles.checkIcon}></div>
//             </div>

//             <h1 className={styles.title}>
//                 모든 상담이 완료되었습니다!
//             </h1>

//             <p className={styles.description}>
//                 오늘 참여해주신 소중한 상담 데이터 분석이 끝났습니다.
//                 <span className={styles.highlight}>
//                     이제 당신의 마음 리포트를 확인해 보세요.
//                 </span>
//             </p>

//             <button
//                 className={styles.homeButton}
//                 onClick={handleGoHome}
//             >
//                 홈으로 돌아가기
//             </button>

//         </main>

//     );

// }

// export default SComplete;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/app.js';
import styles from '../../css/student_css/SComplete.module.css';

function SComplete() {
    const navigate = useNavigate();
    const [counselingVal, setCounselingVal] = useState(null)

    useEffect(() => {
        const triggerAIAnalysis = async () => {
            try {
                // ⭐ 1. localStorage에서 먼저 값을 꺼냅니다 (지우기 전에!)
                const counselingId = localStorage.getItem("counselingId");

                setCounselingVal(counselingId)

                if (!counselingId) {
                    console.error("상담 ID(counselingId)를 찾을 수 없습니다.");
                    return;
                }

                // ⭐ 2. post 요청의 body에 실어서 보냅니다.
                const response = await api.post('/client/complete-client', {
                    counseling_id: counselingId
                });

                console.log("빽단에 분석 요청 완료:", response.data);
                // 3. 사용이 끝났으니 localStorage 정리
                localStorage.removeItem("counselingId");
                localStorage.removeItem("reportIds");
                localStorage.removeItem("videoStarted");
            } catch (error) {
                console.error("분석 요청 실패:", error);
            }
        };

        triggerAIAnalysis();


        // 4. 카메라 강제 종료
        const stopCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.log("카메라 종료:", err);
            }
        };
        stopCamera();
    }, []);

    const handleGoHome = () => {
        client_id = localStorage.getItem("client_id")
        api.post('/client/complete/video', {
            counseling_id: counselingVal,
            client_id: client_id
        });
        navigate('/');
    }

    return (
        <main className={styles.container}>
            <div className={styles.iconWrapper}><div className={styles.checkIcon}></div></div>
            <h1 className={styles.title}>모든 상담이 완료되었습니다!</h1>
            <p className={styles.description}>
                오늘 참여해주신 소중한 상담 데이터 분석이 끝났습니다.<br />
                <span className={styles.highlight}>이제 당신의 마음 리포트를 확인해 보세요.</span>
            </p>
            <button className={styles.homeButton} onClick={handleGoHome}>
                홈으로 돌아가기
            </button>
        </main>
    );
}

export default SComplete;