import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
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

  const frontStartTimeRef = useRef(null);
  const frontFrameCountRef = useRef(0); // 프레임 누적 필요
  const lostFaceCountRef = useRef(0); // 프레임 누적 필요
  const nonFrontCountRef = useRef(0);
  const isTriggeredRef = useRef(false); // 녹화중복 방지

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const [started, setStarted] = useState(false);

  // ⭐ 추가 state
  const [faceDetected, setFaceDetected] = useState(false);
  const [isFacingFront, setIsFacingFront] = useState(false);
  const [frontTime, setFrontTime] = useState(0);
  const [readyToStart, setReadyToStart] = useState(false);

  const [uploading, setUploading] = useState(false); // 파일 저장 중복 방지

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

        webcamRef.current.srcObject = null;

      }

    };

  }, []);

  // ⭐ FaceMesh 정면 인식 (추가)
  useEffect(() => {

    if (!webcamReady || !webcamRef.current || started) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
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

        // 얼굴 잠깐 놓친 경우 바로 초기화하지 않음
        lostFaceCountRef.current++;

        if (lostFaceCountRef.current > 10) { // 10 frame ≈ 약 0.3~0.4초
          setIsFacingFront(false);
          setFrontTime(0);
          frontStartTimeRef.current = null;
          frontFrameCountRef.current = 0;
          lostFaceCountRef.current = 0;   // ⭐ 추가
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

      // 좌우 판정
      const yawFront = noseOffset > 0.15 && noseOffset < 0.85;

      // 상하 판정
      const noseY = nose.y;
      const pitchFront = noseY > 0.35 && noseY < 0.65;

      // 최종 정면 판정
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

          // ⭐ stuck 방지 코드
          if (duration > 8) {
            frontStartTimeRef.current = null;
            setFrontTime(0);
            return;
          }

          if (duration >= 3 && !isTriggeredRef.current) {
            isTriggeredRef.current = true; // 플래그를 올려서 다음 프레임부터는 무시됨
            setReadyToStart(true);

            setTimeout(() => {
              handleStart();
            }, 500);
          }

        }

      } else {

        frontFrameCountRef.current = 0;

        // front가 아닌 상태가 계속 유지되면 강제 초기화
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

    camera.start();

    return () => {

    try {
      faceMesh.close();
    } catch (e) {}

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

  }, [webcamReady]);

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

  const isResume = location.state?.isResume || false;
  const currentCounselingId = location.state?.counseling_id || null;
  const currentReportIds = location.state?.report_ids || []

  const handleStart = async () => {

    try {

      if (isResume) {

        setStarted(true);

        if (currentCounselingId) {
          localStorage.setItem("counselingId", currentCounselingId);
        }

        if (currentReportIds.length > 0) {
          localStorage.setItem("reportIds", JSON.stringify(currentReportIds));
        }

        if (webcamReady && webcamRef.current?.srcObject) {
          startRecording();
        }

      } else {



        setStarted(true);

        if (webcamReady && webcamRef.current?.srcObject) {
          startRecording();
        }

      }

    } catch (err) {

      console.error("상담 생성/시작 실패:", err);

    }

  };
  const handleGoSurvey = async () => {

    if (uploading) return;   // ⭐ 중복 실행 방지
    setUploading(true);

    try {

      const blob = await stopRecording();

      if (webcamRef.current && webcamRef.current.srcObject) {

        const tracks = webcamRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        webcamRef.current.srcObject = null;

      }

      const reportIds = JSON.parse(localStorage.getItem("reportIds") || "[]");
      const currentReportId = reportIds[currentIndex];

      const formData = new FormData();
      formData.append("file", blob, "example.webm");
      formData.append("report_id", currentReportId);

      const counselingId = localStorage.getItem("counselingId");

      if (!counselingId) {
        console.error("counselingId 없음");
        return;
      }

      await api.post(
        `/client/video/upload/${counselingId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      navigate(`/student/survey/${categoryId}`, {
        state: { currentIndex: currentIndex }
      });

    } catch (err) {

      console.error("영상 업로드 실패:", err);
      setUploading(false);

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

          {/* ⭐ 추가 안내 */}
          {!readyToStart && (
            <div className="analysis-status">

              {!faceDetected && "얼굴을 화면에 맞춰 주세요"}

              {faceDetected && !isFacingFront && "정면을 바라봐 주세요"}

              {isFacingFront &&
                `정면 유지 중... ${frontTime.toFixed(1)} / 3초`}

            </div>
          )}

          {readyToStart && (
            <div className="analysis-status">
              분석 준비 완료 ✔
            </div>
          )}

          {/* <button
            className="start-btn"
            disabled={!webcamReady || webcamError || !readyToStart}
            onClick={handleStart}
          >
            시작하기
          </button> */}

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