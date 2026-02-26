import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const FaceMeshComponent = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [landmarkDataLog, setLandmarkDataLog] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("로딩 중...");

  // 핵심 수정: MediaPipe 콜백 함수 안에서 최신 녹화 상태를 읽기 위한 useRef
  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // 홍채 포함 여부
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);

    let camera = null;
    if (webcamRef.current && webcamRef.current.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await faceMesh.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start().then(() => setCameraStatus("카메라 켜짐"));
    }

    // 컴포넌트 언마운트 시 메모리 누수 방지
    return () => {
      if (camera) camera.stop();
      faceMesh.close();
    };
  }, []);

  const onResults = (results) => {
    if (!canvasRef.current) return;
    
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // 화면에 랜드마크 점 그리기
        for (let i = 0; i < landmarks.length; i++) {
          const x = landmarks[i].x * canvasElement.width;
          const y = landmarks[i].y * canvasElement.height;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 1, 0, 2 * Math.PI);
          canvasCtx.fillStyle = 'aqua';
          canvasCtx.fill();
        }

        // 수정된 부분: useRef를 통해 최신 녹화 상태 확인 후 데이터 적재
        if (isRecordingRef.current) {
          const logEntry = {
            timestamp: Date.now(),
            nose_tip: landmarks[1],     // 코끝
            left_iris: landmarks[468],  // 왼쪽 눈동자
            right_iris: landmarks[473], // 오른쪽 눈동자
          };
          setLandmarkDataLog((prev) => [...prev, logEntry]);
        }
      }
    }
    canvasCtx.restore();
  };

  const downloadDataAsTxt = () => {
    if (landmarkDataLog.length === 0) {
      alert("기록된 데이터가 없습니다.");
      return;
    }

    const dataString = JSON.stringify(landmarkDataLog, null, 2);
    const blob = new Blob([dataString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'counseling_facial_data.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setLandmarkDataLog([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
      <h2>상담 얼굴 분석 데이터 추출기</h2>
      <p>상태: {cameraStatus}</p>
      
      <div style={{ position: 'relative', width: 640, height: 480 }}>
        <Webcam
          ref={webcamRef}
          style={{ position: 'absolute', left: 0, top: 0, width: 640, height: 480, visibility: 'hidden' }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ position: 'absolute', left: 0, top: 0, width: 640, height: 480 }}
        />
      </div>

      <div style={{ marginTop: '20px', gap: '10px', display: 'flex' }}>
        <button 
          onClick={() => setIsRecording(!isRecording)}
          style={{ padding: '10px 20px', backgroundColor: isRecording ? 'red' : 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {isRecording ? '데이터 기록 중지' : '데이터 기록 시작'}
        </button>

        <button 
          onClick={downloadDataAsTxt}
          style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          TXT 다운로드
        </button>
      </div>
      <p>현재 기록된 프레임 수: {landmarkDataLog.length}</p>
    </div>
  );
};

export default FaceMeshComponent;