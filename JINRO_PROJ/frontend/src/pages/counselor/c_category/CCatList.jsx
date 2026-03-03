import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  2: ["기획사무", "총무·인사", "재무·회계", "생산·품질관리"],
  3: ["금융", "보험"],
  4: ["학교교육", "평생교육", "직업교육"],
  5: ["법률", "소방방재"],
  6: ["보건", "의료"],
  7: ["사회복지", "상담", "보육"],
  8: ["문화·예술", "디자인", "문화콘텐츠"],
  9: ["자동차운전·운송", "철도운전·운송", "선박운전·운송", "항공운전·운송"],
  10: ["영업", "부동산", "판매"],
  11: ["경비", "청소"],
  12: ["이·미용", "결혼·장례", "관광·레저", "스포츠"],
  13: ["식음료조리·서비스"],
  14: ["건설공사관리","토목","건축","플랜트","조경","도시·교통","건설기계운전·정비","해양자원"],
  15: ["기계설계","기계가공","기계조립·관리","기계품질관리","기계장치설치","자동차","철도차량제작","조선","항공기제작","금형","스마트공장(smart factory)"],
  16: ["금속재료", "세라믹재료"],
  17: ["화학·바이오공통","석유·기초화학물","정밀화학","플라스틱·고무","바이오"],
  18: ["섬유제조", "패션", "의복관리"],
  19: ["전기", "전자기기일반", "전자기기개발"],
  20: ["정보기술", "통신기술", "방송기술"],
  21: ["식품가공", "제과·제빵·떡제조"],
  22: ["인쇄·출판", "공예"],
  23: ["산업환경","환경보건","자연환경","환경서비스","에너지·자원","산업안전보건"],
  24: ["농업", "축산", "임업", "수산"],
};

export default function CCatList() {
  const navigate = useNavigate();
  const [selectedBigId, setSelectedBigId] = useState(null);
  const [selectedMidName, setSelectedMidName] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/counselor/category")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDbCategories(data.data);
        }
      })
      .catch((err) => console.error("카테고리 조회 실패:", err));
  }, []);

  const selectedBig = useMemo(() => {
    if (selectedBigId == null) return null;
    return bigCategories.find((c) => c.id === selectedBigId) || null;
  }, [selectedBigId]);

  const midCategories = useMemo(() => {
    if (selectedBigId == null) return [];
    return midCategoryMap[selectedBigId] || [];
  }, [selectedBigId]);

  const smallCategories = useMemo(() => {
    if (!selectedBigId || !selectedMidName) return [];
    return dbCategories.filter((item) => item.kind === selectedBigId);
  }, [dbCategories, selectedBigId, selectedMidName]);

  return (
    <div className="counselor-category-page">

      {/* 1️⃣ 대분류 */}
      {selectedBigId == null && (
        <>
          <h2 className="page-title">카테고리 선택</h2>
          <div className="category-grid">
            {bigCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className="category-card category-card-btn"
                  onClick={() => {
                    setSelectedBigId(cat.id);
                    setSelectedMidName(null);
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

      {/* 2️⃣ 중분류 */}
      {selectedBigId != null && selectedMidName == null && (
        <>
          <div className="page-header-row">
            <button
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
                key={idx}
                className="mid-card"
                onClick={() => setSelectedMidName(midName)}
              >
                {midName}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 3️⃣ 소분류 (🔥 리스트형으로 변경) */}
      {selectedMidName != null && (
        <>
          <div className="page-header-row">
            <button
              className="back-btn"
              onClick={() => setSelectedMidName(null)}
            >
              <ArrowLeft size={18} />
              중분류로
            </button>

            <h2 className="page-title">
              {String(selectedBig.id).padStart(2, "0")}. {selectedBig.name} &gt; {selectedMidName}
            </h2>
          </div>

          <div className="list-container">
            {smallCategories.length === 0 ? (
              <p>등록된 소분류가 없습니다.</p>
            ) : (
              smallCategories.map((item) => (
                <div key={item.c_id} className="list-item">
                  <div className="list-left">
                    <h4>{item.title}</h4>
                    <p>{item.url}</p>
                  </div>
                  <div className="list-right">
                    <button
                      onClick={() =>
                        navigate(`/counselor/category/detail/${item.c_id}`)
                      }
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="add-btn-wrapper outside">
            <button
              className="add-btn"
              onClick={() =>
                navigate("/counselor/category/write", {
                  state: { kindId: selectedBigId },
                })
              }
            >
              추가
            </button>
          </div>
        </>
      )}
    </div>
  );
}