import { useState, useRef, useEffect } from 'react';
import '../../../css/common_css/base.css';
import '../../../css/counselor_css/CCounseling.css';
import { useNavigate, useLocation } from "react-router-dom";
import api from '../../../services/app';



const CCounseling = () => {

    const navigate = useNavigate();
    const location  = useLocation();

    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [recordState, setRecordState] = useState("idle");
    const counselingId = location.state?.counselingId;
    
    

    const [recordTime, setRecordTime] = useState(0);

    const [clientName, setClientName] = useState('');

    const timerRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
   
    // =========================
    // 학생 이름 + 기존 일지 조회
    // =========================
    useEffect(() => {

        if (!counselingId) return;

        api.get(`/counselor/report/con/${counselingId}`)
            .then(res => res.data)
            .then(data => {

                if (data.success) {
                    setClientName(data.data.client_name || '');
                    if (data.data.title !== '상담 제목 미정') setTitle(data.data.title);
                    if (data.data.con_rep_comment !== '상담예정') setContents(data.data.con_rep_comment);
                }

            })
            .catch(err => console.error('상담 일지 조회 오류:', err));

    }, [counselingId]);


    /* ===============================
       시간 포맷 (mm:ss)
    =============================== */

    const formatTime = (sec) => {

        const minutes = Math.floor(sec / 60).toString().padStart(2,"0");
        const seconds = (sec % 60).toString().padStart(2,"0");

        return `${minutes}:${seconds}`;

    };

    /* ===============================
       녹음 시작
    =============================== */

    const startRecording = async () => {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {

                if (event.data.size > 0) {

                    audioChunksRef.current.push(event.data);

                }

            };

           // 녹음 완료 시 서버로 업로드
            mediaRecorderRef.current.onstop = () => {

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                const formData = new FormData();
                formData.append('file', audioBlob, `recording_${counselingId}_${Date.now()}.webm`);

                api.post(`/counselor/report/con/${counselingId}/audio`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                .then(res => {
                    if (res.data.success) console.log('녹음 파일 저장 완료:', res.data.path);
                    else console.warn('녹음 파일 저장 실패');
                })
                .catch(err => console.error('녹음 업로드 오류:', err));

                audioChunksRef.current = [];

            };

            mediaRecorderRef.current.start();

            setRecordState("recording");

            setRecordTime(0);

            timerRef.current = setInterval(() => {

                setRecordTime(prev => prev + 1);

            },1000);

        } catch (err) {

            alert("오디오 권한이 필요합니다.");
            console.error(err);

        }

    };

    /* ===============================
       녹음 종료
    =============================== */

    const stopRecording = () => {

        if (mediaRecorderRef.current) {

            mediaRecorderRef.current.stop();

            setRecordState("idle");

            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

        }

        clearInterval(timerRef.current);

        setRecordTime(0);

    };

    /* ===============================
       녹음 일시정지
    =============================== */

    const pauseRecording = () => {

        if (mediaRecorderRef.current && recordState === "recording") {

            mediaRecorderRef.current.pause();

            setRecordState("paused");

            clearInterval(timerRef.current);

        }

    };

    /* ===============================
       녹음 재개
    =============================== */

    const resumeRecording = () => {

        if (mediaRecorderRef.current && recordState === "paused") {

            mediaRecorderRef.current.resume();

            setRecordState("recording");

            timerRef.current = setInterval(() => {

                setRecordTime(prev => prev + 1);

            },1000);

        }

    };

   /* ===============================
       상담 일지 제출 → DB 저장
    =============================== */

    const submitHandle = (e) => {

        e.preventDefault();

        if (!title) return alert("제목을 입력해주세요.");

        if (recordState !== "idle") stopRecording();

        api.put(`/counselor/report/con/${counselingId}`, {
            title: title,
            con_rep_comment: contents,
            complete_yn: 'Y',
        })
        .then(res => {

            if (res.data.success) {
                alert("상담 일지가 저장되었으며 녹음이 종료되었습니다.");
                navigate(-1);
            } else {
                alert("저장 실패: " + (res.data.detail || "오류가 발생했습니다."));
            }

        })
        .catch(err => {
            console.error('저장 오류:', err);
            alert("저장 중 오류가 발생했습니다.");
        });

    };

    return (

        <div className="c-counseling-container">

            <div className="main-content">

                {/* ===============================
                   TITLE + RECORD CONTROL
                =============================== */}

                <div className="title-row">

                    
                    <h2 className="student-title">
                        {clientName ? `${clientName}의 상담일지` : '상담일지'}
                    </h2>

                    <div className="record-control">

                        {recordState === "idle" && (

                            <button
                                className="btn-record"
                                onClick={startRecording}
                            >
                                🎤 녹음 시작
                            </button>

                        )}

                        {recordState === "recording" && (

                            <div className="record-box">

                                <span className="rec-text">
                                    녹음중 <span className="rec-dot">●</span>
                                </span>

                                <span className="record-timer">
                                    {formatTime(recordTime)}
                                </span>

                                <button
                                    className="btn-record small"
                                    onClick={pauseRecording}
                                >
                                    중지
                                </button>

                                <button
                                    className="btn-record small"
                                    onClick={stopRecording}
                                >
                                    완료
                                </button>

                            </div>

                        )}

                        {recordState === "paused" && (

                            <div className="record-box">

                                <span className="rec-text">
                                    일시정지
                                </span>

                                <span className="record-timer">
                                    {formatTime(recordTime)}
                                </span>

                                <button
                                    className="btn-record small"
                                    onClick={resumeRecording}
                                >
                                    재시작
                                </button>

                                <button
                                    className="btn-record small"
                                    onClick={stopRecording}
                                >
                                    완료
                                </button>

                            </div>

                        )}

                    </div>

                </div>


                {/* ===============================
                   상담 입력
                =============================== */}

                <form className="log-form" onSubmit={submitHandle}>
                    <div className="input-group">
                        <input
                            type='text'
                            placeholder='제목'
                            className="title-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <textarea
                            className="content-textarea"
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            placeholder="상담 내용을 입력하세요."
                        />
                    </div>

                    {/* 하단 버튼 영역: styles를 제거하고 정의된 클래스명을 직접 사용합니다 */}
                    <div className="form-footer">
                        {/* 1. 왼쪽: 뒤로가기 */}
                        <div className="left-btn-area">
                            <button 
                                type="button" 
                                className="btn-back" 
                                onClick={() => navigate(-1)}
                            >
                                뒤로가기
                            </button>
                        </div>

                        {/* 2. 오른쪽: 작성 완료 */}
                        <div className="right-btn-area">
                            <button 
                                type="submit" 
                                className="btn-submit"
                            >
                                작성 완료
                            </button>
                        </div>
                    </div>
                </form>

            </div>

        </div>

    );

};

export default CCounseling;