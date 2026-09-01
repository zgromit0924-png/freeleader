import { demoMemberTask } from '@/lib/demo-data';
import { getBindings, seedDemoProject, sha256Hex } from '@/lib/persistence';
import type { WorkPackage } from '@/lib/planning-engine';

export async function loadMemberTaskByToken(token: string): Promise<typeof demoMemberTask | null> {
  await seedDemoProject();
  const { DB } = getBindings();
  const tokenHash = await sha256Hex(token);
  const row = await DB.prepare(`SELECT m.id AS memberId, m.name AS memberName, p.id AS projectId, p.name AS projectName, p.course, t.id AS taskId, t.title, t.goal, t.expected_output AS expectedOutput, t.acceptance_criteria_json AS criteriaJson, t.personal_deadline AS deadline, t.status FROM member_links ml JOIN members m ON m.id = ml.member_id JOIN projects p ON p.id = m.project_id JOIN tasks t ON t.owner_member_id = m.id WHERE ml.token_hash = ? AND ml.revoked_at IS NULL AND (ml.expires_at IS NULL OR ml.expires_at > ?) ORDER BY t.updated_at DESC LIMIT 1`).bind(tokenHash, Date.now()).first<Record<string, string | number>>();
  if (!row) return null;
  if (token === demoMemberTask.token) return demoMemberTask;
  const planRow = await DB.prepare(`SELECT work_packages_json AS workPackagesJson FROM project_plans WHERE project_id = ?`).bind(String(row.projectId)).first<{ workPackagesJson: string }>();
  const workPackages = planRow ? JSON.parse(planRow.workPackagesJson) as WorkPackage[] : [];
  const workPackage = workPackages.find((item) => item.title === row.title);
  const latestReview = await DB.prepare(`SELECT rr.status, rr.score, rr.summary FROM submissions s JOIN review_results rr ON rr.submission_id = s.id WHERE s.task_id = ? ORDER BY s.version DESC LIMIT 1`).bind(String(row.taskId)).first<{ status: string; score: number; summary: string }>();
  const criteria = JSON.parse(String(row.criteriaJson)) as string[];
  const fallbackPackage: WorkPackage = { id: String(row.taskId), title: String(row.title), outlineSectionIds: [], objective: String(row.goal), context: '提交内容将按照已确认的大纲归入整合稿。', workSteps: ['确认任务目标与验收标准', '收集并记录资料来源', '完成正文与图表', '提交前逐条自查'], dataChecklist: ['老师要求', '课程资料', '可回溯的数据来源'], expectedOutput: String(row.expectedOutput), outputStructure: ['分析口径', '证据与分析', '结论与建议'], acceptanceCriteria: criteria, dependencies: [], difficulty: '进阶', estimatedHours: 6, suggestedOwnerIndex: null };
  const task = workPackage ?? fallbackPackage;
  return {
    token, memberName: String(row.memberName), projectName: String(row.projectName), course: String(row.course),
    task: { ...task, owner: String(row.memberName), initials: String(row.memberName).slice(0, 1), status: mapStatus(String(row.status)), deadline: new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(new Date(Number(row.deadline))) },
    leaderNote: '先按步骤完成资料和口径核对，再写正文。遇到无法确认的数据，请保留来源并标记“待核实”，不要猜测。',
    latestReview: latestReview ? { status: latestReview.status, score: latestReview.score, summary: latestReview.summary } : { status: 'not_submitted', score: 0, summary: '还没有历史反馈。第一次提交后，这里会显示逐条验收结果。' },
  } as typeof demoMemberTask;
}

function mapStatus(status: string): 'not_started' | 'submitted' | 'revision_required' | 'passed' {
  if (status === 'passed') return 'passed'; if (status === 'revision_required') return 'revision_required'; if (status === 'submitted') return 'submitted'; return 'not_started';
}
