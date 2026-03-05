import { useState, useRef } from 'react';
import '../../../css/common_css/base.css';
import '../../../css/counselor_css/CCounseling.css';
import { useNavigate } from "react-router-dom";

const CCounseling = () => {

    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [recordState, setRecordState] = useState("idle");

    const [recordTime, setRecordTime] = useState(0);

    const timerRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

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

            mediaRecorderRef.current.onstop = () => {

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                const url = URL.createObjectURL(audioBlob);

                const a = document.createElement('a');

                a.href = url;
                a.download = `recording_${new Date().getTime()}.webm`;

                document.body.appendChild(a);
                a.click();

                setTimeout(() => {

                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                }, 100);

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
       상담 일지 제출
    =============================== */

    const submitHandle = (e) => {

        e.preventDefault();

        if (!title) return alert("제목을 입력해주세요.");

        if (recordState !== "idle") stopRecording();

        alert("상담 일지가 저장되었으며 녹음이 종료되었습니다.");

    };

    return (

        <div className="c-counseling-container">

            <div className="main-content">

                {/* ===============================
                   TITLE + RECORD CONTROL
                =============================== */}

                <div className="title-row">

                    <h2 className="student-title">
                        김민준의 상담 일지
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

                    <div className="form-footer">

                        <button type="submit" className="btn-submit">
                            작성 완료
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};

export default CCounseling;