'use client';

import { useRef, useState } from 'react';
import { demoMemberTask } from '@/lib/demo-data';

export default function MemberTaskClient({ initialTask = demoMemberTask }: { initialTask?: typeof demoMemberTask }) {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const memberTask = initialTask;
  const { task } = memberTask;

  async function submitWork() {
    const file = fileRef.current?.files?.[0];
    if (!content.trim() && !file) return;
    setStatus('submitting');
    setMessage('');
    const body = new FormData();
    body.set('content', content);
    if (file) body.set('file', file);
    try {
      const response = await fetch(`/api/member/${memberTask.token}/submit`, { method: 'POST', body });
      const result = await response.json() as { ok?: boolean; message?: string; review?: { summary?: string } };
      if (!response.ok) throw new Error(result.message ?? '提交失败');
      setStatus('success');
      setMessage(result.review?.summary ?? '已收到你的提交，预审结果已保存。');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '提交失败，请稍后重试。');
    }
  }

  return (
    <main className="member-page">
      <header className="member-header"><a className="brand member-brand" href="#"><span className="brand-mark">F</span><span>FreeLeader</span></a><span className="secure-note">专属任务链接</span></header>
      <div className="member-wrap">
        <section className="member-intro"><p className="eyebrow">{memberTask.course}</p><h1>你好，{memberTask.memberName}</h1><p>这页只展示你的任务、提交版本和反馈。其他成员无法通过自己的链接看到你的原文。</p></section>

        <section className="member-card task-detail-card">
          <div className="member-card-head"><div><span className="step-label">你的任务</span><h2>{task.title}</h2></div><span className="deadline-badge">9 月 1 日 22:00 前</span></div>
          <div className="member-objective"><span>为什么要做这项任务</span><p>{task.objective}</p><small>对应总稿：{task.outlineSectionIds.join('、')}</small></div>
          <div className="output-callout"><span>需要交什么</span><strong>{task.expectedOutput}</strong></div>
          <h3>建议按这个顺序完成</h3>
          <ol className="member-work-steps">{task.workSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol>
          <div className="member-inputs"><h3>开始前准备好</h3><div>{task.dataChecklist.map((item) => <span key={item}>{item}</span>)}</div></div>
          <h3>建议文稿结构</h3>
          <div className="member-output-structure">{task.outputStructure.map((item, index) => <span key={item}>{index + 1}. {item}</span>)}</div>
          <h3>做到这些，就算完成</h3>
          <ul className="criteria-list">{task.acceptanceCriteria.map((criterion, index) => <li key={criterion}><span>{index + 1}</span><p>{criterion}</p></li>)}</ul>
          <div className="leader-note"><span>组长补充</span><p>{memberTask.leaderNote}</p></div>
        </section>

        <section className="member-card submission-card">
          <div className="member-card-head"><div><span className="step-label">提交区</span><h2>上传本次版本</h2></div><span className="version-label">下一版 · V3</span></div>
          <label className="textarea-label"><span>粘贴正文（可选）</span><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="可以直接粘贴正文，也可以只上传 Word / PDF 文件……" /></label>
          <input ref={fileRef} className="visually-hidden" type="file" accept=".doc,.docx,.pdf,.txt,.md" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} />
          <button className="upload-zone" type="button" onClick={() => fileRef.current?.click()}><span className="upload-icon">↑</span><strong>{fileName || '选择 Word、PDF 或文本文件'}</strong><small>{fileName ? '点击可重新选择' : '单个文件不超过 10 MB'}</small></button>
          <button className="primary-button full-button member-submit" disabled={status === 'submitting' || (!content.trim() && !fileName)} onClick={submitWork}>{status === 'submitting' ? '正在提交与预审…' : '提交这一版'}</button>
          {message && <div className={`submit-message ${status}`} role="status"><strong>{status === 'success' ? '提交成功' : '暂时没有提交成功'}</strong><p>{message}</p></div>}
          <p className="privacy-line">你的原文会保留为独立版本；AI 只依据任务标准给出建议，不会静默改写。</p>
        </section>

        <section className="member-card review-preview">
          <div><span className="step-label">最近一次反馈</span><h2>{memberTask.latestReview.score ? '查看预审结果' : '等待第一次提交'}</h2><p>{memberTask.latestReview.summary}</p></div><div className="score-badge"><strong>{memberTask.latestReview.score}</strong><small>/ 100</small></div><a href="#">具体证据会在每次提交后保存在版本记录中 <span>→</span></a>
        </section>
      </div>
      <nav className="member-bottom-nav" aria-label="成员页面导航"><a className="active" href="#">任务</a><a href="#">提交</a><a href="#">反馈</a></nav>
    </main>
  );
}
