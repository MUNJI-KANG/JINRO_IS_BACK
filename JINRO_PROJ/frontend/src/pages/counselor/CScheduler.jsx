import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../css/counselor_css/CScheduler.css";

function getLocalYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function CScheduler() {
  const calendarRef = useRef(null);
  const dialogRef = useRef(null);

  const today = getLocalYYYYMMDD();

  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState("");
  const [modalStep, setModalStep] = useState("list"); // list | time
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.select(today);
  }, []);

  const handleDateClick = (info) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    setSelectedDate(info.dateStr);
    api.gotoDate(info.dateStr);
    api.unselect();
    api.select(info.dateStr);
  };

  const openModal = () => {
    setModalStep("list");
    setSelectedStudent(null);
    setSelectedTime(null);
    setSearch("");
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const students = [
    { id: 1, name: "김민준", studentNo: "S2024011" },
    { id: 2, name: "이서연", studentNo: "S2024012" },
    { id: 3, name: "박지훈", studentNo: "S2024013" },
  ];

  const dummySchedules = [
    { id: 1, time: "09:00", name: "김민준", type: "진로 상담", status: "완료" },
    { id: 2, time: "10:00", name: "이서연", type: "학업 상담", status: "완료" },
    { id: 3, time: "11:00", name: "박지호", type: "진로 상담", status: "예정" },
    { id: 4, time: "13:00", name: "최유진", type: "학업 상담", status: "예정" },
  ];

  const filteredStudents = students.filter(
    (student) =>
      student.name.includes(search) ||
      student.studentNo.includes(search)
  );

  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  return (
    <div className="scheduler-container">
      <div className="calendar-section">
        <h3>상담 캘린더</h3>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={today}
          selectable={true}
          selectMirror={false}
          unselectAuto={false}
          dateClick={handleDateClick}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
        />
      </div>

      <div className="list-section">
        <div className="list-header">
          <h3>{selectedDate} 상담 일정</h3>
          <button className="add-btn" onClick={openModal}>
            일정 추가
          </button>
        </div>

        {dummySchedules.length === 0 ? (
          <div className="empty-box">등록된 일정이 없습니다.</div>
        ) : (
          <div className="schedule-list">
            {dummySchedules.map((schedule) => (
              <div key={schedule.id} className="schedule-card">
                <div className="schedule-left">
                  <div className="schedule-time">
                    <span className="time-icon">🕒</span> {/* 아이콘(react-icons 등 사용 시 교체) */}
                    <span>{schedule.time}</span>
                  </div>
                  <div className="schedule-info">
                    <span className="schedule-name">{schedule.name}</span>
                    <span className="schedule-type">{schedule.type}</span>
                  </div>
                </div>
                
                {/* 상태에 따라 다른 클래스 적용 (완료: green, 예정: orange) */}
                <div className={`status-badge ${schedule.status === "완료" ? "done" : "planned"}`}>
                  {schedule.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 dialog 모달 */}
      <dialog ref={dialogRef} className="custom-dialog">

        {/* STEP 1 : 학생 선택 */}
        {modalStep === "list" && (
          <>
            <div className="dialog-header">
              <h2>{selectedDate}</h2>
              <button className="dialog-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="학생 검색..."
              className="dialog-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="dialog-body">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="dialog-card selectable"
                  onClick={() => {
                    setSelectedStudent(student);
                    setModalStep("time");
                  }}
                >
                  <strong>{student.name}</strong>
                  <div>{student.studentNo}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 : 시간 선택 */}
        {modalStep === "time" && selectedStudent && (
          <>
            <div className="dialog-header">
              <h2>{selectedDate}</h2>
              <button className="dialog-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="time-student-box">
              <strong>{selectedStudent.name}</strong>
              <span className="student-badge">
                {selectedStudent.studentNo}
              </span>
            </div>

            <div className="time-grid">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  className={`time-btn ${
                    selectedTime === time ? "active" : ""
                  }`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="time-footer">
              <button
                className="back-btn"
                onClick={() => setModalStep("list")}
              >
                뒤로가기
              </button>

              <button
                className="submit-btn"
                disabled={!selectedTime}
                onClick={() => {
                  console.log(
                    "예약:",
                    selectedStudent,
                    selectedTime
                  );
                  closeModal();
                }}
              >
                등록
              </button>
            </div>
          </>
        )}

      </dialog>
    </div>
  );
}

export default CScheduler;