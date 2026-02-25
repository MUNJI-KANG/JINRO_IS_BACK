import { useState } from "react";
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
  const today = getLocalYYYYMMDD();
  const [selectedDate, setSelectedDate] = useState(today);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
  };

  return (
    <div className="scheduler-container">
      <div className="calendar-section">
        <h3>상담 캘린더</h3>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={today}
          dateClick={handleDateClick}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          dayCellClassNames={(arg) =>
            arg.dateStr === selectedDate ? ["selected-day"] : []
          }
          dayCellContent={(arg) => {
            const isToday = arg.dateStr === today;
            return (
              <div className="day-cell">
                <span className="day-number">{arg.dayNumberText}</span>
                {isToday && <span className="today-label">TODAY</span>}
              </div>
            );
          }}
        />
      </div>

      <div className="list-section">
        <div className="list-header">
          <h3>{selectedDate} 상담 일정</h3>
          <button
            className="add-btn"
            onClick={() => alert("일정 추가 페이지 또는 모달 연결")}
          >
            일정 추가
          </button>
        </div>

        <div className="empty-box">등록된 일정이 없습니다.</div>
      </div>
    </div>
  );
}

export default CScheduler;