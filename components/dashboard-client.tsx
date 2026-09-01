'use client';

import { useMemo, useState } from 'react';
import { demoProject, demoTasks } from '@/lib/demo-data';

const statusLabel = { passed: '已通过', revision_required: '需修改', submitted: '待预审', not_started: '待提交' } as const;
const statusTone = { passed: 'good', revision_required: 'warn', submitted: 'info', not_started: 'muted' } as const;

export default function DashboardClient({ leaderName }: { leaderName: string }) {
  const [filter, setFilter] = useState<'all' | 'attention'>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const filteredTasks = useMemo(() => filter === 'all' ? demoTasks : demoTasks.filter((task) => task.status === 'revision_required' || task.status === 'not_started'), [filter]);

  async function copyMemberLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/member/demo-chenyi`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/dashboard" aria-label="FreeLeader 首页"><span className="brand-mark">F</span><span>FreeLeader</span></a>
        <nav className="main-nav" aria-label="主导航">
          <a className="nav-item active" href="#overview"><span>⌂</span>工作台</a>
          <a className="nav-item" href="#tasks"><span>□</span>任务</a>
          <a className="nav-item" href="/projects/demo/review"><span>✓</span>质量预审</a>
          <a className="nav-item" href="/projects/demo/merge"><span>≡</span>整合文档</a>
        </nav>
        <a className="sidebar-new" href="/projects/new"><span>＋</span>新建项目</a>
        <div className="sidebar-foot"><div className="avatar">{leaderName.slice(0, 1)}</div><div><strong>{leaderName}</strong><span>项目组长</span></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">{demoProject.course} · 演示项目</p><h1>{demoProject.name}</h1></div>
          <div className="top-actions"><a className="ghost-button" href="/member/demo-chenyi">预览成员页</a><button className="primary-button" type="button" onClick={() => setShowInvite(true)}>邀请成员</button></div>
        </header>

        <div className="content" id="overview">
          <section className="hero-card">
            <div><span className="status-chip"><i />正在收集成员提交</span><h2>下一步，只处理真正需要你决定的事。</h2><p>3 / 6 位成员已提交；1 份作业缺少数据来源，系统已生成可直接发送的修改建议。</p></div>
            <div className="progress-ring" aria-label={`项目完成 ${demoProject.progress}%`}><span>{demoProject.progress}%</span><small>总进度</small></div>
          </section>

          <section className="metrics" aria-label="项目概览">
            <article><span>已提交</span><strong>3<small>/ 6</small></strong><em>比昨天多 2 份</em></article>
            <article><span>预审通过</span><strong>2</strong><em>1 份需要补充来源</em></article>
            <article><span>待处理问题</span><strong>4</strong><em>含 1 个数据冲突</em></article>
            <article><span>距最终截止</span><strong>2<small>天</small></strong><em>9 月 2 日 20:00</em></article>
          </section>

          <div className="dashboard-grid">
            <section className="panel" id="tasks">
              <div className="panel-head"><div><p className="eyebrow">TEAM WORKFLOW</p><h2>成员任务进度</h2></div><div className="segmented" role="group" aria-label="筛选任务"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>全部</button><button className={filter === 'attention' ? 'selected' : ''} onClick={() => setFilter('attention')}>需关注</button></div></div>
              <div className="task-list">
                {filteredTasks.map((task) => <article className="task-row" key={task.id}><div className="member-avatar">{task.initials}</div><div className="task-main"><strong>{task.title}</strong><span>{task.owner} · 截止 {task.deadline}</span></div><span className={`pill ${statusTone[task.status]}`}>{statusLabel[task.status]}</span></article>)}
              </div>
            </section>

            <aside className="panel attention-card" id="review">
              <p className="eyebrow">NEEDS YOUR ATTENTION</p><h2>有 1 个判断需要你确认</h2><div className="alert-icon">!</div><strong>固定资产金额口径冲突</strong><p>同一提交中出现相差 10 倍的资产原值与净值。系统不会静默选择其中一个。</p><a className="dark-button" href="/projects/demo/review">现在处理 <span>→</span></a>
            </aside>
          </div>

          <section className="workflow-strip" aria-label="产品工作流"><div><span>01</span><strong>任务拆解</strong><small>老师要求 → 任务卡</small></div><i>→</i><div><span>02</span><strong>质量门禁</strong><small>提交 → 可执行反馈</small></div><i>→</i><div><span>03</span><strong>冲突决策</strong><small>异常 → 组长确认</small></div><i>→</i><div><span>04</span><strong>内容整合</strong><small>多人稿 → 交付稿</small></div></section>
        </div>
      </section>

      {showInvite && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowInvite(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowInvite(false)} aria-label="关闭">×</button><p className="eyebrow">MEMBER ACCESS</p><h2 id="invite-title">邀请成员提交作业</h2><p>成员无需注册。每个人只看到自己的任务、验收标准和反馈，不会看到其他成员的完整提交。</p><label className="link-field"><span>陈一 · 应收账款深度分析</span><input readOnly value="/member/demo-chenyi" /></label><button className="primary-button full-button" onClick={copyMemberLink}>{copied ? '已复制链接' : '复制专属任务链接'}</button><small>正式项目会为每位成员生成不同的随机链接，并支持失效时间。</small></section></div>}
    </main>
  );
}
