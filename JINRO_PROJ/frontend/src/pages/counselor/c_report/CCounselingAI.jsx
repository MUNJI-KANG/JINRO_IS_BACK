import { useState, useEffect } from 'react';
import ReportAi from "../../../component/ReportAi";

const CCounselingAI = () => {
    return (
        <ReportAi 
            pageTitle="상담영상 분석 리포트" 
            studentName="김민준" 
            apiUrl="/counselor/report/ai"
        />
        
    );
};

export default CCounselingAI;