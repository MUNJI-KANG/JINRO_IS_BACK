import { Navigate, Outlet } from "react-router-dom";

function PrivateRoute() {

  const clientId = localStorage.getItem("client_id");

  if (!clientId) {
    alert("정보를 먼저 입력하세요.");
    return <Navigate to="/student/login" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;