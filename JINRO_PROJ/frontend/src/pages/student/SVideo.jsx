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

  const [onboard,setOnboard] = useState(false);
  const [onboardPhase,setOnboardPhase] = useState(1);

  const [started,setStarted] = useState(currentIndex > 0);
  const [currentVideo,setCurrentVideo] = useState(null);
  const [videoEnded,setVideoEnded] = useState(false);

  const [webcamReady,setWebcamReady] = useState(false);
  const [webcamError,setWebcamError] = useState(false);

  const [faceDetected,setFaceDetected] = useState(false);
  const [isFacingFront,setIsFacingFront] = useState(false);
  const [frontTime,setFrontTime] = useState(0);
  const [readyToStart,setReadyToStart] = useState(false);

  const webcamRef = useRef(null);
  const previewVideoRef = useRef(null);

  const cameraRef = useRef(null);
  const faceMeshRef = useRef(null);

  const frontStartTimeRef = useRef(null);
  const frontFrameCountRef = useRef(0);
  const lostFaceCountRef = useRef(0);
  const nonFrontCountRef = useRef(0);
  const triggeredRef = useRef(false);

  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const playerRef = useRef(null);

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

  /* ⭐ 영상 온보딩 */
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

  /* ⭐ 웹캠 스트림 */
  useEffect(()=>{

    const init = async ()=>{
      try{
        const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});

        webcamRef.current.srcObject = stream;
        previewVideoRef.current.srcObject = stream;

        setWebcamReady(true);
        setWebcamError(false);

      }catch(e){
        console.log(e);
        setWebcamError(true);
      }
    };

    init();

    return ()=>{
      if(webcamRef.current?.srcObject){
        webcamRef.current.srcObject.getTracks().forEach(t=>t.stop());
      }
    };

  },[]);

  /* ⭐⭐⭐ FaceMesh (온보딩 중 완전 정지) */
  useEffect(()=>{

    if(!webcamReady || onboard || started) return;

    frontStartTimeRef.current = null;
    frontFrameCountRef.current = 0;
    lostFaceCountRef.current = 0;
    nonFrontCountRef.current = 0;
    triggeredRef.current = false;

    setFaceDetected(false);
    setIsFacingFront(false);
    setFrontTime(0);
    setReadyToStart(false);

    const faceMesh = new FaceMesh({
      locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces:1,
      refineLandmarks:true,
      minDetectionConfidence:.5,
      minTrackingConfidence:.7
    });

    faceMesh.onResults((results)=>{

      if(!results.multiFaceLandmarks || results.multiFaceLandmarks.length===0){

        setFaceDetected(false);
        lostFaceCountRef.current++;

        if(lostFaceCountRef.current>10){
          setIsFacingFront(false);
          setFrontTime(0);
          setReadyToStart(false);

          frontStartTimeRef.current=null;
          frontFrameCountRef.current=0;
          nonFrontCountRef.current=0;
          lostFaceCountRef.current=0;
        }

        return;
      }

      const lm = results.multiFaceLandmarks[0];
      setFaceDetected(true);

      const nose = lm[1];
      const left = lm[234];
      const right = lm[454];
      const top = lm[10];
      const bottom = lm[152];

      const w = Math.abs(right.x-left.x);
      const h = Math.abs(bottom.y-top.y);

      if(w<=0 || h<=0) return;

      const front = (nose.x-left.x)/w>0.42 && (nose.x-left.x)/w<0.58;

      setIsFacingFront(front);

      if(front){

        frontFrameCountRef.current++;

        if(frontFrameCountRef.current>=3){

          if(!frontStartTimeRef.current)
            frontStartTimeRef.current = Date.now();

          const d = (Date.now()-frontStartTimeRef.current)/1000;
          setFrontTime(d);

          if(d>=3 && !triggeredRef.current){
            triggeredRef.current=true;
            setReadyToStart(true);

            setTimeout(()=>{
              if(!started){
                setStarted(true);
                startRecording();
              }
            },400);
          }
        }

      }else{
        setIsFacingFront(false);
        frontFrameCountRef.current=0;
      }

    });

    const cam = new Camera(webcamRef.current,{
      onFrame:async()=>await faceMesh.send({image:webcamRef.current}),
      width:640,
      height:480
    });

    cam.start();

    faceMeshRef.current = faceMesh;
    cameraRef.current = cam;

    return ()=>{
      try{faceMesh.close();}catch{}
      try{cam.stop();}catch{}
    };

  },[webcamReady,onboard,started]);

  /* ⭐ 영상 불러오기 */
  useEffect(()=>{
    if(!started) return;

    api.get(`/client/survey/${categoryId}`)
      .then(res=>{
        if(res.data.success){
          setCurrentVideo(res.data.data);
          setVideoEnded(false);
        }
      });

  },[started,categoryId]);

  /* ⭐ 녹화 */
  const startRecording = ()=>{
    const stream = webcamRef.current.srcObject;

    const rec = new MediaRecorder(stream,{mimeType:"video/webm"});
    recorderRef.current = rec;
    recordedChunks.current=[];

    rec.ondataavailable=e=>{
      if(e.data.size>0) recordedChunks.current.push(e.data);
    };

    rec.start(1000);
  };

  const stopRecording = ()=> new Promise(res=>{
    recorderRef.current.onstop=()=>{
      res(new Blob(recordedChunks.current,{type:"video/webm"}));
    };
    recorderRef.current.stop();
  });

  /* ⭐ 유튜브 */
  const videoId = currentVideo?.url?.split("v=")[1];

  useEffect(()=>{

    if(!started || !videoId) return;

    const create = ()=>{
      playerRef.current = new window.YT.Player("youtube-player",{
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

    const blob = await stopRecording();

    const form = new FormData();
    form.append("file",blob,"video.webm");

    await api.post("/client/video/upload/1",form,{
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

      <video ref={webcamRef} autoPlay playsInline muted style={{display:"none"}}/>

      {!started && (
        <div className="webcam-check">

          <div className="webcam-view">
            <video ref={previewVideoRef} autoPlay playsInline muted/>
          </div>

          {!readyToStart && (
            <div className="analysis-status">
              {!faceDetected && "얼굴을 화면에 맞춰 주세요"}
              {faceDetected && !isFacingFront && "정면을 바라봐 주세요"}
              {isFacingFront && `정면 유지 ${frontTime.toFixed(1)} / 3초`}
            </div>
          )}

        </div>
      )}

      {started && currentVideo && (
        <>
          <div className="video-container">
            <iframe
              id="youtube-player"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
              allowFullScreen
            />
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