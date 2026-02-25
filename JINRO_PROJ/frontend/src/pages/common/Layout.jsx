import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

import '../../css/common_css/base.css'; 

function Layout({ children }) {
  return (
    <div className="layout-container">
      <Header />
      
      <div className="content-wrapper">
        <Sidebar />
        {/* 메인 콘텐츠 영역과 푸터를 수직으로 배치하기 위해 div로 감쌉니다 */}
        <div className="main-container">
          <main className="content-area">
            {children}
          </main>
          {/* 2. 푸터 배치 */}
        </div>
      </div>
          <Footer />
    </div>
  );
}

export default Layout;