import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, LoaderCircle, RefreshCw, Save, Sparkles, X } from 'lucide-react';
import api from '../../services/app';
import '../../css/counselor_css/CPreparation.css';

export default function CPreparation() {
  const { clientId, counselingId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [content, setContent] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [busy, setBusy] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const promptDialogRef = useRef(null);
  const endpoint = `/counselor/preparation/${counselingId}`;
  const dirty = record && JSON.stringify(content) !== JSON.stringify(record.content);
  const confirmed = record?.status === 'confirmed';

  const apply = (data) => { setRecord(data); setContent(data?.content ?? null); };

  useEffect(() => {
    let active = true;
    api.get(endpoint).then(({ data }) => {
      if (!active) return;
      setStudentName(data.student_name);
      apply(data.data);
    }).catch((err) => {
      if (active) setError(err.response?.data?.detail || '상담 준비를 불러오지 못했습니다.');
    }).finally(() => { if (active) setBusy(''); });
    return () => { active = false; };
  }, [endpoint]);

  useEffect(() => {
    const dialog = promptDialogRef.current;
    if (promptOpen && !dialog.open) dialog.showModal();
    if (!promptOpen && dialog.open) dialog.close();
  }, [promptOpen]);

  const execute = async (action) => {
    setBusy(action); setError(''); setNotice('');
    try {
      const response = action === 'generate'
        ? await api.post(`${endpoint}/generate`, { additional_prompt: additionalPrompt.trim() }, { timeout: 370000 })
        : action === 'save'
          ? await api.put(endpoint, { revision: record.revision, content })
          : await api.post(`${endpoint}/confirm`, { revision: record.revision });
      apply(response.data.data);
      if (action === 'generate') setPromptOpen(false);
      setNotice(action === 'confirm' ? '상담 준비가 확정되었습니다.' : action === 'save' ? '수정 내용을 저장했습니다.' : '상담 준비 초안이 생성되었습니다.');
    } catch (err) {
      setError(err.response?.data?.detail || '요청을 처리하지 못했습니다. 다시 시도해 주세요.');
    } finally { setBusy(''); }
  };
  const updateQuestion = (index, value) => setContent((previous) => ({
    ...previous, questions: previous.questions.map((question, i) => i === index ? { ...question, question: value } : question),
  }));
  const sources = (ids) => ids.map((id) => record.evidence.find((e) => e.id === id)?.title || id).join(', ');

  return <main className="preparation-page">
    <header className="preparation-header">
      <div>
        <button className="prep-back" title="학생 목록으로" aria-label="학생 목록으로" onClick={() => navigate('/counselor/students')}><ArrowLeft size={18} /></button>
        <h2>상담 준비{studentName && ` · ${studentName}`}</h2>
        {record && <span className="prep-status">{confirmed ? '확정' : dirty ? '수정 중' : '검토 대기'}</span>}
      </div>
      <button className="prep-command" disabled={!!busy || confirmed || (!!error && !studentName)} onClick={() => { setError(''); setPromptOpen(true); }}>
        {busy === 'generate' ? <LoaderCircle size={17} className="prep-spinner" /> : record ? <RefreshCw size={17} /> : <Sparkles size={17} />}
        {busy === 'generate' ? '준비 중' : record ? '다시 생성' : '상담 준비 생성'}
      </button>
    </header>
    <dialog ref={promptDialogRef} className="prep-prompt-dialog" aria-labelledby="prep-prompt-title" onCancel={(event) => { event.preventDefault(); if (!busy) setPromptOpen(false); }}>
      <form onSubmit={(event) => { event.preventDefault(); if (!busy) execute('generate'); }}>
        <div className="prep-prompt-header">
          <h3 id="prep-prompt-title">{record ? '상담 준비 다시 생성' : '상담 준비 생성'}</h3>
          <button type="button" className="prep-back" aria-label="닫기" title="닫기" disabled={!!busy} onClick={() => setPromptOpen(false)}><X size={20} /></button>
        </div>
        <label htmlFor="prep-additional-prompt">추가 요청 (선택)</label>
        <textarea id="prep-additional-prompt" autoFocus maxLength={2000} value={additionalPrompt} disabled={!!busy} placeholder="개발 관련 탐색 영상을 찾아주고, 확인 질문에 반영해 주세요." onChange={(event) => setAdditionalPrompt(event.target.value)} />
        <div className="prep-prompt-count">{additionalPrompt.length} / 2000</div>
        {record && <p className="prep-prompt-warning">{dirty ? '저장하지 않은 수정 내용과 기존 초안이 새 결과로 바뀝니다.' : '기존 초안이 새 결과로 바뀝니다.'}</p>}
        {error && <p className="prep-error" role="alert">{error}</p>}
        <div className="prep-prompt-actions">
          <button type="button" className="prep-command" disabled={!!busy} onClick={() => setPromptOpen(false)}>취소</button>
          <button type="submit" className="prep-command prep-primary" disabled={!!busy}>{busy === 'generate' ? <LoaderCircle size={17} className="prep-spinner" /> : <Sparkles size={17} />}{busy === 'generate' ? '생성 중' : '생성 실행'}</button>
        </div>
      </form>
    </dialog>
    {error && !promptOpen && <p className="prep-error" role="alert">{error}</p>}
    {notice && <p className="prep-notice" role="status">{notice}</p>}
    {busy === 'loading' && <div className="prep-empty"><LoaderCircle className="prep-spinner" size={22} aria-label="불러오는 중" /></div>}
    {!busy && !record && !error && <p className="prep-empty">아직 생성된 상담 준비가 없습니다.</p>}
    {content && <>
      <section className="prep-section"><h3>상담 요약</h3>
        <textarea aria-label="상담 요약" maxLength={3000} value={content.summary} disabled={confirmed || !!busy} onChange={(e) => setContent({ ...content, summary: e.target.value })} />
      </section>
      <div className="prep-columns">
        <section className="prep-section"><h3>확인할 질문</h3>
          <ol className="prep-questions">{content.questions.map((question, index) => <li key={index}>
            <label htmlFor={`prep-question-${index}`}>질문 {index + 1}</label>
            <textarea id={`prep-question-${index}`} maxLength={500} disabled={confirmed || !!busy} value={question.question} onChange={(e) => updateQuestion(index, e.target.value)} />
            <p>{question.rationale}</p><small>{question.source_ids.length ? `근거: ${sources(question.source_ids)}` : '추가 확인 질문'}</small>
          </li>)}</ol>
        </section>
        <aside>
          <section className="prep-section"><h3>확인할 차이</h3>{content.observations.length ? content.observations.map((item, i) => <div className="prep-observation" key={i}><p>{item.statement}</p><small>{sources(item.source_ids)}</small></div>) : <p>현재 자료에서 확인된 차이가 없습니다.</p>}</section>
          <section className="prep-section"><h3>추가로 필요한 정보</h3><ul>{content.gaps.map((gap, i) => <li key={i}>{gap}</li>)}</ul>{!content.gaps.length && <p>없음</p>}</section>
          <section className="prep-section"><h3>탐색 영상</h3>
            {content.suggested_youtube_video ? <div className="prep-youtube-result">
              <a href={content.suggested_youtube_video.url} target="_blank" rel="noopener noreferrer">{content.suggested_youtube_video.title}<ExternalLink size={15} aria-label="새 탭에서 열기" /></a>
              <small>{content.suggested_youtube_video.channel} · YouTube</small>
            </div> : <><ul>{content.suggested_video_ids.map((id) => <li key={id}>{sources([`category:${id}`])}</li>)}</ul>{!content.suggested_video_ids.length && <p>추가 탐색 영상 없음</p>}</>}
          </section>
          <section className="prep-section"><h3>조회 근거</h3>{record.evidence.map((source) => <details key={source.id}><summary>{source.title}</summary><p>{source.detail}</p></details>)}</section>
          <section className="prep-section"><h3>조회 기록</h3><ul>{record.tool_trace.map((item, i) => <li key={i}>{item.tool === 'search_youtube_videos' ? `유튜브 영상 검색: ${item.query}` : item.tool === 'search_career_videos' ? `등록 영상 검색${item.query ? `: ${item.query}` : ''}` : '이전 상담 기록 조회'}</li>)}</ul>{!record.tool_trace.length && <p>{record.evidence.length ? '현재 분석 자료로 작성됨' : '조회 자료 없음'}</p>}</section>
        </aside>
      </div>
      <footer className="prep-actions">
        <button className="prep-command" onClick={() => navigate(`/counselor/report/counseling/${clientId}/${counselingId}`)}>상담 기록</button>
        {!confirmed && <>
          <button className="prep-command" disabled={!!busy || !dirty || !content.summary.trim() || content.questions.some((q) => !q.question.trim())} onClick={() => execute('save')}><Save size={17} />수정 저장</button>
          <button className="prep-command prep-primary" disabled={!!busy || !!dirty} onClick={() => execute('confirm')}><Check size={17} />검토 확정</button>
        </>}
      </footer>
    </>}
  </main>;
}
