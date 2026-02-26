import { useState, useRef } from 'react';
import '../../../css/common_css/base.css';
import '../../../css/counselor_css/CCounseling.css';

const CCounseling = () => {
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // 녹화 시작 함수 (카메라 연결)
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsRecording(true);
        } catch (err) {
            alert("카메라 권한이 필요합니다.");
            console.error(err);
        }
    };

    // 녹화 종료 함수 (스트림 해제)
    const stopRecording = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            setIsRecording(false);
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
                    <button className="btn-record" onClick={startRecording}>녹화 시작</button>
                ) : (
                    /* 녹화 중일 때 실시간 영상 프리뷰 표시 */
                    <div className="video-box">
                        <p className="video-label">화면 녹화중 <span className="rec-dot">● REC</span></p>
                        <video ref={videoRef} autoPlay muted className="preview-video" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CCounseling;