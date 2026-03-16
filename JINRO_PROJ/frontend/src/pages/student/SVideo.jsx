import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

import "../../css/student_css/SVideo.css";
import api from '../../services/app'

import SVideoOnboarding from "../student/s_onboarding/VideoOnboarding.jsx";

function SVideo() {

  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();

  // const selectedVideos = useSelector((state) => state.cVideos); 현재 사용 안하는중
  const currentIndex = location.state?.currentIndex ?? 0;

  const [onboard,setOnboard] = useState(false);
  const [onboardPhase,setOnboardPhase] = useState(1);

  const [started, setStarted] = useState(false);

  const webcamRef = useRef(null);
  const previewVideoRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const [started, setStarted] = useState(currentIndex > 0);

  const [faceDetected, setFaceDetected] = useState(false);
  const [isFacingFront, setIsFacingFront] = useState(false);
  const [frontTime, setFrontTime] = useState(0);
  const [readyToStart, setReadyToStart] = useState(false);

  const frontStartTimeRef = useRef(null);
  const frontFrameCountRef = useRef(0);
  const isTriggeredRef = useRef(false);

  /* ⭐ 카메라 온보딩 */
  useEffect(()=>{

    const done = localStorage.getItem("svideo_cam_onboard_done");
    if(done==="true") return;

    const t = setTimeout(()=>{
      setOnboard(true);
      setOnboardPhase(1);
    },500);

    return ()=>clearTimeout(t);

  },[]);

  useEffect(()=>{

    if(!started) return;

    const done = localStorage.getItem("svideo_watch_onboard_done");
    if(done === "true") return;

    let retry;

    const run = ()=>{

      const el = document.querySelector(".video-container");

      if(!el){
        retry = setTimeout(run,120);
        return;
      }

      const r = el.getBoundingClientRect();

      if(r.width === 0 || r.height === 0){
        retry = setTimeout(run,120);
        return;
      }

      setOnboardPhase(2);
      setOnboard(true);

    };

    retry = setTimeout(run,300);

    return ()=> clearTimeout(retry);

  },[started,currentVideo]);

  
  useEffect(() => {

    const init = async () => {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        activeStream = stream;

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

  // 화면에 보여주는 preview video에도 stream 다시 연결 ➡ preview가 늦게 렌더되어도 정상 표시됨.
  useEffect(() => {
    if (!webcamReady) return;
    if (!webcamRef.current?.srcObject) return;
    if (!previewVideoRef.current) return;

    previewVideoRef.current.srcObject = webcamRef.current.srcObject;
  }, [webcamReady, started, currentIndex]);

  /* FaceMesh */
  useEffect(() => {

    if (!webcamReady || !webcamRef.current || started) return;

    // 정면 감지 시작 시 상태 초기화
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
      maxNumFaces:1,
      refineLandmarks:true,
      minDetectionConfidence:.5,
      minTrackingConfidence:.7
    });

    faceMesh.onResults((results)=>{

      // 얼굴 없음 판정
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {

        setFaceDetected(false);

        // 얼굴 잠깐 놓친 경우 바로 초기화하지 않음
        lostFaceCountRef.current++;

        if (lostFaceCountRef.current > 10) { // 10 frame ≈ 약 0.3~0.4초
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

      const lm = results.multiFaceLandmarks[0];
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

      // 1) 얼굴이 너무 작으면 무시
      const faceSizeOk = faceWidth > 0.18 && faceHeight > 0.25;

      // 2) 코가 얼굴 중앙에 충분히 가까운지
      const noseOffset = (nose.x - leftCheek.x) / faceWidth;
      const yawFront = noseOffset > 0.42 && noseOffset < 0.58;

      // 3) 코 위치로 아주 대충 상하 각도만 제한 (기존보다 덜 허술하게)
      const noseVerticalOffset = (nose.y - forehead.y) / faceHeight;
      const pitchFront = noseVerticalOffset > 0.38 && noseVerticalOffset < 0.68;

      // 4) 눈 뜸 여부 확인
      const leftEyeOpen = Math.abs(leftEyeBottom.y - leftEyeTop.y);
      const rightEyeOpen = Math.abs(rightEyeBottom.y - rightEyeTop.y);
      const eyesOpen = leftEyeOpen > 0.012 && rightEyeOpen > 0.012;

      // 최종 정면 판정
      const front = faceSizeOk && yawFront && pitchFront && eyesOpen;

      setIsFacingFront(front);

      if(front){

        frontFrameCountRef.current++;

        if(frontFrameCountRef.current>=3){

          if(!frontStartTimeRef.current)
            frontStartTimeRef.current = Date.now();

          const d = (Date.now()-frontStartTimeRef.current)/1000;
          setFrontTime(d);

          // ⭐ stuck 방지 코드
          if (duration > 8) {
            frontStartTimeRef.current = null;
            frontFrameCountRef.current = 0;
            nonFrontCountRef.current = 0;
            setFrontTime(0);
            setReadyToStart(false);
            return;
          }

          if (duration >= 3 && !isTriggeredRef.current) {
            isTriggeredRef.current = true; // 플래그를 올려서 다음 프레임부터는 무시됨
            setReadyToStart(true);

           setTimeout(() => {
              if (!started) { // 중복 호출을 방지하기 위한 2중 안전장치.
                handleStart();
              }
            }, 500);
          }
        }

      } else {

        setIsFacingFront(false);
        frontFrameCountRef.current = 0;

        // front가 아닌 상태가 계속 유지되면 강제 초기화
        nonFrontCountRef.current++;

        if (nonFrontCountRef.current > 20) {
          frontStartTimeRef.current = null;
          setFrontTime(0);
          setReadyToStart(false);
          nonFrontCountRef.current = 0;
        }

    });

    const cam = new Camera(webcamRef.current,{
      onFrame:async()=>await faceMesh.send({image:webcamRef.current}),
      width:640,
      height:480
    });

    cam.start();
    cameraRef.current = cam;

    return () => {
      try {
        faceMesh.close();
      } catch (e) {}

      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };

  },[webcamReady,started]);

  // 두 번째 영상 자동 시작
  useEffect(() => {
    if (!webcamReady) return;
    if (currentIndex === 0) return;
    if (!webcamRef.current?.srcObject) return;

    startRecording();
    setStarted(true);
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

    // 녹화 시작 전에 현재 카메라 스트림을 스스로 꺼버리는 위험한 코드라서 일단 주석처리 0316-11시21분
    // if (streamRef.current) {
    //   streamRef.current.getTracks().forEach((track) => track.stop());
    //   streamRef.current = null;
    // }

    const stream = webcamRef.current.srcObject;
    streamRef.current = stream;

    const rec = new MediaRecorder(stream,{mimeType:"video/webm"});
    recorderRef.current = rec;
    recordedChunks.current = [];

    rec.ondataavailable = e=>{
      if(e.data.size>0) recordedChunks.current.push(e.data);
    };

    rec.start(1000);

  };

  const stopRecording = ()=> new Promise(res=>{

    recorderRef.current.onstop = ()=>{
      res(new Blob(recordedChunks.current,{type:"video/webm"}));
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

      // 이후 재진입 시 과거 stream 참조가 남는 것 방지
      if (streamRef.current) {
        streamRef.current = null;
      }

      const reportIds = JSON.parse(localStorage.getItem("reportIds") || "[]");
      const currentReportId = reportIds[currentIndex];

      const formData = new FormData();
      formData.append("file", blob, "example.webm");
      formData.append("report_id", currentReportId);

      const counselingId = localStorage.getItem("counselingId");

      if (!counselingId) {
        console.error("counselingId 없음");
        setUploading(false);
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

    if(!started || !videoId) return;

    const create = ()=>{

      new window.YT.Player("youtube-player",{
        events:{
          onStateChange:e=>{
            if(e.data===0) setVideoEnded(true);
          }
        }
      });

    };

    if(!window.YT){
      const tag = document.createElement("script");
      tag.src="https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady=create;
    }else create();

  },[videoId,started]);

  const goSurvey = async ()=>{

    if(uploading) return;
    setUploading(true);

    const blob = await stopRecording();

    const form = new FormData();
    form.append("file",blob,"video.webm");

    const cid = localStorage.getItem("counselingId");

    await api.post(`/client/video/upload/${cid}`,form,{
      headers:{ "Content-Type":"multipart/form-data" }
    });

    navigate(`/student/survey/${categoryId}`);

  };

  return (

    <div className="svideo-page">

      {onboard && (
        <SVideoOnboarding
          phase={onboardPhase}
          onClose={()=>setOnboard(false)}
        />
      )}

      {onboard && (
        <SVideoOnboarding
          phase={onboardPhase}
          onClose={()=>setOnboard(false)}
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

          <div className="webcam-view">
            <video ref={webcamRef} autoPlay playsInline muted/>
          </div>

          ) : (

            <p className="webcam-guide">
              상담 분석을 위해 웹캠이 사용됩니다.
            </p>

          )}

          <div className={`webcam-view ${webcamError ? "error-border" : ""}`}>
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
            />
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
            <div className="analysis-status">
              분석 준비 완료 ✔
            </div>
          )}

        </div>

      )}

      {started && !currentVideo && currentIndex > 0 && (
        <div className="analysis-status">
          다음 영상을 준비 중입니다...
        </div>
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
            className={`survey-btn ${videoEnded?"enabled":""}`}
            disabled={!videoEnded}
            onClick={goSurvey}
          >
            설문하러가기
          </button>
        </>

      )}

    </div>

  );
}

export default SVideo;