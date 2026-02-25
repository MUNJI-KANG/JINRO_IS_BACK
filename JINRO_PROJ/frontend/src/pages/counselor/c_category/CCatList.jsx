import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../common/Layout";
import "../../../css/counselor_css/Category.css";

import {
  Briefcase,
  Calculator,
  Building,
  GraduationCap,
  Gavel,
  HandHeart,
  User,
  Palette,
  Truck,
  ShoppingCart,
  ShieldCheck,
  Mountain,
  Utensils,
  Factory,
  Settings,
  Package,
  FlaskConical,
  Shirt,
  Zap,
  Cpu,
  Database,
  Hammer,
  Leaf,
  Flower2,
  ArrowLeft,
} from "lucide-react";

/** =========================
 * 1) 대분류
 * ========================= */
const bigCategories = [
  { id: 1, name: "사업관리", icon: Briefcase },
  { id: 2, name: "경영·회계·사무", icon: Calculator },
  { id: 3, name: "금융·보험", icon: Building },
  { id: 4, name: "교육·자연·사회과학", icon: GraduationCap },
  { id: 5, name: "법률·경찰·소방·교도·국방", icon: Gavel },
  { id: 6, name: "보건·의료", icon: HandHeart },
  { id: 7, name: "사회복지·종교", icon: User },
  { id: 8, name: "문화·예술·디자인·방송", icon: Palette },
  { id: 9, name: "운전·운송", icon: Truck },
  { id: 10, name: "영업판매", icon: ShoppingCart },
  { id: 11, name: "경비·청소", icon: ShieldCheck },
  { id: 12, name: "이용·숙박·여행·오락·스포츠", icon: Mountain },
  { id: 13, name: "음식서비스", icon: Utensils },
  { id: 14, name: "건설", icon: Factory },
  { id: 15, name: "기계", icon: Settings },
  { id: 16, name: "재료", icon: Package },
  { id: 17, name: "화학·바이오", icon: FlaskConical },
  { id: 18, name: "섬유·의복", icon: Shirt },
  { id: 19, name: "전기·전자", icon: Zap },
  { id: 20, name: "정보통신", icon: Cpu },
  { id: 21, name: "식품가공", icon: Database },
  { id: 22, name: "인쇄·목재·가구·공예", icon: Hammer },
  { id: 23, name: "환경·에너지·안전", icon: Leaf },
  { id: 24, name: "농림어업", icon: Flower2 },
];

/** =========================
 * 2) 중분류 매핑
 * ========================= */
const midCategoryMap = {
  1: ["사업관리"],
  2: ["기획사무", "총무·인사", "재무·회계", "생산관리"],
  3: ["금융", "보험"],
  4: ["교육", "자연·사회과학"],
  5: ["법률", "경찰·소방·교도·국방"],
  6: ["보건", "의료"],
  7: ["사회복지", "종교"],
  8: ["문화·예술", "디자인", "방송"],
  9: ["철도운송", "육상운송", "수상운송", "항공운송"],
  10: ["영업", "부동산", "유통"],
  11: ["경비", "청소"],
  12: ["이용·미용", "숙박·여행·오락", "스포츠"],
  13: ["음식서비스"],
  14: [
    "건설공사관리",
    "토목",
    "건축",
    "플랜트",
    "국토개발",
    "해양자원",
    "건설기계운전",
    "건설기계정비",
  ],
  15: [
    "기계설계",
    "기계조립·관리",
    "금형",
    "금속가공",
    "기계장치설치",
    "자동차",
    "철도차량",
    "조선",
    "항공",
    "금속·재료",
    "기초기계",
  ],
  16: ["금속재료", "비금속재료"],
  17: [
    "화학물질관리",
    "화학공정운영",
    "정밀화학제품제조",
    "플라스틱제품제조",
    "바이오",
  ],
  18: ["섬유생산", "의복제조", "패션"],
  19: ["전기", "전자", "전자기기제조"],
  20: ["정보기술", "통신기술", "방송기술"],
  21: ["식품가공", "제과·제빵·떡제조"],
  22: ["인쇄", "목재·가구", "공예"],
  23: ["환경", "에너지·자원", "산업안전", "소방방재", "가스", "비파괴검사"],
  24: ["농업", "축산", "임업", "어업"],
};

