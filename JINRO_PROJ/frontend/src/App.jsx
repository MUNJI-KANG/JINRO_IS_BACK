import { BrowserRouter, Routes, Route } from "react-router-dom";


// common
import Header from "./pages/common/Header";
// import Footer from "./pages/common/Footer";
// import Home from "./pages/common/Home";
import Layout from "./pages/common/Layout";
import Sidebar from "./pages/common/Sidebar";

// // counselor
// import CLogin from "./pages/counselor/CLogin";
// import CInfoEdit from "./pages/counselor/CInfoEdit";
// import CScheduler from "./pages/counselor/CScheduler";
// import CStudentList from "./pages/counselor/CStudentList";

// import CCatDetail from "./pages/counselor/c_category/CCatDetail";
// import CCatList from "./pages/counselor/c_category/CCatList";
// import CCatWrite from "./pages/counselor/c_category/CCatWrite";

// import CCounseling from "./pages/counselor/c_report/CCounseling";
// import CCounselingAI from "./pages/counselor/c_report/CCounselingAI";
// import CFinal from "./pages/counselor/c_report/CFinal";
// import CVideoAI from "./pages/counselor/c_report/CVideoAI";

// // student
// import SAgreement from "./pages/student/SAgreement";
// import SComplete from "./pages/student/SComplete";
// import SLoading from "./pages/student/SLoading";
// import SLogin from "./pages/student/SLogin";
// import SSurvey from "./pages/student/SSurvey";
// import SVideo from "./pages/student/SVideo";

// import SBigCat from "./pages/student/s_category/SBigCat";
// import SCheckout from "./pages/student/s_category/SCheckout";
// import SMedCat from "./pages/student/s_category/SMedCat";
// import SSmallCat from "./pages/student/s_category/SSmallCat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공통 레이아웃 */}
        <Route path="/" element={<Layout />} />
          {/* <Route index element={<Home />} /> */}
          {/* <Route path="/counselor/scheduler" element={<CScheduler />} /> */}
          {/* <Route path="/counselor/students" element={<CStudentList />} /> */}
          {/* <Route path="/counselor/info" element={<CInfoEdit />} /> */}
          {/* <Route path="/counselor/category/list" element={<CCatList />} /> */}
          {/* <Route path="/counselor/category/write" element={<CCatWrite />} /> */}
        {/* </Route> */}

        {/* counselor */}
        {/* <Route path="/counselor/login" element={<CLogin />} /> */}
        {/* <Route path="/counselor/report/counseling" element={<CCounseling />} /> */}
        {/* <Route path="/counselor/report/ai" element={<CCounselingAI />} /> */}
        {/* <Route path="/counselor/report/final" element={<CFinal />} /> */}
        {/* <Route path="/counselor/report/video" element={<CVideoAI />} /> */}

        {/* student */}
        {/* <Route path="/student/login" element={<SLogin />} /> */}
        {/* <Route path="/student/survey" element={<SSurvey />} /> */}
        {/* <Route path="/student/video" element={<SVideo />} /> */}
        {/* <Route path="/student/agreement" element={<SAgreement />} /> */}
        {/* <Route path="/student/complete" element={<SComplete />} /> */}
        {/* <Route path="/student/loading" element={<SLoading />} /> */}

        {/* <Route path="/student/category/big" element={<SBigCat />} /> */}
        {/* <Route path="/student/category/checkout" element={<SCheckout />} /> */}
        {/* <Route path="/student/category/medium" element={<SMedCat />} /> */}
        {/* <Route path="/student/category/small" element={<SSmallCat />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;