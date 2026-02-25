import { useRef, useState, useEffect } from "react";
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
  const today = getLocalYYYYMMDD();

  const [selectedDate, setSelectedDate] = useState(today);

  // ✅ 초기 today 선택
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    api.gotoDate(today);
    api.select(today);
  }, []);

  const handleDateClick = (info) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    setSelectedDate(info.dateStr);

    api.gotoDate(info.dateStr); // 다른 달 클릭 시 이동
    api.select(info.dateStr);   // 선택 고정
  };

  const handleDatesSet = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    api.select(selectedDate); // 월 이동 후에도 선택 유지
  };

  return (
    <div className="scheduler-container">
      <div className="calendar-section">
        <h3>상담 캘린더</h3>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable={true}
          selectMirror={false}
          initialDate={today}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          height="auto"
          dayCellContent={(arg) => (
            <div className="day-cell">
              <span>{arg.dayNumberText}</span>
              {arg.dateStr === today && (
                <span className="today-label">TODAY</span>
              )}
            </div>
          )}
        />
      </div>

      <div className="list-section">
        <div className="list-header">
          <h3>{selectedDate} 상담 일정</h3>
          <button className="add-btn">
            일정 추가
          </button>
        </div>

        <div className="empty-box">
          등록된 일정이 없습니다.
        </div>
      </div>
    </div>
  );
}

export default CScheduler;