/** =========================
 * 3) 소분류 데이터 (추가됨)
 * ========================= */
const smallCategoryMap = {
  "2-기획사무": [
    { id: 1, title: "영상 1", duration: "5:30" },
    { id: 2, title: "영상 2", duration: "6:10" },
    { id: 3, title: "영상 3", duration: "8:30" },
    { id: 4, title: "영상 4", duration: "10:10" },
    { id: 5, title: "영상 5", duration: "20:30" },
    { id: 6, title: "영상 6", duration: "17:10" },
  ],
};

export default function CCatList() {
  const navigate = useNavigate();
  const [selectedBigId, setSelectedBigId] = useState(null);

  // ✅ 추가된 state
  const [selectedMidName, setSelectedMidName] = useState(null);

  const selectedBig = useMemo(() => {
    if (selectedBigId == null) return null;
    return bigCategories.find((c) => c.id === selectedBigId) || null;
  }, [selectedBigId]);

  const midCategories = useMemo(() => {
    if (selectedBigId == null) return [];
    return midCategoryMap[selectedBigId] || [];
  }, [selectedBigId]);

  // ✅ 추가된 소분류 계산
  const smallCategories = useMemo(() => {
    if (!selectedBigId || !selectedMidName) return [];
    return smallCategoryMap[`${selectedBigId}-${selectedMidName}`] || [];
  }, [selectedBigId, selectedMidName]);

  return (
      <div className="counselor-category-page">

        {/* 1) 대분류 */}
        {selectedBigId == null && (
          <>
            <h2 className="page-title">카테고리 선택</h2>
            <div className="category-grid">
              {bigCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className="category-card category-card-btn"
                    onClick={() => {
                      setSelectedBigId(cat.id);
                      setSelectedMidName(null); // 초기화 추가
                    }}
                  >
                    <Icon className="category-icon" />
                    <div className="category-text">
                      {String(cat.id).padStart(2, "0")}. {cat.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 2) 중분류 */}
        {selectedBigId != null && selectedMidName == null && (
          <>
            <div className="page-header-row">
              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setSelectedBigId(null);
                  setSelectedMidName(null);
                }}
              >
                <ArrowLeft size={18} />
                대분류로
              </button>

              <h2 className="page-title">
                {String(selectedBig.id).padStart(2, "0")}. {selectedBig.name}
              </h2>
            </div>

            <div className="mid-grid">
              {midCategories.map((midName, idx) => (
                <button
                  key={`${selectedBigId}-${midName}-${idx}`}
                  className="mid-card"
                  onClick={() => setSelectedMidName(midName)} // ✅ 추가
                >
                  {midName}
                </button>
              ))}
            </div>
          </>
        )}

        {/* 3) 소분류 (추가됨) */}
        {selectedMidName != null && (
          <>
            <div className="page-header-row">
              <button
                type="button"
                className="back-btn"
                onClick={() => setSelectedMidName(null)}
              >
                <ArrowLeft size={18} />
                중분류로
              </button>

              <h2 className="page-title"> {String(selectedBig.id).padStart(2, "0")}. {selectedBig.name} &gt; {selectedMidName} </h2>
            </div>

            {/* ⭐ 카드 영역만 감싸기 */}
            <div className="content-fixed-box">
            <div className="small-grid">
                {smallCategories.map((item) => (
                <div key={item.id} className="video-card">
                    <div className="card-info">
                    <h4>{item.title}</h4>
                    <p>재생시간: {item.duration}</p>
                    </div>
                </div>
                ))}
            </div>
            </div>

            {/* ⭐ 버튼은 박스 밖 */}
            <div className="add-btn-wrapper outside">
            <button
                className="add-btn"
                onClick={() => navigate("/counselor/category/write")}
            >
                추가
            </button>
            </div>
          </>
        )}

      </div>
  );
}