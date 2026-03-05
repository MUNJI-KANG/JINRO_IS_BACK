import ReportAi from "../../../component/ReportAi";

const CVideoAI = () => {
    return (
        <ReportAi 
            pageTitle="시청영상 분석 리포트" 
            studentName="김민준" 
            apiUrl="/counselor/ai-report"
        />
    );
};

export default CVideoAI;