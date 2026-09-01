'use client';

import { useMemo, useState } from 'react';
import { demoDetailedPlan, demoMembers, demoTasks } from '@/lib/demo-data';
import type { ProjectPlan } from '@/lib/planning-engine';

type AssignmentMode = 'auto' | 'claim' | 'manual';

export default function PlanClient({ suppliedPlan, suppliedMembers, projectId = 'demo', leaderToken = '' }: { suppliedPlan?: ProjectPlan; suppliedMembers?: string[]; projectId?: string; leaderToken?: string }) {
  const activePlan = suppliedPlan ?? demoDetailedPlan;
  const activeMembers = suppliedMembers?.length ? suppliedMembers : demoMembers;
  const activeTasks = useMemo(() => suppliedPlan ? suppliedPlan.workPackages.map((item, index) => ({ ...item, owner: activeMembers[item.suggestedOwnerIndex ?? index % activeMembers.length] ?? '', initials: activeMembers[item.suggestedOwnerIndex ?? index % activeMembers.length]?.slice(0, 1) ?? '待', status: 'not_started' as const, deadline: '最终截止前 18 小时' })) : demoTasks, [suppliedPlan, activeMembers]);
  const [confirmed, setConfirmed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [selected, setSelected] = useState(activeTasks[0].id);
  const [outlineOpen, setOutlineOpen] = useState(activePlan.outline[0].id);
  const [mode, setMode] = useState<AssignmentMode>('claim');
  const [owners, setOwners] = useState<Record<string, string>>(() => Object.fromEntries(activeTasks.map((task) => [task.id, task.owner])));
  const task = activeTasks.find((item) => item.id === selected) ?? activeTasks[0];
  const assignedCount = Object.values(owners).filter(Boolean).length;

  function changeMode(nextMode: AssignmentMode) {
    setMode(nextMode);
    if (nextMode === 'claim') setOwners(Object.fromEntries(activeTasks.map((item) => [item.id, ''])));
    if (nextMode === 'auto') setOwners(Object.fromEntries(activeTasks.map((item, index) => [item.id, activeMembers[index % activeMembers.length]])));
  }

  const modeHint = useMemo(() => ({
    auto: '系统按预计用时、难度和前置依赖均衡分配，负责人仍可调整。',
    claim: '先发布任务池，成员打开公共认领页后选择任务；同一任务只能被一人认领。',
    manual: '负责人逐项指定成员，适合已经了解每个人专长的小组。',
  }[mode]), [mode]);

  async function publishPlan() {
    if (projectId === 'demo') { setConfirmed(true); return; }
    setPublishing(true); setPublishError('');
    try {
      const response = await fetch(`/api/projects/${projectId}/dispatch`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, assignments: owners, leaderToken }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? '任务方案没有发布成功');
      setConfirmed(true);
    } catch (error) { setPublishError(error instanceof Error ? error.message : '任务方案没有发布成功'); }
    finally { setPublishing(false); }
  }

  return (
    <main className="plan-page">
      <header className="setup-header"><a className="brand compact-brand" href="/"><span className="brand-mark">F</span><span>FreeLeader</span></a><span>新建项目 · 2 / 3</span><a href="/projects/new">返回修改原始要求</a></header>
      <div className="plan-head"><div><p className="eyebrow">DELIVERABLE BLUEPRINT</p><h1>先确认整份作业长什么样，再决定谁做什么</h1><p>大纲定义最终成果；任务必须能逐项回填大纲，而不是把成员随便分成几段。</p></div><div className="plan-head-actions"><a className="ghost-button light" href={`/projects/${projectId}/claim`}>预览成员认领页</a><button className="primary-button" disabled={publishing} onClick={publishPlan}>{confirmed ? '方案已发布' : publishing ? '正在发布…' : mode === 'claim' ? '发布任务池' : '确认并派发任务'}</button></div></div>
      {publishError && <p className="plan-publish-error" role="alert">{publishError}</p>}

      <div className="planning-steps" aria-label="任务生成流程"><div className="done"><span>1</span><strong>生成完整大纲</strong><small>8 章 · 29 个二级小节</small></div><div className="active"><span>2</span><strong>拆成可验收任务</strong><small>6 个工作包 · 对应 6 位成员</small></div><div><span>3</span><strong>分配或公开认领</strong><small>{mode === 'claim' ? '成员自主选择' : mode === 'auto' ? '系统均衡分配' : '负责人指定'}</small></div></div>

      <section className="assignment-brief">
        <div><p className="eyebrow">AI 对作业的理解</p><h2>{activePlan.assignmentUnderstanding.finalDeliverable}</h2><p>{activePlan.assignmentUnderstanding.coreQuestion}</p></div>
        <dl><div><dt>最终受众</dt><dd>{activePlan.assignmentUnderstanding.audience}</dd></div><div><dt>硬性要求</dt><dd>{activePlan.assignmentUnderstanding.hardConstraints.length} 项</dd></div><div><dt>主要风险</dt><dd>{activePlan.assignmentUnderstanding.qualityRisks.length} 项</dd></div></dl>
      </section>

      <section className="outline-blueprint">
        <div className="blueprint-heading"><div><p className="eyebrow">STEP 1 · 完整交付结构</p><h2>最终报告大纲</h2><p>点击章节查看写作目的、问题、证据和二级结构。确认大纲后，所有任务都会映射回这些节点。</p></div><span>{activePlan.outline.length} 个一级章节</span></div>
        <div className="outline-accordion">{activePlan.outline.map((section, index) => {
          const open = outlineOpen === section.id;
          return <article className={open ? 'open' : ''} key={section.id}><button onClick={() => setOutlineOpen(open ? '' : section.id)}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{section.title}</strong><small>{section.purpose}</small></div><em>{section.children.length} 个小节 {open ? '−' : '+'}</em></button>{open && <div className="outline-detail"><div><h3>这一章要回答</h3><ul>{section.keyQuestions.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>必须准备的证据</h3><ul>{section.requiredEvidence.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="subsection-map"><h3>二级结构与写作要求</h3>{section.children.map((child) => <p key={child.id}><b>{child.id}</b><span><strong>{child.title}</strong>{child.requirement}</span></p>)}</div><div><h3>建议图表</h3><ul>{section.suggestedVisuals.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}</article>;
        })}</div>
      </section>

      <section className="task-planning-section">
        <div className="blueprint-heading"><div><p className="eyebrow">STEP 2 · 工作包</p><h2>按 {activeMembers.length} 位成员拆成 {activeTasks.length} 个可执行任务</h2><p>每个任务都写明“为什么做、按什么步骤做、交什么、怎样算通过”。</p></div><span>合计约 {activeTasks.reduce((sum, item) => sum + item.estimatedHours, 0)} 小时</span></div>
        <div className="plan-layout detailed-plan"><section className="plan-tasks"><div className="plan-summary"><span>{activeMembers.length} 位成员</span><span>{activeTasks.length} 张任务卡</span><span>{activeTasks.reduce((sum, item) => sum + item.acceptanceCriteria.length, 0)} 条验收标准</span></div>{activeTasks.map((item) => <button className={`plan-task-card ${selected === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelected(item.id)}><div className="task-number">{item.id}</div><div><strong>{item.title}</strong><span>{item.outlineSectionIds.join(' + ')} · {item.difficulty} · 约 {item.estimatedHours} 小时</span><small>{item.expectedOutput}</small></div><em>→</em></button>)}</section>
          <aside className="task-editor rich-task-editor"><div className="task-editor-title"><div><p className="eyebrow">{task.id} · {task.outlineSectionIds.join(' / ')}</p><h2>{task.title}</h2></div><span>{task.difficulty}</span></div><div className="task-objective"><strong>任务目标</strong><p>{task.objective}</p><small>{task.context}</small></div><div className="task-spec-grid"><section><h3>具体怎么做</h3><ol>{task.workSteps.map((step) => <li key={step}>{step}</li>)}</ol></section><section><h3>需要准备什么</h3><ul>{task.dataChecklist.map((item) => <li key={item}>{item}</li>)}</ul></section></div><div className="output-contract"><span>预期交付物</span><strong>{task.expectedOutput}</strong><div>{task.outputStructure.map((item, index) => <em key={item}>{index + 1}. {item}</em>)}</div></div><div className="editor-criteria"><span>验收标准（逐条可检查）</span>{task.acceptanceCriteria.map((criterion, index) => <label key={criterion}><input type="checkbox" checked readOnly /><p><b>{index + 1}</b>{criterion}</p></label>)}</div>{task.dependencies.length > 0 && <div className="dependency-note"><strong>前置依赖</strong>{task.dependencies.map((item) => <p key={item}>{item}</p>)}</div>}</aside>
        </div>
      </section>

      <section className="dispatch-section"><div className="blueprint-heading"><div><p className="eyebrow">STEP 3 · 派发方式</p><h2>负责人分配，还是成员自己认领？</h2><p>两种方式都保留；默认推荐成员认领，负责人可以锁定关键任务。</p></div><span>{assignedCount} / {activeTasks.length} 已有负责人</span></div><div className="mode-selector">{([
        ['claim', '成员自主认领', '推荐：成员从任务池选择，减少强行分配。'],
        ['auto', '系统均衡分配', '按难度、用时和依赖给出一版可调整建议。'],
        ['manual', '负责人手动指定', '逐项选择负责人，发布后仍可重新分配。'],
      ] as const).map(([value, title, description]) => <button className={mode === value ? 'selected' : ''} key={value} onClick={() => changeMode(value)}><span>{mode === value ? '●' : '○'}</span><strong>{title}</strong><small>{description}</small></button>)}</div><p className="mode-hint">{modeHint}</p><div className="assignment-table">{activeTasks.map((item) => <div key={item.id}><span>{item.id}</span><div><strong>{item.title}</strong><small>{item.difficulty} · {item.estimatedHours} 小时</small></div>{mode === 'claim' ? <em className="claim-status">等待成员认领</em> : <select value={owners[item.id]} onChange={(event) => setOwners((current) => ({ ...current, [item.id]: event.target.value }))}><option value="">暂不分配</option>{activeMembers.map((member) => <option key={member}>{member}</option>)}</select>}</div>)}</div></section>

      {confirmed && <div className="confirmation-toast" role="status"><strong>{mode === 'claim' ? '任务池已发布，成员可以开始认领' : '任务已经派发'}</strong><span>大纲、工作包和验收标准已锁定为 V1。请保存本页网址，它是你的负责人私密入口。</span><a href={mode === 'claim' ? `/projects/${projectId}/claim` : `/projects/${projectId}/merge?leader=${encodeURIComponent(leaderToken)}`}>{mode === 'claim' ? '打开成员认领页' : '查看项目整合稿'} →</a>{projectId !== 'demo' && <a href={`/projects/${projectId}/merge?leader=${encodeURIComponent(leaderToken)}`}>负责人查看整合稿 →</a>}</div>}
    </main>
  );
}
