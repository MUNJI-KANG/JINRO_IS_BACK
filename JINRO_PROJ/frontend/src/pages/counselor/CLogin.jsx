import { useState } from 'react';
import '../../css/common_css/base.css';
import '../../css/counselor_css/cLogin.css';

const CLogin = () =>{
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [idError, setIdError] = useState('');
    const [pwError, setPwError] = useState('');

    const loginHandle = (e) =>{
        e. preventDefault();

        if(!id){
            setIdError('아이디를 입력해주세요');
        }else{
            setIdError('');
        }

        if(!password){
            setPwError('패스워드를 입력해주세요');
        }else{
            setPwError('');
        }
    }

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
                <button type="submit">접속하기</button>
            </form>
        </div>
    );
};

export default CLogin;