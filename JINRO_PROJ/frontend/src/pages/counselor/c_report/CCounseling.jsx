import { useState, useRef } from 'react';
import '../../../css/common_css/base.css';
import '../../../css/counselor_css/CCounseling.css';
import { useNavigate } from "react-router-dom";

const CCounseling = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef(null); // MediaRecorder 객체 참조
    const audioChunksRef = useRef([]); // 녹음된 오디오 데이터 조각들 저장

    // 녹화 시작 함수 (카메라 연결)
    const startRecording = async () => {
        try {
            // 1. 마이크 권한 요청 및 스트림 가져오기
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 2. MediaRecorder 인스턴스 생성
            mediaRecorderRef.current = new MediaRecorder(stream);

            // 3. 데이터가 들어올 때마다 배열에 담기
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // 4. 녹음이 중지되면 Blob 생성 및 URL 만들기
            mediaRecorderRef.current.onstop = () => {
                // webm이나 ogg 등 브라우저 지원 형식에 따라 타입 설정
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);

                // 1. 임시 링크(a 태그) 생성
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                // 2. 다운로드될 파일명 설정 (예: recording_1678881234567.webm)
                a.download = `recording_${new Date().getTime()}.webm`;

                // 3. 문서에 추가 후 강제 클릭하여 다운로드 트리거
                document.body.appendChild(a);
                a.click();

                // 4. 메모리 누수 방지를 위한 정리 작업
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                audioChunksRef.current = [];
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            alert("오디오 권한이 필요합니다.");
            console.error(err);
        }
    };

    // 녹화 종료 함수 (스트림 해제)
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            // 녹음 중지 트리거 (onstop 이벤트 발생)
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // 마이크 하드웨어 사용 완전히 종료하기
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const submitHandle = (e) => {
        e.preventDefault();
        if (!title) return alert("제목을 입력해주세요.");

        // 작성 완료 시 녹화 종료
        stopRecording();
        alert("상담 일지가 저장되었으며 녹화가 종료되었습니다.");
    };

    return (
        <div className="c-counseling-container">
            <div className="main-content">
                <h2 className="student-title">김민준의 상담 일지</h2>

                <form className="log-form" onSubmit={submitHandle}>
                    <div className="input-group">
                        <input
                            type='text'
                            placeholder='제목'
                            className="title-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <textarea
                            className="content-textarea"
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            placeholder="상담 내용을 입력하세요."
                        />
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit">작성 완료</button>
                    </div>
                </form>
            </div>

            <div className="side-content">
                {!isRecording ? (
                    /* 기획안에 맞춰 녹화 시작 버튼 표시 */
                    <button className="btn-record" onClick={startRecording}>녹음 시작</button>
                ) : (
                    /* 녹화 중일 때 실시간 영상 프리뷰 표시 */
                    <div className="video-box">
                        <p className="video-label">녹음중 <span className="rec-dot">● REC</span></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CCounseling;