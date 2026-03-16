import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { useSelector } from "react-redux";

import "../../css/student_css/SVideo.css";
import api from '../../services/app'
import SVideoOnboarding from "../student/s_onboarding/VideoOnboarding.jsx";

function SVideo() {

  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();

  const selectedVideos = useSelector((state) => state.cVideos);
  const currentIndex = location.state?.currentIndex ?? 0;
  
  // ⭐ 백엔드 전송에 필요한 ID 값들
  const isResume = location.state?.isResume || false;
  const currentCounselingId = location.state?.counseling_id || null;
  const currentReportIds = location.state?.report_ids || [];

  const [onboard, setOnboard] = useState(false);
  const [onboardPhase, setOnboardPhase] = useState(1);

  const webcamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  const frontStartTimeRef = useRef(null);
  const frontFrameCountRef = useRef(0);
  const lostFaceCountRef = useRef(0);
  const nonFrontCountRef = useRef(0);
  const isTriggeredRef = useRef(false);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const [started, setStarted] = useState(false);

  const [faceDetected, setFaceDetected] = useState(false);
  const [isFacingFront, setIsFacingFront] = useState(false);
  const [frontTime, setFrontTime] = useState(0);
  const [readyToStart, setReadyToStart] = useState(false);

  const [uploading, setUploading] = useState(false); 

  /* ⭐ 카메라 온보딩 (Phase 1) */
  useEffect(()=>{
    const done = localStorage.getItem("svideo_cam_onboard_done");
    if(done==="true") return;

    const t = setTimeout(()=>{
      setOnboard(true);
      setOnboardPhase(1);
    },500);

    return ()=>clearTimeout(t);
  },[]);

  /* ⭐ 영상 온보딩 복구 (Phase 2) */
  useEffect(()=>{
    if(!started) return;

    const done = localStorage.getItem("svideo_watch_onboard_done");
    if(done==="true") return;

    let retry;

    const run = ()=>{
      const el = document.querySelector(".video-container");
      if(!el){
        retry = setTimeout(run,120);
        return;
      }

      const r = el.getBoundingClientRect();
      if(r.width===0){
        retry = setTimeout(run,120);
        return;
      }

      setOnboard(true);
      setOnboardPhase(2);
    };

    retry = setTimeout(run,300);
    return ()=>clearTimeout(retry);

  },[started,currentVideo]);

  // ⭐ 웹캠 초기화 
  useEffect(() => {
    let activeStream = null;

    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        activeStream = stream;
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
        webcamRef.current.srcObject = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ⭐ FaceMesh 정면 인식
  useEffect(() => {
    if (!webcamReady || !webcamRef.current || started) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks) {
        setFaceDetected(false);
        lostFaceCountRef.current++;

        if (lostFaceCountRef.current > 10) { 
          setIsFacingFront(false);
          setFrontTime(0);
          frontStartTimeRef.current = null;
          frontFrameCountRef.current = 0;
          lostFaceCountRef.current = 0;   
        }
        return;
      }

      lostFaceCountRef.current = 0;
      const landmarks = results.multiFaceLandmarks[0];
      setFaceDetected(true);

      const nose = landmarks[1];
      const left = landmarks[234];
      const right = landmarks[454];

      const faceWidth = right.x - left.x;
      if (faceWidth === 0) return;

      const noseOffset = (nose.x - left.x) / faceWidth;
      const yawFront = noseOffset > 0.15 && noseOffset < 0.85;
      const noseY = nose.y;
      const pitchFront = noseY > 0.35 && noseY < 0.65;
      const front = yawFront && pitchFront;

      setIsFacingFront(front);

      if (front) {
        nonFrontCountRef.current = 0;
        frontFrameCountRef.current++;

        if (frontFrameCountRef.current >= 3) {
          if (!frontStartTimeRef.current) {
            frontStartTimeRef.current = Date.now();
          }

          const duration = (Date.now() - frontStartTimeRef.current) / 1000;
          setFrontTime(duration);

          if (duration > 8) {
            frontStartTimeRef.current = null;
            setFrontTime(0);
            return;
          }

          if (duration >= 3 && !isTriggeredRef.current) {
            isTriggeredRef.current = true; 
            setReadyToStart(true);

            setTimeout(() => {
              handleStart(); 
            }, 500);
          }
        }
      } else {
        frontFrameCountRef.current = 0;
        nonFrontCountRef.current++;

        if (nonFrontCountRef.current > 20) {
          frontStartTimeRef.current = null;
          setFrontTime(0);
          nonFrontCountRef.current = 0;
        }
      }
    });

    const videoElement = webcamRef.current;
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    cameraRef.current = camera;
    camera.start();

    return () => {
      try { faceMesh.close(); } catch (e) {}
      if (webcamRef.current && webcamRef.current.srcObject) {
        const tracks = webcamRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        webcamRef.current.srcObject = null;
      }
    };
  }, [webcamReady, started]);

  // 두 번째 영상 자동 시작
  useEffect(() => {
    if (currentIndex > 0 && webcamReady) {
      startRecording();
      setStarted(true);
    }
  }, [webcamReady, currentIndex]);

  // 영상 가져오기
  const fetchVideo = async () => {
    try {
      const res = await api.get(`/client/survey/${categoryId}`);
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
      if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      return null;
    } catch {
      return null;
    }
  };

  const startRecording = () => {
    if (!webcamRef.current || !webcamRef.current.srcObject) {
      console.error("웹캠이 준비되지 않았습니다.");
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const stream = webcamRef.current.srcObject;
    streamRef.current = stream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    recorderRef.current = mediaRecorder;
    recordedChunks.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    mediaRecorder.start(1000);
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!recorderRef.current) {
        resolve(new Blob([], { type: "video/webm" }));
        return;
      }
      if (recorderRef.current.state === "inactive") {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        resolve(blob);
        return;
      }

      recorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        resolve(blob);
      };

      try {
        recorderRef.current.stop();
      } catch (e) {
        console.error("녹화 중지 중 에러 (무시 가능):", e);
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        resolve(blob);
      }
    });
  };

  const handleStart = async () => {
    try {
      if (currentCounselingId) {
        localStorage.setItem("counselingId", currentCounselingId);
      }
      if (currentReportIds.length > 0) {
        localStorage.setItem("reportIds", JSON.stringify(currentReportIds));
      }

      setStarted(true);

      if (webcamReady && webcamRef.current?.srcObject) {
        startRecording();
      }
    } catch (err) {
      console.error("상담 생성/시작 실패:", err);
    }
  };

  /* ⭐ 업로드 처리 및 화면 이동 로직 */
  const handleGoSurvey = async () => {
    if (uploading) return;   
    setUploading(true);

    try {
      const blob = await stopRecording();

      if (webcamRef.current && webcamRef.current.srcObject) {
        const tracks = webcamRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        webcamRef.current.srcObject = null;
      }

      const storedReportIds = JSON.parse(localStorage.getItem("reportIds") || "[]");
      const currentReportId = currentReportIds[currentIndex] || storedReportIds[currentIndex] || 1;

      const formData = new FormData();
      formData.append("file", blob, "video.webm");
      formData.append("report_id", currentReportId);

      const counselingId = currentCounselingId || localStorage.getItem("counselingId") || "1";

      await api.post(`/client/video/upload/${counselingId}`, formData);

      navigate(`/student/survey/${categoryId}`, {
        state: { currentIndex: currentIndex }
      });

    } catch (err) {
      console.error("영상 업로드 실패:", err);
      setUploading(false);
      alert("영상 저장 중 문제가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const videoId = extractVideoId(currentVideo?.url);

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
      
      {onboard && (
        <SVideoOnboarding
          phase={onboardPhase}
          onClose={()=>setOnboard(false)}
        />
      )}

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

          {!readyToStart && (
            <div className="analysis-status">
              {!faceDetected && "얼굴을 화면에 맞춰 주세요"}
              {faceDetected && !isFacingFront && "정면을 바라봐 주세요"}
              {isFacingFront && `정면 유지 중... ${frontTime.toFixed(1)} / 3초`}
            </div>
          )}

          {readyToStart && (
            <div className="analysis-status">
              분석 준비 완료 ✔
            </div>
          )}
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
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
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
              disabled={!videoEnded || uploading}
            >
              {uploading ? "업로드 중..." : "설문하러 가기"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}

export default SVideo;