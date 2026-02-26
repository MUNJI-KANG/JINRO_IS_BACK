import style from '../../css/student_css/SLogin.module.css'

const SLogin = () => {
    return (
        <div className={style.container}>
            <div className={style.card}>
                {/* 1. 이전으로 버튼 */}
                <button className={style.backButton}>
                    <div className={style.backCircle}>←</div>
                    <span className={style.backText}>이전으로</span>
                </button>

                {/* 헤더 */}
                <div className={style.header}>
                    <h1>환영합니다!</h1>
                    <p>기본 정보를 입력해주세요</p>
                </div>

                {/* 입력창 세트 */}
                <div className={style.formContainer}>
                    <div className={style.formGroup}>
                        <label>이름</label>
                        <input type="text" placeholder="예 : 홍길동" />
                    </div>

                    <div className={style.formGroup}>
                        <label>주민번호 7자리</label>
                        <input type="text" placeholder="예 : 0001011" />
                    </div>

                    <div className={style.formGroup}>
                        <label>핸드폰 번호</label>
                        <input type="tel" placeholder="예 : 01011112222" />
                    </div>

                    <div className={style.formGroup}>
                        <label>이메일</label>
                        <input type="email" placeholder="예 : aaaaa@example.com" />
                    </div>
                </div>

                {/* 하단 버튼 */}
                <button className={style.submitButton}>
                    <span className={style.submitText}>진단 시작하기</span>
                </button>
            </div>
        </div>
    );
};

export default SLogin;