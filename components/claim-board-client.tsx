'use client';

import { useMemo, useState } from 'react';
import { demoDetailedPlan, demoMembers, demoTasks } from '@/lib/demo-data';
import type { ProjectPlan } from '@/lib/planning-engine';

export default function ClaimBoardClient({ suppliedPlan, suppliedMembers, projectId = 'demo', initialClaims = {} }: { suppliedPlan?: ProjectPlan; suppliedMembers?: string[]; projectId?: string; initialClaims?: Record<string, string> }) {
  const members = suppliedMembers?.length ? suppliedMembers : demoMembers;
  const tasks = useMemo(() => suppliedPlan ? suppliedPlan.workPackages.map((item) => ({ ...item })) : demoTasks, [suppliedPlan]);
  const [member, setMember] = useState('');
  const [claims, setClaims] = useState<Record<string, string>>(() => projectId === 'demo' ? { W1: '王宁', W3: '林遥', ...initialClaims } : initialClaims);
  const [expanded, setExpanded] = useState(tasks[1]?.id ?? tasks[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const plan = suppliedPlan ?? demoDetailedPlan;

  async function claim(taskId: string) {
    if (!member || claims[taskId]) return;
    if (projectId === 'demo') { setClaims((current) => ({ ...current, [taskId]: member })); setMessage(`认领成功：${member} → ${taskId}。正式项目会同时生成专属提交链接。`); return; }
    setMessage('正在确认认领…');
    const response = await fetch(`/api/projects/${projectId}/claim`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ memberName: member, workPackageId: taskId }) });
    const result = await response.json() as { message?: string; taskLink?: string };
    if (!response.ok) { setMessage(result.message ?? '认领失败，请重试。'); return; }
    setClaims((current) => ({ ...current, [taskId]: member }));
    setMessage(`认领成功。你的专属提交链接：${result.taskLink}`);
  }

  return <main className="claim-page"><header className="member-header"><a className="brand member-brand" href="/"><span className="brand-mark">F</span><span>FreeLeader</span></a><span className="secure-note">公开任务认领页</span></header><div className="claim-hero"><p className="eyebrow">任务池 · {members.length} 人小组</p><h1>选择一个你愿意负责到底的任务</h1><p>{plan.assignmentUnderstanding.coreQuestion}</p><label><span>先选择你的名字</span><select value={member} onChange={(event) => setMember(event.target.value)}><option value="">请选择成员</option>{members.map((name) => <option key={name}>{name}</option>)}</select></label>{message && <div className="claim-message" role="status">{message}</div>}</div><section className="claim-grid">{tasks.map((task) => {
    const owner = claims[task.id]; const open = expanded === task.id;
    return <article className={`${owner ? 'claimed' : ''} ${open ? 'open' : ''}`} key={task.id}><button className="claim-card-head" onClick={() => setExpanded(open ? '' : task.id)}><div><span>{task.id} · {task.outlineSectionIds.join(' / ')}</span><h2>{task.title}</h2><p>{task.objective}</p></div><em>{open ? '收起' : '看详情'}</em></button><div className="claim-meta"><span>{task.difficulty}</span><span>约 {task.estimatedHours} 小时</span><span>{task.acceptanceCriteria.length} 条验收标准</span></div>{open && <div className="claim-detail"><section><h3>你需要完成</h3><ol>{task.workSteps.map((step) => <li key={step}>{step}</li>)}</ol></section><section><h3>最终要交</h3><strong>{task.expectedOutput}</strong><h3>通过条件</h3><ul>{task.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul></section></div>}<footer>{owner ? <div><span className="claimed-avatar">{owner.slice(0, 1)}</span><strong>{owner} 已认领</strong></div> : <span>当前无人认领</span>}<button disabled={!member || Boolean(owner)} onClick={() => claim(task.id)}>{owner ? '已被认领' : member ? `由 ${member} 认领` : '请先选择名字'}</button></footer></article>;
  })}</section></main>;
}
