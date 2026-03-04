import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import "../../css/student_css/SVideo.css";

function SVideo() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();

  const selectedVideos = useSelector((state) => state.cVideos);
  const currentIndex = location.state?.currentIndex ?? 0;

  const webcamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(false); // 🔥 카메라 에러 상태 추가
  const [videoEnded, setVideoEnded] = useState(false);
  const [started, setStarted] = useState(false);

  // 웹캠 초기화 및 에러 핸들링
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          setWebcamReady(true);
          setWebcamError(false);
        }
      } catch (err) {
        console.error("카메라 연결 실패:", err);
        setWebcamError(true); // 🔥 에러 발생 시 true
        setWebcamReady(false);
      }
    };

    initWebcam();

    // 언마운트 시 스트림 종료 (자원 해제)
    return () => {
      if (webcamRef.current && webcamRef.current.srcObject) {
        const tracks = webcamRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // ... (extractVideoId, fetchVideo, startRecording, stopRecording 등 기존 함수 동일)
  const extractVideoId = (url) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      return null;
    } catch { return null; }
  };

  const fetchVideo = async () => {
    const res = await axios.get(`http://127.0.0.1:8000/client/survey/${categoryId}`);
    if (res.data.success) setCurrentVideo(res.data.data);
  };

  const startRecording = () => {
    const stream = webcamRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorderRef.current = mediaRecorder;
    recordedChunks.current = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
    mediaRecorder.start();
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      recorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        resolve(blob);
      };
      recorderRef.current.stop();
    });
  };

  const handleStart = async () => {
    await fetchVideo();
    setStarted(true);
    startRecording();
  };

  const handleGoSurvey = async () => {
    await stopRecording();
    navigate(`/student/survey/${categoryId}`, { state: { currentIndex: currentIndex } });
  };

  const videoId = extractVideoId(currentVideo?.url);

  useEffect(() => {
    if (!started || !videoId) return;
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player("youtube-player", {
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) setVideoEnded(true);
          }
        }
      });
    };
  }, [started, videoId]);

  return (
    <div className="svideo-page">
      {!started && (
        <div className="webcam-check">
          <h2>웹캠 상태 확인</h2>
          
          {/* 🔥 에러 메시지 표시 영역 */}
          {webcamError ? (
            <div className="webcam-error-msg">
              ⚠️ 카메라를 찾을 수 없거나 권한이 거부되었습니다. <br />
              설정을 확인하고 새로고침 해주세요.
            </div>
          ) : (
            <p className="webcam-guide">상담 분석을 위해 웹캠이 사용됩니다.</p>
          )}

          <div className={`webcam-view ${webcamError ? "error-border" : ""}`}>
            <video ref={webcamRef} autoPlay playsInline muted />
          </div>

          <button
            className="start-btn"
            disabled={!webcamReady || webcamError} // 에러 시 버튼 비활성화
            onClick={handleStart}
          >
            시작하기
          </button>
        </div>
      )}

      {started && currentVideo && (
        <>
          <div className="analysis-status">실시간 분석 중...</div>
          <div className="video-wrapper">
            <div className="video-container">
              {videoId && (
                <iframe
                  id="youtube-player"
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                  title="YouTube Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            <h3>{currentVideo.title}</h3>
          </div>
          <div className="svideo-bottom">
            <button
              className={`survey-btn ${videoEnded ? "enabled" : ""}`}
              onClick={handleGoSurvey}
              disabled={!videoEnded}
            >
              설문하러 가기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SVideo;