import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

import "../../css/common_css/base.css";

function Layout() {
  return (
    <div className="layout-container">
      <Header />

      <div className="content-wrapper">
        <Sidebar />

        <div className="main-container">
          <main className="content-area">
            <Outlet /> 
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Layout;