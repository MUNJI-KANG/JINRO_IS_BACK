import { useState  } from 'react';
import { useNavigate } from "react-router-dom";
import '../../css/common_css/base.css';
import '../../css/counselor_css/cLogin.css';

const CLogin = () =>{
    const navigate = useNavigate();
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [idError, setIdError] = useState('');
    const [pwError, setPwError] = useState('');

    const loginHandle = async (e) => {
        e.preventDefault();

        // 1. 빈 값 체크
        if (!id) {
            setIdError('아이디를 입력해주세요');
        } else {
            setIdError('');
        }
        if (!password) {
            setPwError('패스워드를 입력해주세요');
        } else {
            setPwError('');
        }

        if (!id || !password) return; // 하나라도 비어있으면 서버 요청 안 함

        try {
            // 2. FastAPI 서버로 로그인 요청 (POST)
            const response = await fetch("http://127.0.0.1:8000/counselor/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // 백엔드 Pydantic 스키마(CounselorLoginRequest)의 변수명과 동일하게 맞춰서 보냅니다.
                body: JSON.stringify({ 
                    login_id: id, 
                    pw: password 
                }),
            });

            // 3. 서버 응답 결과 처리
            const data = await response.json();

            if (data.success) {
                alert(data.message); 
                navigate("/counselor/scheduler"); 
            } else {
                alert(data.message); 
                setId('');
                setPassword(''); 
            }
        } catch (error) {
            console.error("로그인 통신 에러:", error);
            alert("서버와 통신하는 데 문제가 발생했습니다.");
        }
    };
    return (
        <div className='c-login-wrap'>
            <form className='c-login-form' onSubmit={loginHandle}>
                <h2>상담사 로그인</h2>
                <p>상담사 인증정보를 입력해주세요</p>
                <label htmlFor='cId'>아이디</label>
                <input type='text' id='cId' placeholder='아이디를 입력해주세요' value={id} onChange={(e) => setId(e.target.value)}/>
                {idError && <p className='c-id-label'>{idError}</p>}
                <label htmlFor='cPassword'>패스워드</label>
                <input type='password' id='cPassword' placeholder='비밀번호를 입력해주세요' value={password} onChange={(e) => setPassword(e.target.value)}/>
                {pwError && <p className='c-pw-label'>{pwError}</p>}
                <button type="submit">
                    접속하기</button>
            </form>
        </div>
    );
};

export default CLogin;