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


 

  // ✅ 수정: localStorage 제거, 항상 false로 시작
  const [started, setStarted] = useState(false);

  // 웹캠 초기화
  useEffect(() => {

    const initWebcam = async () => {

      try {

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
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

  // ✅ 추가: 두 번째 영상부터 webcamReady가 되면 자동 시작
  useEffect(() => {

    if (currentIndex > 0 && webcamReady) {
      startRecording();
      setStarted(true);
    }

  }, [webcamReady]);

  // 영상 가져오기
  const fetchVideo = async () => {

    try {

      const res = await api.get(
        `/client/survey/${categoryId}`
      );

      if (res.data.success) {
        setCurrentVideo(res.data.data);
        setVideoEnded(false);
      }

    } catch (err) {

      console.error(err);

    }

  };

  useEffect(() => {

    if (started) {
      fetchVideo();
    }

  }, [started, categoryId]);


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

    // ✅ null 체크 추가
    if (!webcamRef.current || !webcamRef.current.srcObject) {
      console.error("웹캠이 준비되지 않았습니다.");
      return;
    }

    const stream = webcamRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    recorderRef.current = mediaRecorder;
    recordedChunks.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    mediaRecorder.start();

  };

  const stopRecording = () => {

    return new Promise((resolve) => {

      // ✅ null 체크 추가
      if (!recorderRef.current) {
        console.warn("녹화기가 없습니다.");
        resolve(new Blob([], { type: "video/webm" }));
        return;
      }

      recorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        resolve(blob);
      };

      recorderRef.current.stop();

    });

  };

  const isResume = location.state?.isResume || false;
  const currentCounselingId = location.state?.counseling_id || null; // 🌟 SLogin에서 넘겨준 상담 ID 꺼내기
  const currentReportIds = location.state?.report_ids || []

  const handleStart = async () => {
      try {
          if (isResume) {
              // [이어보기 모드] 
              setStarted(true);

              // 🌟 추가: 설문 페이지 등에서 기존과 똑같이 쓸 수 있도록 로컬 스토리지에 복구해줌
              if (currentCounselingId) {
                  localStorage.setItem("counselingId", currentCounselingId);
              }
              
              if (currentReportIds.length > 0) {
                  localStorage.setItem("reportIds", JSON.stringify(currentReportIds));
              }

              if (webcamReady && webcamRef.current?.srcObject) {
                  startRecording();
              } else {
                  console.warn("웹캠 미준비 상태 - 녹화 생략");
              }
              
          } else {
              // [신규 생성 모드] 
              const videos = selectedVideos.map(v => ({ id: Number(v.id) }));
              const res = await api.post("/client/counselling", { videos });

              // 여기는 원래 있던 그대로!
              localStorage.setItem("counselingId", res.data.counseling_id);
              localStorage.setItem("reportIds", JSON.stringify(res.data.report_ids));

              setStarted(true);

              if (webcamReady && webcamRef.current?.srcObject) {
                  startRecording();
              } else {
                  console.warn("웹캠 미준비 상태 - 녹화 생략");
              }
          }
      } catch (err) {
          console.error("상담 생성/시작 실패:", err);
      }
  };

  const handleGoSurvey = async () => {

    try {

      const blob = await stopRecording();

      const formData = new FormData();

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