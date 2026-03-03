import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../css/student_css/SBigCat.css";
import {
  Briefcase,
  Calculator,
  Banknote,
  GraduationCap,
  Gavel,
  HeartPulse,
  HandHeart,
  Palette,
  Truck,
  Tag,
  ShieldCheck,
  Hotel,
  Utensils,
  Building,
  Cog,
  Layers,
  FlaskConical,
  Shirt,
  Zap,
  Cpu,
  Wheat,
  TreeDeciduous,
  Plug,
  Leaf
} from "lucide-react";

const categories = [
  { name: "사업관리", icon: Briefcase },
  { name: "경영·회계·사무", icon: Calculator },
  { name: "금융·보험", icon: Banknote },
  { name: "교육·자연·사회과학", icon: GraduationCap },
  { name: "법률·경찰·소방", icon: Gavel },
  { name: "보건·의료", icon: HeartPulse },
  { name: "사회복지·종교", icon: HandHeart },
  { name: "문화·예술·디자인", icon: Palette },
  { name: "운전·운송", icon: Truck },
  { name: "영업판매", icon: Tag },
  { name: "경비·청소", icon: ShieldCheck },
  { name: "이용·숙박·여행", icon: Hotel },
  { name: "음식서비스", icon: Utensils },
  { name: "건설", icon: Building },
  { name: "기계", icon: Cog },
  { name: "재료", icon: Layers },
  { name: "화학·바이오", icon: FlaskConical },
  { name: "섬유·의복", icon: Shirt },
  { name: "전기·전자", icon: Zap },
  { name: "정보통신", icon: Cpu },
  { name: "식품가공", icon: Wheat },
  { name: "인쇄·목재·가구", icon: TreeDeciduous },
  { name: "환경·에너지", icon: Plug },
  { name: "농림어업", icon: Leaf },
];

function SBigCat() {
  const navigate = useNavigate();

  const [selectedBig, setSelectedBig] = useState(null);
  const [selectedMid, setSelectedMid] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);

  /* ===============================
     영상 선택
  =============================== */
  const selectVideo = (video) => {
    if (selectedVideos.includes(video)) return;
    if (selectedVideos.length >= 3) return;

    setSelectedVideos((prev) => [...prev, video]);
  };

  const removeVideo = (video) => {
    setSelectedVideos((prev) => prev.filter((v) => v !== video));
  };

  /* ===============================
     대분류로 이동 (공통 버튼)
  =============================== */
  const goToBigCategory = () => {
    setSelectedMid(null);
    setSelectedBig(null);
  };

  const canProceed = selectedVideos.length === 3;


  const handleCategoryClick = (catName) => {
    setSelectedBig(catName); // 선택된 대분류 상태 저장 (필요 시)
    // 중분류 화면으로 이동. 라우터 설정에 맞춰 경로를 수정하실 수 있습니다.
    // 추가로 어떤 대분류를 선택했는지 다음 페이지로 넘기고 싶다면 state를 활용할 수 있습니다.
    navigate("/student/category/medium", { state: { bigCategory: catName } }); 
  };

  return (
    <div className="bigcat-page">
      <div className="bigcat-container">
        <h2>분야 선택</h2>
        <p>서로 다른 카테고리에서 3개의 영상을 선택하세요</p>

        <div className="count-box">
          선택한 영상: {selectedVideos.length} / 3
        </div>

        {/* ===============================
           1️⃣ 대분류
        =============================== */}
        {!selectedBig && (
          <div className="grid">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="card"
                  onClick={() => handleCategoryClick(cat.name)} // 👉 핸들러 연결
                >
                  <Icon className="cat-icon" />
                  {cat.name}
                </div>
              );
            })}
          </div>
        )}

        {/* ===============================
           선택된 영상 목록
        =============================== */}
        <div className="selected-list">
          {selectedVideos.map((video) => (
            <div key={video} className="selected-item">
              {video}
              <button onClick={() => removeVideo(video)}>✕</button>
            </div>
          ))}
        </div>

        {/* ===============================
           하단 버튼
        =============================== */}
        <div className="button-row">
          <button
            className={`next ${canProceed ? "active" : ""}`}
            disabled={!canProceed}
            onClick={() => navigate("/student/category/checkout")}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

export default SBigCat;