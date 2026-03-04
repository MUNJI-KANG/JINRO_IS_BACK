import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import "../../css/student_css/SVideo.css";

function SVideo() {

  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();

  const selectedVideos = location.state?.selectedVideos || [];
  const currentIndex = location.state?.currentIndex || 0;

  const webcamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [started, setStarted] = useState(false);

  const extractVideoId = (url) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.slice(1);
      }

      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }

      return null;

    } catch {
      return null;
    }
  };

  // 웹캠 초기화
  useEffect(() => {

    const initWebcam = async () => {

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      webcamRef.current.srcObject = stream;
      setWebcamReady(true);

    };

    initWebcam();

  }, []);

  // 영상 데이터 가져오기
  const fetchVideo = async () => {

    const res = await axios.get(
      `http://127.0.0.1:8000/client/survey/${categoryId}`
    );

    if (res.data.success) {
      setCurrentVideo(res.data.data);
    }

  };

  const startRecording = () => {

    const stream = webcamRef.current.srcObject;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm"
    });

    recorderRef.current = mediaRecorder;
    recordedChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    mediaRecorder.start();

  };

  const stopRecording = () => {

    return new Promise((resolve) => {

      recorderRef.current.onstop = () => {

        const blob = new Blob(recordedChunks.current, {
          type: "video/webm"
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `record_${Date.now()}.webm`;
        a.click();

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

    navigate(`/student/survey/${categoryId}`, {
      state: { selectedVideos, currentIndex }
    });

  };

  const videoId = extractVideoId(currentVideo?.url);

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}`
    : null;
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

              if (event.data === window.YT.PlayerState.ENDED) {

                console.log("영상 끝");

                setVideoEnded(true);

              }

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
          
          <p className="webcam-guide">
            상담 분석을 위해 웹캠이 사용됩니다.
          </p>

          <video
            ref={webcamRef}
            autoPlay
            playsInline
          />

          <button
              className="start-btn"
              disabled={!webcamReady}
              onClick={handleStart}
            >
              시작하기
          </button>

        </div>

      )}

      {started && currentVideo && (

        <>

          <div className="analysis-status">
            실시간 분석 중...
          </div>

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