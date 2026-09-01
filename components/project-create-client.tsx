'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectCreateClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json() as { projectId?: string; leaderToken?: string; message?: string };
      if (!response.ok || !result.projectId || !result.leaderToken) throw new Error(result.message ?? '项目暂时没有保存成功');
      router.push(`/projects/${result.projectId}/plan?leader=${encodeURIComponent(result.leaderToken)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目暂时没有保存成功');
    } finally { setLoading(false); }
  }

  return (
    <main className="setup-page"><header className="setup-header"><a className="brand compact-brand" href="/"><span className="brand-mark">F</span><span>FreeLeader</span></a><span>新建项目 · 1 / 2</span><a href="/">返回首页</a></header><div className="setup-wrap"><aside><p className="eyebrow">CREATE PROJECT</p><h1>先把老师到底要什么说清楚。</h1><p>输入原始要求后，系统会先生成“任务理解摘要”，不会直接跳到分工。</p><ol><li className="active"><span>1</span><div><strong>项目与规则</strong><small>任务要求、成员、截止时间</small></div></li><li><span>2</span><div><strong>确认任务方案</strong><small>大纲、任务卡、验收标准</small></div></li></ol></aside><form className="setup-form" onSubmit={submit}><section><div className="form-section-title"><span>01</span><div><h2>基本信息</h2><p>这些信息决定任务拆解的范围和时间。</p></div></div><div className="form-grid"><label><span>项目名称</span><input name="name" defaultValue="科大讯飞资产质量与资本结构分析" required /></label><label><span>课程名称</span><input name="course" defaultValue="财务报表分析" required /></label><label className="full"><span>老师的任务要求</span><textarea name="description" defaultValue="选择一家上市公司，从资产质量和资本结构两个角度进行财务报表分析；需要行业对比、数据图表和课堂汇报。" required /></label><label><span>最终截止时间</span><input name="deadline" type="datetime-local" defaultValue="2026-09-02T20:00" required /></label><label><span>小组成员（逗号分隔）</span><input name="members" defaultValue="王宁, 陈一, 林遥, 赵可, 周然, 宋言" required /></label></div></section><section><div className="form-section-title"><span>02</span><div><h2>AI 与贡献边界</h2><p>系统会把这些规则写进每次预审和整合。</p></div></div><div className="policy-options"><label><input type="checkbox" name="aiAllowed" defaultChecked /><span><strong>课程允许 AI 辅助</strong><small>只用于组织、检查和表达，不伪造观点、数据或引用。</small></span></label><label><input type="checkbox" name="disclosure" defaultChecked /><span><strong>导出 AI 使用说明</strong><small>最终交付包附带 AI 使用范围与人工决策记录。</small></span></label><label><input type="checkbox" name="externalResearch" /><span><strong>允许系统补充公开资料</strong><small>未勾选时，只基于老师要求与成员提交进行整合。</small></span></label></div></section>{error && <p className="form-error" role="alert">{error}</p>}<footer><a className="ghost-button" href="/">取消</a><button className="primary-button" disabled={loading}>{loading ? '正在保存…' : '生成任务方案 →'}</button></footer></form></div></main>
  );
}
