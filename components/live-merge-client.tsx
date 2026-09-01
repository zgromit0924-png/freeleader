'use client';

import { useMemo, useState } from 'react';
import type { IntegratedSection } from '@/lib/merge-engine';

export default function LiveMergeClient({ projectName, projectId, leaderToken, initialSections, originalCharacters, integratedCharacters, removedDuplicateCount }: { projectName: string; projectId: string; leaderToken: string; initialSections: IntegratedSection[]; originalCharacters: number; integratedCharacters: number; removedDuplicateCount: number }) {
  const [sections, setSections] = useState(initialSections);
  const [version, setVersion] = useState(0);
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState(initialSections.some((section) => section.sources.length) ? '已按最新提交生成预览' : '成员提交后，点击重新整合即可归入大纲');
  const markdown = useMemo(() => sections.map((section) => `## ${section.title}\n\n${section.markdown || '> 本章尚无成员提交内容。'}`).join('\n\n'), [sections]);
  const sourceCount = sections.reduce((sum, section) => sum + section.sources.length, 0);
  const unresolved = sections.flatMap((section) => section.unresolved.map((item) => ({ section: section.title, item })));

  async function rebuild() {
    setBuilding(true);
    const response = await fetch(`/api/projects/${projectId}/merge`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ leaderToken }) });
    const result = await response.json() as { message?: string; version?: number; sections?: IntegratedSection[] };
    if (response.ok && result.sections) { setSections(result.sections); setVersion(result.version ?? 0); setMessage(`整合稿 V${result.version ?? 1} 已生成并保存`); }
    else setMessage(result.message ?? '暂时无法生成整合稿');
    setBuilding(false);
  }

  function downloadMarkdown() {
    const blob = new Blob([`# ${projectName}\n\n${markdown}\n\n## 整合说明\n\n- 只删除完全重复内容。\n- 未通过验收或存在冲突的内容均标记为待负责人确认。`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${projectName}_FreeLeader整合稿.md`; link.click(); URL.revokeObjectURL(url);
  }

  return <main className="merge-page"><header className="review-topbar"><a className="brand compact-brand" href="/"><span className="brand-mark">F</span><span>FreeLeader</span></a><nav><a href={`/projects/${projectId}/plan?leader=${encodeURIComponent(leaderToken)}`}>任务方案</a><span>/</span><strong>整合稿</strong></nav><div className="top-actions"><button className="ghost-button" onClick={rebuild} disabled={building}>{building ? '正在整合…' : '重新整合最新提交'}</button><button className="primary-button" onClick={downloadMarkdown}>导出 Markdown</button></div></header><div className="merge-toolbar"><div><p className="eyebrow">LIVE INTEGRATED DOCUMENT</p><h1>{projectName}</h1><small>{message}{version ? ` · V${version}` : ''}</small></div></div><div className="merge-layout"><aside className="outline-panel"><p className="eyebrow">OUTLINE</p>{sections.map((section, index) => <a href={`#section-${index + 1}`} className={index === 0 ? 'active' : ''} key={section.outlineId}>{String(index + 1).padStart(2, '0')} {section.title}</a>)}<hr /><strong>整合状态</strong><dl><div><dt>大纲章节</dt><dd>{sections.length}</dd></div><div><dt>最新提交</dt><dd>{sourceCount}</dd></div><div><dt>成员原文</dt><dd>{originalCharacters.toLocaleString()} 字符</dd></div><div><dt>整合文档</dt><dd>{integratedCharacters.toLocaleString()} 字符</dd></div></dl></aside><article className="document-canvas"><div className="document-cover"><span>负责人私密整合页</span><h2>{projectName}</h2><p>按照已确认大纲归位成员全文；只删除完全重复内容，事实冲突和未通过项留给负责人决定。</p><div><span>{sourceCount} 份最新提交</span><span>{removedDuplicateCount} 份完全重复已归并</span><span>{unresolved.length} 项待确认</span></div></div>{sections.map((section, index) => <section className="document-section" id={`section-${index + 1}`} key={section.outlineId}><span className="doc-section-no">{String(index + 1).padStart(2, '0')}</span><h3>{section.title}</h3>{section.markdown ? <pre className="source-document-text">{section.markdown}</pre> : <p className="empty-section">本章尚无成员提交内容。</p>}<footer><span>{section.sources.length} 份来源 · {section.sources.reduce((sum, item) => sum + item.characters, 0).toLocaleString()} 字符</span>{section.sources.map((source) => <em key={source.submissionId}>{source.memberName} V{source.version}</em>)}</footer></section>)}</article><aside className="issues-panel"><div className="issues-head"><div><p className="eyebrow">REVIEW QUEUE</p><h2>待确认事项</h2></div><span>{unresolved.length}</span></div><div className="preservation-note"><strong>全文保留模式</strong><p>不会把成员长文压缩成一句摘要。每一份来源、版本和字符数都被保留。</p></div>{unresolved.length ? unresolved.map((issue) => <article className="issue-detail" key={`${issue.section}-${issue.item}`}><span className="severity p1">待确认</span><h3>{issue.section}</h3><p>{issue.item}</p></article>) : <article className="issue-detail"><h3>暂时没有待确认项</h3><p>重新整合后，这里会显示未通过验收的内容。</p></article>}</aside></div></main>;
}
