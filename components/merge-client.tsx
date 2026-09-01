'use client';

import { useMemo, useState } from 'react';
import { demoIntegratedSections } from '@/lib/demo-data';

export default function MergeClient() {
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [activeIssue, setActiveIssue] = useState(0);
  const markdown = useMemo(() => demoIntegratedSections.map((section) => `## ${section.title}\n\n${section.content.join('\n\n')}\n\n> 贡献：${section.contributors.join('、')}；整合前原文约 ${section.sourceWords} 字`).join('\n\n'), []);
  const sourceWordCount = demoIntegratedSections.reduce((sum, section) => sum + section.sourceWords, 0);

  function downloadMarkdown() {
    const blob = new Blob([`# 科大讯飞资产质量与资本结构分析\n\n${markdown}\n\n## 待核实事项\n\n- 固定资产金额与单位需回到年报核验。\n- 两份完全重复附件仅计一次提交。`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FreeLeader_科大讯飞分析_演示整合稿.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  const issues = [
    { title: '固定资产金额待核实', meta: 'P0 · 阻塞最终确认', body: '保留两组原始数字，但在正文中不使用任何一组做结论。' },
    { title: '完整重复附件', meta: 'P1 · 已自动归并', body: '两份文件指纹一致，只保留一个版本并记录重复来源。' },
    { title: '零减值表述过强', meta: 'P2 · 已降级措辞', body: '改为“目前未识别出减值迹象”，不再表述为“没有潜在风险”。' },
  ];

  return (
    <main className="merge-page">
      <header className="review-topbar"><a className="brand compact-brand" href="/dashboard"><span className="brand-mark">F</span><span>FreeLeader</span></a><nav aria-label="面包屑"><a href="/dashboard">工作台</a><span>/</span><strong>整合审阅</strong></nav><div className="top-actions"><a className="ghost-button" href="/projects/demo/review">返回预审</a><button className="primary-button" onClick={downloadMarkdown}>导出 Markdown</button></div></header>
      <div className="merge-toolbar"><div><p className="eyebrow">INTEGRATED DOCUMENT</p><h1>科大讯飞资产质量与资本结构分析</h1></div><div className="polish-control"><span>润色强度</span>{(['low', 'medium', 'high'] as const).map((item) => <button key={item} className={level === item ? 'selected' : ''} onClick={() => setLevel(item)}>{{ low: '低', medium: '中', high: '高' }[item]}</button>)}</div></div>
      <div className="merge-layout">
        <aside className="outline-panel"><p className="eyebrow">OUTLINE</p>{demoIntegratedSections.map((section, index) => <a className={index === 0 ? 'active' : ''} href={`#section-${index + 1}`} key={section.id}>{String(index + 1).padStart(2, '0')} {section.title.replace(/^\d+\.\s*/, '')}</a>)}<hr /><strong>文档状态</strong><dl><div><dt>已整合</dt><dd>{demoIntegratedSections.length} 个章节</dd></div><div><dt>原文规模</dt><dd>{sourceWordCount.toLocaleString()} 字</dd></div><div><dt>贡献者</dt><dd>6 人</dd></div><div><dt>待核实</dt><dd className="danger-text">1 项</dd></div></dl></aside>
        <article className="document-canvas"><div className="document-cover"><span>课程小组作业 · 完整整合草稿 V3</span><h2>科大讯飞资产质量<br />与资本结构分析</h2><p>保留通过验收的成员正文，只删除完全重复内容；冲突事实并列展示并等待负责人决策。</p><div><span>更新于 2026.09.01</span><span>原文约 {sourceWordCount.toLocaleString()} 字</span><span>低强度润色</span></div></div><div className="merge-principle"><strong>本次整合做了什么</strong><span>保留 8 个章节</span><span>归入 23 个原文段落</span><span>删除 1 份完全重复文件</span><span>保留 1 项事实冲突</span></div>{demoIntegratedSections.map((section, index) => <section className="document-section" id={`section-${index + 1}`} key={section.title}><span className="doc-section-no">{String(index + 1).padStart(2, '0')}</span><h3>{section.title}</h3>{section.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.id === 'S5' && <aside className="inline-warning"><strong>待负责人核实 · 不自动二选一</strong><p>原始提交包含相差 10 倍的固定资产金额口径；当前段落完整保留冲突，但不据此评价资产效率。</p></aside>}<footer><span>内容来源 · 原文约 {section.sourceWords} 字</span>{section.contributors.map((person) => <em key={person}>{person}</em>)}</footer></section>)}</article>
        <aside className="issues-panel"><div className="issues-head"><div><p className="eyebrow">REVIEW QUEUE</p><h2>问题与修改记录</h2></div><span>{issues.length}</span></div><div className="preservation-note"><strong>全文保留模式</strong><p>不再把每位成员的稿件压缩成一句摘要。只做章节归位、标题统一、完全重复删除和冲突标记。</p></div><div className="issue-tabs">{issues.map((issue, index) => <button key={issue.title} className={activeIssue === index ? 'active' : ''} onClick={() => setActiveIssue(index)}><strong>{issue.title}</strong><span>{issue.meta}</span></button>)}</div><article className="issue-detail"><span className="severity p0">{activeIssue === 0 ? 'P0' : activeIssue === 1 ? 'P1' : 'P2'}</span><h3>{issues[activeIssue].title}</h3><p>{issues[activeIssue].body}</p><div className="change-note"><span>处理记录</span><p>{activeIssue === 0 ? '组长选择：标记待核实' : activeIssue === 1 ? '系统处理：按文件指纹归并' : '系统处理：降低确定性措辞'}</p></div></article><div className="contribution-box"><span>贡献追踪已开启</span><p>每段内容都保留来源成员；被合并、移动和排除的内容会写入修改记录。</p></div></aside>
      </div>
    </main>
  );
}
