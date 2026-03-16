import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

import "../../css/student_css/SVideo.css";
import api from "../../services/app";
import SVideoOnboarding from "../student/s_onboarding/VideoOnboarding.jsx";

function SVideo() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();

  const currentIndex = location.state?.currentIndex ?? 0;
  const isResume = location.state?.isResume || false;
  const currentCounselingId = location.state?.counseling_id || null;
  const currentReportIds = location.state?.report_ids || [];

  const [onboard, setOnboard] = useState(false);
  const [onboardPhase, setOnboardPhase] = useState(1);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [started, setStarted] = useState(currentIndex > 0);
  const [uploading, setUploading] = useState(false);

  const [faceDetected, setFaceDetected] = useState(false);
  const [isFacingFront, setIsFacingFront] = useState(false);
  const [frontTime, setFrontTime] = useState(0);
  const [readyToStart, setReadyToStart] = useState(false);

  const webcamRef = useRef(null);
  const previewVideoRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const activeStreamRef = useRef(null);

  const frontStartTimeRef = useRef(null);
  const frontFrameCountRef = useRef(0);
  const lostFaceCountRef = useRef(0);
  const nonFrontCountRef = useRef(0);
  const isTriggeredRef = useRef(false);
  const playerRef = useRef(null);

  /* 카메라 온보딩 */
  useEffect(() => {
    const done = localStorage.getItem("svideo_cam_onboard_done");
    if (done === "true") return;

    const t = setTimeout(() => {
      setOnboard(true);
      setOnboardPhase(1);
    }, 500);

    return () => clearTimeout(t);
  }, []);

  /* 영상 온보딩 */
  useEffect(() => {
    if (!started) return;

    const done = localStorage.getItem("svideo_watch_onboard_done");
    if (done === "true") return;

    let retry;

    const run = () => {
      const el = document.querySelector(".video-container");

      if (!el) {
        retry = setTimeout(run, 120);
        return;
      }

      const r = el.getBoundingClientRect();

      if (r.width === 0 || r.height === 0) {
        retry = setTimeout(run, 120);
        return;
      }

      setOnboardPhase(2);
      setOnboard(true);
    };

    retry = setTimeout(run, 300);

    return () => clearTimeout(retry);
  }, [started, currentVideo]);

  /* 웹캠 초기화 */
  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        activeStreamRef.current = stream;

        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }

        setWebcamReady(true);
        setWebcamError(false);
      } catch (err) {
        console.error("카메라 연결 실패:", err);
        setWebcamError(true);
      }
    };

    init();

    return () => {
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {}
        cameraRef.current = null;
      }

      if (webcamRef.current?.srcObject) {
        const tracks = webcamRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        webcamRef.current.srcObject = null;
      }

      if (previewVideoRef.current?.srcObject) {
        previewVideoRef.current.srcObject = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }

      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, []);

  /* preview video에 stream 재연결 */
  useEffect(() => {
    if (!webcamReady) return;
    if (!webcamRef.current?.srcObject) return;
    if (!previewVideoRef.current) return;

    previewVideoRef.current.srcObject = webcamRef.current.srcObject;
  }, [webcamReady, started, currentIndex]);

  /* FaceMesh */
  useEffect(() => {
    if (!webcamReady || !webcamRef.current || started) return;

    frontStartTimeRef.current = null;
    frontFrameCountRef.current = 0;
    lostFaceCountRef.current = 0;
    nonFrontCountRef.current = 0;
    isTriggeredRef.current = false;

    setFaceDetected(false);
    setIsFacingFront(false);
    setFrontTime(0);
    setReadyToStart(false);

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
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        setFaceDetected(false);

        lostFaceCountRef.current += 1;

        if (lostFaceCountRef.current > 10) {
          setIsFacingFront(false);
          setFrontTime(0);
          setReadyToStart(false);

          frontStartTimeRef.current = null;
          frontFrameCountRef.current = 0;
          nonFrontCountRef.current = 0;
          lostFaceCountRef.current = 0;
        }

        return;
      }

      lostFaceCountRef.current = 0;
      nonFrontCountRef.current = 0;

      const landmarks = results.multiFaceLandmarks[0];
      setFaceDetected(true);

      const nose = landmarks[1];
      const leftCheek = landmarks[234];
      const rightCheek = landmarks[454];

      const leftEyeTop = landmarks[159];
      const leftEyeBottom = landmarks[145];
      const rightEyeTop = landmarks[386];
      const rightEyeBottom = landmarks[374];

      const forehead = landmarks[10];
      const chin = landmarks[152];

      const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
      const faceHeight = Math.abs(chin.y - forehead.y);

      if (faceWidth <= 0 || faceHeight <= 0) return;

      const faceSizeOk = faceWidth > 0.18 && faceHeight > 0.25;

      const noseOffset = (nose.x - leftCheek.x) / faceWidth;
      const yawFront = noseOffset > 0.42 && noseOffset < 0.58;

      const noseVerticalOffset = (nose.y - forehead.y) / faceHeight;
      const pitchFront = noseVerticalOffset > 0.38 && noseVerticalOffset < 0.68;

      const leftEyeOpen = Math.abs(leftEyeBottom.y - leftEyeTop.y);
      const rightEyeOpen = Math.abs(rightEyeBottom.y - rightEyeTop.y);
      const eyesOpen = leftEyeOpen > 0.012 && rightEyeOpen > 0.012;

      const front = faceSizeOk && yawFront && pitchFront && eyesOpen;

      setIsFacingFront(front);

      if (front) {
        frontFrameCountRef.current += 1;

        if (frontFrameCountRef.current >= 3) {
          if (!frontStartTimeRef.current) {
            frontStartTimeRef.current = Date.now();
          }

          const duration = (Date.now() - frontStartTimeRef.current) / 1000;
          setFrontTime(duration);

          if (duration > 8) {
            frontStartTimeRef.current = null;
            frontFrameCountRef.current = 0;
            nonFrontCountRef.current = 0;
            setFrontTime(0);
            setReadyToStart(false);
            return;
          }

          if (duration >= 3 && !isTriggeredRef.current) {
            isTriggeredRef.current = true;
            setReadyToStart(true);

            setTimeout(() => {
              if (!started) {
                handleStart();
              }
            }, 500);
          }
        }
      } else {
        setIsFacingFront(false);
        frontFrameCountRef.current = 0;

        nonFrontCountRef.current += 1;

        if (nonFrontCountRef.current > 20) {
          frontStartTimeRef.current = null;
          setFrontTime(0);
          setReadyToStart(false);
          nonFrontCountRef.current = 0;
        }
      }
    });

    const cam = new Camera(webcamRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: webcamRef.current });
      },
      width: 640,
      height: 480,
    });

    cam.start();
    cameraRef.current = cam;

    return () => {
      try {
        faceMesh.close();
      } catch (e) {}

      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {}
        cameraRef.current = null;
      }
    };
  }, [webcamReady, started]);

  /* 두 번째 영상 자동 시작 */
  useEffect(() => {
    if (!webcamReady) return;
    if (currentIndex === 0) return;
    if (!webcamRef.current?.srcObject) return;
    if (started) return;

    startRecording();
    setStarted(true);
  }, [webcamReady, currentIndex, started]);

  /* 영상 가져오기 */
  const fetchVideo = async () => {
    try {
      const res = await api.get(`/client/survey/${categoryId}`);

      if (res.data.success) {
        setCurrentVideo(res.data.data);
        setVideoEnded(false);
      }
    } catch (err) {
      console.error("영상 조회 실패:", err);
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

    if (recorderRef.current && recorderRef.current.state === "recording") {
      return;
    }

    const stream = webcamRef.current.srcObject;
    streamRef.current = stream;

    let rec;
    try {
      rec = new MediaRecorder(stream, { mimeType: "video/webm" });
    } catch (e) {
      rec = new MediaRecorder(stream);
    }

    recorderRef.current = rec;
    recordedChunks.current = [];

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.current.push(e.data);
      }
    };

    rec.start(1000);
  };

  const stopRecording = () =>
    new Promise((resolve) => {
      if (!recorderRef.current) {
        resolve(new Blob([], { type: "video/webm" }));
        return;
      }

      if (recorderRef.current.state === "inactive") {
        resolve(new Blob(recordedChunks.current, { type: "video/webm" }));
        return;
      }

      recorderRef.current.onstop = () => {
        resolve(new Blob(recordedChunks.current, { type: "video/webm" }));
      };

      try {
        recorderRef.current.stop();
      } catch (e) {
        console.error("녹화 중지 중 에러:", e);
        resolve(new Blob(recordedChunks.current, { type: "video/webm" }));
      }
    });

  const handleStart = async () => {
    try {
      if (isResume) {
        if (currentCounselingId) {
          localStorage.setItem("counselingId", String(currentCounselingId));
        }

        if (currentReportIds.length > 0) {
          localStorage.setItem("reportIds", JSON.stringify(currentReportIds));
        }
      }

      setStarted(true);

      if (webcamReady && webcamRef.current?.srcObject) {
        startRecording();
      }
    } catch (err) {
      console.error("상담 생성/시작 실패:", err);
    }
  };

  const goSurvey = async () => {
    if (uploading) return;
    setUploading(true);

    try {
      const blob = await stopRecording();

      const form = new FormData();
      form.append("file", blob, "video.webm");

      const cid = localStorage.getItem("counselingId");

      if (!cid) {
        console.error("counselingId 없음");
        setUploading(false);
        return;
      }

      await api.post(`/client/video/upload/${cid}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/student/survey/${categoryId}`, {
        state: { currentIndex },
      });
    } catch (err) {
      console.error("영상 업로드 실패:", err);
      setUploading(false);
    }
  };

  const videoId = extractVideoId(currentVideo?.url);

  useEffect(() => {
    if (!started || !videoId) return;

    const createPlayer = () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      playerRef.current = new window.YT.Player("youtube-player", {
        events: {
          onStateChange: (e) => {
            if (e.data === 0) {
              setVideoEnded(true);
            }
          },
        },
      });
    };

    if (!window.YT || !window.YT.Player) {
      const existed = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existed) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId, started]);

  return (
    <div className="svideo-page">
      {onboard && (
        <SVideoOnboarding
          phase={onboardPhase}
          onClose={() => setOnboard(false)}
        />
      )}

      <video
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />

      {!started && currentIndex === 0 && (
        <div className="webcam-check">
          <p className="webcam-guide">
            상담 분석을 위해 웹캠이 사용됩니다.
          </p>

          <div className={`webcam-view ${webcamError ? "error-border" : ""}`}>
            <video ref={previewVideoRef} autoPlay playsInline muted />
          </div>

          {!readyToStart && (
            <div className="analysis-status">
              {!faceDetected && "얼굴을 화면에 맞춰 주세요"}
              {faceDetected && !isFacingFront && "정면을 바라봐 주세요"}
              {isFacingFront &&
                `정면 유지 중... ${frontTime.toFixed(1)} / 3초`}
            </div>
          )}

          {readyToStart && (
            <div className="analysis-status">분석 준비 완료 ✔</div>
          )}
        </div>
      )}

      {started && !currentVideo && (
        <div className="analysis-status">다음 영상을 준비 중입니다...</div>
      )}

      {started && currentVideo && (
        <>
          <div className="video-wrapper">
            <div className="video-container">
              <iframe
                id="youtube-player"
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                title="yt"
                allowFullScreen
              />
            </div>
          </div>

          <button
            className={`survey-btn ${videoEnded ? "enabled" : ""}`}
            disabled={!videoEnded || uploading}
            onClick={goSurvey}
          >
            {uploading ? "업로드 중..." : "설문하러가기"}
          </button>
        </>
      )}
    </div>
  );
}

export default SVideo;