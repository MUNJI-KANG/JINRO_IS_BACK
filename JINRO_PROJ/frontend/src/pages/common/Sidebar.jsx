import React from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <ul className="sidebar-menu">

        <li className={location.pathname === "/counselor/scheduler" ? "active" : ""}>
          <Link to="/counselor/scheduler">일정관리</Link>
        </li>

        <li>
          카테고리
        </li>

        <li className={location.pathname === "/counselor/students" ? "active" : ""}>
          <Link to="/counselor/students">학생목록</Link>
        </li>

        <li>
          정보수정
        </li>

      </ul>
    </nav>
  );
}

export default Sidebar;