import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/counselor_css/CStudentList.css";
import api from '../../services/app'

function sumUnread(list = []) {
  return list.reduce((acc, c) => acc + (c.unread || 0), 0);
}

export default function CStudentList() {
  const dialogRef = useRef(null);
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    studentId: null,
  });

  /* ===============================
     🔹 학생 목록 DB 조회
  =============================== */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get(
          "/counselor/students"
        );

        const data = await response.data;

        if (data.success) {
          const mappedStudents = data.data.map((s) => ({
            id: s.client_id.toString(),
            name: s.name,
            studentId: s.student_id,
            tel: s.tel,
            email: s.email,
            tag: "상담 기록 존재",
            consultations: [],
          }));

          setStudents(mappedStudents);
        }
      } catch (error) {
        console.error("학생 목록 조회 실패:", error);
      }
    };

    fetchStudents();
  }, []);

  const currentStudent = students.find(
    (s) => s.id === modal.studentId
  );

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

  const openStudentModal = (student) => {
    setModal({
      isOpen: true,
      studentId: student.id,
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      studentId: null,
    });
  };

  const goToFinalReport = (consultation) => {
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

    closeModal();

    navigate("/counselor/report/final");
  };

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

      <dialog
        ref={dialogRef}
        className="consult-dialog"

        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}

        onClose={() => {
          setModal({
            isOpen: false,
            studentId: null,
          });
        }}
      >
        {currentStudent && (
          <div className="consult-dialog-inner">
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
                  onClick={() => goToFinalReport(c)}
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
          </div>
        )}
      </dialog>
    </div>
  );
}