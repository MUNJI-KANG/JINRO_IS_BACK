import { useEffect, useState } from "react";


export default function Landing() {

  const [ask, setAsk] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem("visited");
    if (!visited) setAsk(true);
  }, []);

  const handleYes = () => {
    localStorage.setItem("visited","yes");
    setAsk(false);

    // 👉 여기서 온보딩 페이지 이동 가능
    // navigate("/onboarding")
  };

  const handleNo = () => {
    localStorage.setItem("visited","yes");
    setAsk(false);
  };

  return (
    <div className="container">

      {ask && (
        <div className="first-modal-wrap">

          <div className="first-modal card">

            <h2 style={{marginBottom:20}}>
              처음 방문하셨나요?
            </h2>

            <div className="flex" style={{gap:12, justifyContent:"center"}}>

              <button className="btn-primary" onClick={handleYes}>
                네
              </button>

              <button className="btn-primary" onClick={handleNo}
                style={{background:"#ccc", color:"#333"}}
              >
                아니요
              </button>

            </div>

          </div>

        </div>
      )}

      <div style={{height:100}} />

      <div className="text-center">

        <h1 style={{fontSize:36, marginBottom:60}}>
          내, 내 진로가 되라
        </h1>

      </div>

      <div className="flex flex-center" style={{gap:60}}>

        <div className="card" style={{width:280, textAlign:"center"}}>
          <h2>내담자용</h2>
        </div>

        <div className="card" style={{width:280, textAlign:"center"}}>
          <h2>상담사용</h2>
        </div>

      </div>

    </div>
  );
}