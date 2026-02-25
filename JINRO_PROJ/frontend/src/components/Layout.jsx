import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        {/* 아래 children 자리에 Schedule 페이지가 들어갑니다 */}
        <main>{children}</main>
      </div>
    </div>
  );
}

export default Layout;