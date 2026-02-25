import { useEffect, useMemo, useRef, useState } from "react";
import "../../css/counselor_css/CStudentList.css";

const mockStudents = [
  {
    id: "1",
    name: "김민준",
    studentId: "S2024011",
    tel: "010-1234-5678",
    email: "minjun@example.com",
    tag: "이공계 진로 희망",
    consultations: [
      {
        id: "1-1",
        title: "진로 상담 - 대학 진학 고민",
        description: "이공계 VS 예체능계 진로 선택 고민",
        date: "2026-02-16",
        unread: 2,
        details: [
          "알림 1 : 000000000000000000000000",
          "알림 2 : 000000000000000000000000",
        ],
      },
      {
        id: "1-2",
        title: "가정사 상담",
        description: "가정 불화로 인한 스트레스",
        date: "2026-01-18",
        unread: 2,
        details: ["알림 1 : 111111111111111111111111"],
      },
    ],
  },
  {
    id: "2",
    name: "이시영",
    studentId: "S2024012",
    tel: "010-6789-1234",
    email: "siyeong@example.com",
    tag: "이공계 진로 희망",
    consultations: [
      {
        id: "2-1",
        title: "학업 상담",
        description: "수학 성적 향상 방법",
        date: "2026-02-10",
        unread: 1,
        details: ["알림 1 : abcdefghijklmnopqrstuvwxyz"],
      },
    ],
  },
];

function sumUnread(list = []) {
  return list.reduce((acc, c) => acc + (c.unread || 0), 0);
}

export default function CStudentList() {
  const dialogRef = useRef(null);

  const [students, setStudents] = useState(mockStudents);
  const [search, setSearch] = useState("");

  // 🔥 모달 상태는 id 기반
  const [modal, setModal] = useState({
    isOpen: false,
    mode: "list", // list | detail
    studentId: null,
    consultationId: null,
  });

  /* =========================
     현재 선택 데이터 (항상 최신 students에서 찾음)
  ========================= */

  const currentStudent = students.find(
    (s) => s.id === modal.studentId
  );

  const currentConsultation =
    currentStudent?.consultations.find(
      (c) => c.id === modal.consultationId
    );

  /* ========================= */

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
    );
  }, [search, students]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (modal.isOpen) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [modal.isOpen]);

  /* =========================
     핸들러
  ========================= */

  const openStudentModal = (student) => {
    setModal({
      isOpen: true,
      mode: "list",
      studentId: student.id,
      consultationId: null,
    });
  };

  const openDetail = (consultation) => {
    // 🔥 unread 0 처리
    setStudents((prev) =>
      prev.map((s) =>
        s.id === modal.studentId
          ? {
              ...s,
              consultations: s.consultations.map((c) =>
                c.id === consultation.id
                  ? { ...c, unread: 0 }
                  : c
              ),
            }
          : s
      )
    );

    setModal((prev) => ({
      ...prev,
      mode: "detail",
      consultationId: consultation.id,
    }));
  };

  const goBack = () => {
    setModal((prev) => ({
      ...prev,
      mode: "list",
      consultationId: null,
    }));
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      mode: "list",
      studentId: null,
      consultationId: null,
    });
  };

  /* ========================= */

  return (
    <div>
      <div className="student-top">
        <h2 className="content-title">학생목록</h2>
        <input
          type="text"
          className="student-search"
          placeholder="학생 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="student-list">
        {filteredStudents.map((student) => {
          const unreadTotal = sumUnread(student.consultations);

          return (
            <div
              key={student.id}
              className="student-card"
              onClick={() => openStudentModal(student)}
            >
              <div>
                <div className="name-row">
                  <span className="student-name">{student.name}</span>
                  <span className="student-id">{student.studentId}</span>
                </div>

                <div className="info-row">
                  <span>tel: {student.tel}</span>
                  <span>email: {student.email}</span>
                </div>

                <div className="student-tag">{student.tag}</div>
              </div>

              {unreadTotal > 0 && (
                <div className="student-badge">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== 단일 dialog ===== */}
      <dialog
        ref={dialogRef}
        className="consult-dialog"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        {currentStudent && (
          <div className="consult-dialog-inner">

            {/* ===== LIST 화면 ===== */}
            {modal.mode === "list" && (
              <>
                <div className="consult-dialog-header">
                  <button className="consult-back" onClick={closeModal}>
                    ← 이전으로
                  </button>
                </div>

                <h2 className="consult-title-center">
                  {currentStudent.name} 상담 기록 (
                  {currentStudent.consultations.length}회)
                </h2>

                <div className="consult-list">
                  {currentStudent.consultations.map((c) => (
                    <div
                      key={c.id}
                      className="consult-card"
                      onClick={() => openDetail(c)}
                    >
                      <div className="consult-card-left">
                        <div className="consult-card-title-row">
                          <div className="consult-card-title">
                            {c.title}
                          </div>

                          {c.unread > 0 && (
                            <div className="consult-badge">
                              {c.unread > 99 ? "99+" : c.unread}
                            </div>
                          )}
                        </div>

                        <div className="consult-card-desc">
                          {c.description}
                        </div>
                      </div>

                      <div className="consult-card-date">
                        {c.date}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ===== DETAIL 화면 ===== */}
            {modal.mode === "detail" && currentConsultation && (
              <>
                <div className="consult-dialog-header">
                  <button className="consult-back" onClick={goBack}>
                    ← 이전으로
                  </button>
                </div>

                <h2 className="consult-title-center">
                  {currentConsultation.title}
                </h2>

                <div className="consult-card">
                  <div className="consult-card-left">
                    <div>{currentConsultation.description}</div>

                    <div style={{ marginTop: 20 }}>
                      {currentConsultation.details?.map((d, i) => (
                        <div key={i}>{d}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </dialog>
    </div>
  );
}