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

  const [onboard,setOnboard] = useState(false);
  const [onboardPhase,setOnboardPhase] = useState(1);

  const [started, setStarted] = useState(false);

  const webcamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [uploading, setUploading] = useState(false);

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

      try{
        const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
        webcamRef.current.srcObject = stream;
        setWebcamReady(true);
      }catch(e){
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

  /* FaceMesh */
  useEffect(() => {

    if (!webcamReady || started) return;

    const faceMesh = new FaceMesh({
      locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
    });

    faceMesh.setOptions({
      maxNumFaces:1,
      refineLandmarks:true,
      minDetectionConfidence:.5,
      minTrackingConfidence:.7
    });

    faceMesh.onResults((results)=>{

      if(!results.multiFaceLandmarks){
        setFaceDetected(false);
        return;
      }

      const lm = results.multiFaceLandmarks[0];
      setFaceDetected(true);

      const nose = lm[1];
      const left = lm[234];
      const right = lm[454];

      const width = right.x-left.x;
      if(width===0) return;

      const offset = (nose.x-left.x)/width;
      const yaw = offset>.15 && offset<.85;
      const pitch = nose.y>.35 && nose.y<.65;

      const front = yaw && pitch;
      setIsFacingFront(front);

      if(front){

        frontFrameCountRef.current++;

        if(frontFrameCountRef.current>=3){

          if(!frontStartTimeRef.current)
            frontStartTimeRef.current = Date.now();

          const d = (Date.now()-frontStartTimeRef.current)/1000;
          setFrontTime(d);

          if(d>=3 && !isTriggeredRef.current){
            isTriggeredRef.current=true;
            setReadyToStart(true);

            setTimeout(()=>{
              setStarted(true);
              startRecording();
            },500);
          }
        }

      }else{
        frontFrameCountRef.current=0;
        frontStartTimeRef.current=null;
        setFrontTime(0);
      }

    });

    const cam = new Camera(webcamRef.current,{
      onFrame:async()=>await faceMesh.send({image:webcamRef.current}),
      width:640,
      height:480
    });

    cam.start();
    cameraRef.current = cam;

    return ()=>{
      faceMesh.close();
      cam.stop();
    };

  },[webcamReady,started]);

  /* 영상 fetch */
  useEffect(()=>{
    if(!started) return;

    api.get(`/client/survey/${categoryId}`)
      .then(res=>{
        if(res.data.success){
          setCurrentVideo(res.data.data);
        }
      });

  },[started]);

  const startRecording = ()=>{

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

    recorderRef.current.stop();

  });

  const videoId = currentVideo?.url?.split("v=")[1];

  useEffect(()=>{

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

      {!started && (

        <div className="webcam-check">

          <div className="webcam-view">
            <video ref={webcamRef} autoPlay playsInline muted/>
          </div>

          <div className="analysis-status">
            {!faceDetected && "얼굴을 맞춰주세요"}
            {faceDetected && !isFacingFront && "정면을 바라봐주세요"}
            {isFacingFront && `정면 유지 ${frontTime.toFixed(1)} / 3`}
          </div>

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