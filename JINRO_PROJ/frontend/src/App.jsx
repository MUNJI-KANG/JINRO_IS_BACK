import { BrowserRouter, Routes, Route } from "react-router-dom";

// common
import Header from "./pages/common/Header";
import Footer from "./pages/common/Footer";
import Home from "./pages/common/Home";
import Layout from "./pages/common/Layout";
import Sidebar from "./pages/common/Sidebar";
import PageTransition from "./pages/common/PageTransition";

// // counselor
import CLogin from "./pages/counselor/CLogin";
import CInfoEdit from "./pages/counselor/CInfoEdit";
import CScheduler from "./pages/counselor/CScheduler";
import CStudentList from "./pages/counselor/CStudentList";

import CCatList from "./pages/counselor/c_category/CCatList";
import CCatWrite from "./pages/counselor/c_category/CCatWrite";

import CCounseling from "./pages/counselor/c_report/CCounseling";
import CCounselingAI from "./pages/counselor/c_report/CCounselingAI";
import CFinal from "./pages/counselor/c_report/CFinal";
import CVideoAI from "./pages/counselor/c_report/CVideoAI";
import CReportVoice from "./pages/counselor/c_report/CReportVoice";

// // student
import SAgreement from "./pages/student/SAgreement";
import SComplete from "./pages/student/SComplete";
import SLoading from "./pages/student/SLoading";
import SLogin from "./pages/student/SLogin";
import SSurvey from "./pages/student/SSurvey";
import SVideo from "./pages/student/SVideo";

import SBigCat from "./pages/student/s_category/SBigCat";
import SCheckout from "./pages/student/s_category/SCheckout";
import SMedCat from "./pages/student/s_category/SMedCat";
import SSmallCat from "./pages/student/s_category/SSmallCat";

import STest from "./pages/student/STest"
import STest2 from "./pages/student/STest_copy"

import { useEffect, useState } from "react";
import GlobalOnboarding from "./pages/student/s_onboarding/GlobalOnboardingEngine.jsx";
import "./css/student_css/s_onboarding/GlobalOnboarding.css";


function App() {

  const [globalOnboarding, setGlobalOnboarding] = useState(false);

  useEffect(() => {
    if (window.location.pathname === "/") {
      localStorage.removeItem("student_onboarding_flow");
      localStorage.removeItem("skip_all_onboarding");
    }
  }, []);

  const startGlobalOnboarding = () => {
    localStorage.setItem("student_onboarding_flow", "true");
    localStorage.removeItem("visited");
    localStorage.removeItem("videoStarted");
    setGlobalOnboarding(true);
  };

  const finishGlobalOnboarding = () => {
    localStorage.removeItem("student_onboarding_flow");
    setGlobalOnboarding(false);
  };

  const withTransition = (element) => <PageTransition>{element}</PageTransition>;


  return (
    <BrowserRouter>
      {globalOnboarding && (
        <GlobalOnboarding
          onFinish={finishGlobalOnboarding}
        />
      )}


      <Routes>

        {/* counselor 로그인 (레이아웃 없이) */}
        <Route path="/counselor/login" element={withTransition(<CLogin />)} />


        {/* 공통 레이아웃 */}
       <Route
          index
          element={
            withTransition(<Home startOnboarding={startGlobalOnboarding} />)
          }
        />
        <Route path="/" element={<Layout />}>
          {/* 로그인 후 진입시 바로 scheduler 화면 보여줌 */}
          <Route path="counselor/scheduler" element={withTransition(<CScheduler />)} />
          <Route path="counselor/students" element={withTransition(<CStudentList />)} />
          <Route path="counselor/info" element={withTransition(<CInfoEdit />)} />
          <Route path="counselor/category/list" element={withTransition(<CCatList />)} />
          <Route path="counselor/category/write" element={withTransition(<CCatWrite />)} />

          <Route path="counselor/report/counseling/:clientId/:counselingId" element={withTransition(<CCounseling />)} />
          <Route path="counselor/report/video/:clientId/:counselingId" element={withTransition(<CCounselingAI />)} />
          <Route path="/counselor/report/final/:clientId/:counselingId" element={withTransition(<CFinal />)} />
          <Route path="counselor/report/voice/:clientId/:counselingId" element={withTransition(<CReportVoice />)} />
        </Route>

        {/* <Route index element={<Home />} /> */}

        {/* counselor */}

        {/* student */}
        <Route path="/student/login" element={withTransition(<SLogin />)} />
        <Route path="/student/agreement" element={withTransition(<SAgreement />)} />


        <Route path="/student/survey/:categoryId" element={withTransition(<SSurvey />)} />
        <Route path="/student/video/:categoryId" element={withTransition(<SVideo />)} />
        <Route path="/student/loading" element={withTransition(<SLoading />)} />
        <Route path="/student/complete" element={withTransition(<SComplete />)} />

        <Route path="/student/category/big" element={withTransition(<SBigCat />)} />
        <Route path="/student/category/checkout" element={withTransition(<SCheckout />)} />
        <Route path="/student/category/medium" element={withTransition(<SMedCat />)} />
        <Route path="/student/category/small" element={withTransition(<SSmallCat />)} />

        <Route path="/student/test" element={withTransition(<STest />)} />
        <Route path="/student/test_copy" element={withTransition(<STest2 />)} />


      </Routes>
    </BrowserRouter>

  );
}

export default App;
