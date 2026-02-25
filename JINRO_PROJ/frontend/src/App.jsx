import { Routes, Route } from "react-router-dom";
import Agree from "./pages/student/agree";
import Video from "./pages/student/video";

function App() {
  return (
    <Routes>
      {/* 동의서 페이지 */}
      <Route path="/student/agree" element={<Agree />} />

      {/* 영상 시청 페이지 */}
      <Route path="/student/video" element={<Video />} />
    </Routes>
  );
}

export default App;