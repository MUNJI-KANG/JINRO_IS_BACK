import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import "../../css/student_css/SVideo.css";
import api from '../../services/app'

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
  const [webcamError, setWebcamError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [started, setStarted] = useState(false);

  // 웹캠 초기화
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
        setWebcamError(true);
        setWebcamReady(false);

      }

    };

    initWebcam();

    return () => {

      if (webcamRef.current && webcamRef.current.srcObject) {
        const tracks = webcamRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

    };

  }, []);

  // 영상 가져오기
  const fetchVideo = async () => {

    try {

      const res = await api.get(
        `/client/survey/${categoryId}`
      );

      if (res.data.success) {
        setCurrentVideo(res.data.data);
        setVideoEnded(false); // 🔥 영상 바뀔 때 초기화
      }

    } catch (err) {

      console.error(err);

    }

  };

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

  const startRecording = () => {

    const stream = webcamRef.current.srcObject;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm"
    });

    recorderRef.current = mediaRecorder;
    recordedChunks.current = [];

    mediaRecorder.ondataavailable = (e) => {

      if (e.data.size > 0) {
        recordedChunks.current.push(e.data);
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

    try {

      const blob = await stopRecording();

      const formData = new FormData();

      // 🔥 파일 이름을 example.webm으로 고정
      formData.append("file", blob, "example.webm");

      await api.post(
        "/client/video/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      navigate(`/student/survey/${categoryId}`, {
        state: { currentIndex: currentIndex }
      });

    } catch (err) {

      console.error("영상 업로드 실패:", err);

    }

  };
  const videoId = extractVideoId(currentVideo?.url);

  // YouTube Player 이벤트
  useEffect(() => {

    if (!started || !videoId) return;

    setVideoEnded(false);

    const createPlayer = () => {

      new window.YT.Player("youtube-player", {

        events: {

          onStateChange: (event) => {

            if (event.data === window.YT.PlayerState.ENDED) {
              setVideoEnded(true);
            }

          }

        }

      });

    };

    if (!window.YT) {

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = createPlayer;

    } else {

      createPlayer();

    }

  }, [videoId, started]);

  return (

    <div className="svideo-page">

      {!started && (

        <div className="webcam-check">

          <h2>웹캠 상태 확인</h2>

          {webcamError ? (

            <div className="webcam-error-msg">
              ⚠️ 카메라를 찾을 수 없거나 권한이 거부되었습니다. <br />
              설정을 확인하고 새로고침 해주세요.
            </div>

          ) : (

            <p className="webcam-guide">
              상담 분석을 위해 웹캠이 사용됩니다.
            </p>

          )}

          <div className={`webcam-view ${webcamError ? "error-border" : ""}`}>
            <video ref={webcamRef} autoPlay playsInline muted />
          </div>

          <button
            className="start-btn"
            disabled={!webcamReady || webcamError}
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