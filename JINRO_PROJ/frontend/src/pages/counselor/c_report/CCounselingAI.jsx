import { useState, useEffect } from 'react';
import ReportAi from "../../../component/ReportAi";

const CCounselingAI = () => {
    return (
        <ReportAi 
            pageTitle="상담영상 분석 리포트" 
            studentName="김민준" 
            apiUrl="http://localhost:8000/counselor/report/ai"
        />
        
    );
};

export default CCounselingAI;