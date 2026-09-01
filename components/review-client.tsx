'use client';

import { useState } from 'react';
import { demoReview } from '@/lib/demo-data';

const criteriaTone = { pass: 'good', partial: 'warn', fail: 'danger' } as const;
const criteriaLabel = { pass: '通过', partial: '部分满足', fail: '未通过' } as const;

export default function ReviewClient() {
  const [decision, setDecision] = useState('verify');
  const [saved, setSaved] = useState(false);

  return (
    <main className="review-page">
      <header className="review-topbar"><a className="brand compact-brand" href="/dashboard"><span className="brand-mark">F</span><span>FreeLeader</span></a><nav aria-label="面包屑"><a href="/dashboard">工作台</a><span>/</span><strong>质量预审</strong></nav><a className="ghost-button" href="/projects/demo/merge">查看整合稿</a></header>
      <div className="review-layout">
        <aside className="review-side">
          <p className="eyebrow">SUBMISSION REVIEW</p><h1>{demoReview.taskTitle}</h1><div className="review-person"><div className="member-avatar">陈</div><div><strong>{demoReview.memberName}</strong><span>第 {demoReview.version} 版 · 已预审</span></div></div>
          <div className="review-score"><strong>{demoReview.score}</strong><span>/ 100</span><em>需修改</em></div>
          <nav className="review-nav"><a className="active" href="#criteria">验收标准 <span>4</span></a><a href="#flags">风险与冲突 <span>3</span></a><a href="#decision">组长决策 <span>1</span></a></nav>
          <a className="dark-button" href="/dashboard">← 返回工作台</a>
        </aside>

        <section className="review-main">
          <div className="review-title"><div><p className="eyebrow">AI QUALITY GATE</p><h2>反馈必须对应标准，也必须给出证据。</h2><p>这份测试材料同时包含完整重复文件、数字口径冲突和结论强于证据三个典型问题。</p></div><span className="review-status">需修改</span></div>

          <section className="review-section" id="criteria"><div className="section-heading"><span>01</span><div><h3>逐条验收</h3><p>语言不够漂亮不会直接导致退回，关键任务缺失或高风险事实冲突才会。</p></div></div><div className="criteria-grid">{demoReview.criteria.map((item, index) => <article className="criterion-card" key={item.label}><div className="criterion-top"><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><em className={criteriaTone[item.status as keyof typeof criteriaTone]}>{criteriaLabel[item.status as keyof typeof criteriaLabel]}</em></div><p><b>证据</b>{item.evidence}</p></article>)}</div></section>

          <section className="review-section" id="flags"><div className="section-heading"><span>02</span><div><h3>风险与冲突</h3><p>系统只标记影响最终结论的问题，保留原始材料和触发证据。</p></div></div><div className="flag-list">{demoReview.flags.map((flag) => <article className="flag-card" key={flag.title}><span className={`severity ${flag.severity.toLowerCase()}`}>{flag.severity}</span><div><strong>{flag.title}</strong><p>{flag.detail}</p></div></article>)}</div></section>

          <section className="review-section decision-section" id="decision"><div className="section-heading"><span>03</span><div><h3>组长决策</h3><p>高风险数字不会由系统擅自选择。你的决定会进入版本记录。</p></div></div><div className="decision-box"><h4>如何处理固定资产金额冲突？</h4><label className={decision === 'verify' ? 'chosen' : ''}><input type="radio" name="decision" value="verify" checked={decision === 'verify'} onChange={(event) => setDecision(event.target.value)} /><span><strong>标记待核实</strong><small>推荐：回到年报确认单位后再进入整合</small></span></label><label className={decision === 'keep-small' ? 'chosen' : ''}><input type="radio" name="decision" value="keep-small" checked={decision === 'keep-small'} onChange={(event) => setDecision(event.target.value)} /><span><strong>采用 69.81 / 50.37 亿元口径</strong><small>保留修改说明，并要求补充年报页码</small></span></label><label className={decision === 'manual' ? 'chosen' : ''}><input type="radio" name="decision" value="manual" checked={decision === 'manual'} onChange={(event) => setDecision(event.target.value)} /><span><strong>稍后手动编辑</strong><small>本轮整合暂时排除相关结论</small></span></label><button className="primary-button" onClick={() => setSaved(true)}>{saved ? '决策已保存' : '保存决策并继续'}</button>{saved && <p className="saved-note" role="status">已写入决策记录。整合稿会保留“待核实”提示。</p>}</div></section>
        </section>
      </div>
    </main>
  );
}
