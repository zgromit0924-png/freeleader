import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase, getBindings, sha256Hex } from '@/lib/persistence';
import { generateProjectPlan } from '@/lib/planning-engine';

export async function POST(request: Request) {
  const body = await request.json() as Record<string, string>;
  if (!body.name || !body.course || !body.description || !body.deadline) return NextResponse.json({ message: '请补齐项目名称、课程、任务要求和截止时间。' }, { status: 400 });
  await ensureDatabase();
  const { DB } = getBindings();
  const now = Date.now();
  const projectId = crypto.randomUUID();
  const signedInUser = await getChatGPTUser();
  const user = signedInUser ?? { userId: `anonymous-${projectId}`, email: `${projectId}@anonymous.freeleader`, displayName: '项目负责人', fullName: null };
  const leaderToken = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const leaderTokenHash = await sha256Hex(leaderToken);
  const names = String(body.members ?? '').split(/[,，]/).map((name) => name.trim()).filter(Boolean).slice(0, 20);
  if (names.length === 0) return NextResponse.json({ message: '请至少填写一位小组成员。' }, { status: 400 });
  const memberRows = names.map((name) => ({ id: crypto.randomUUID(), name }));
  await DB.batch([
    DB.prepare(`INSERT OR IGNORE INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).bind(user.userId, user.email, user.displayName, now),
    DB.prepare(`INSERT INTO projects (id, leader_user_id, name, course, assignment_description, final_deadline, status, ai_allowed, allow_external_research, need_ai_disclosure, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`).bind(projectId, user.userId, body.name, body.course, body.description, Date.parse(body.deadline), body.aiAllowed ? 1 : 0, body.externalResearch ? 1 : 0, body.disclosure ? 1 : 0, now, now),
    ...memberRows.map((member) => DB.prepare(`INSERT INTO members (id, project_id, name, role, created_at) VALUES (?, ?, ?, 'member', ?)`).bind(member.id, projectId, member.name, now)),
    DB.prepare(`INSERT INTO leader_links (id, project_id, token_hash, created_at) VALUES (?, ?, ?, ?)`).bind(crypto.randomUUID(), projectId, leaderTokenHash, now),
    DB.prepare(`INSERT INTO audit_log (id, project_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, 'leader', ?, 'project.created', 'project', ?, ?, ?)`).bind(crypto.randomUUID(), projectId, user.userId, projectId, JSON.stringify({ memberCount: names.length }), now),
  ]);
  const plan = await generateProjectPlan(getBindings(), { projectName: body.name, course: body.course, assignmentDescription: body.description, memberNames: names, deadline: body.deadline });
  await DB.batch([
    DB.prepare(`INSERT INTO project_plans (id, project_id, outline_json, work_packages_json, assignment_understanding_json, assembly_rules_json, assignment_mode, generated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'claim', ?, ?, ?)`).bind(crypto.randomUUID(), projectId, JSON.stringify(plan.outline), JSON.stringify(plan.workPackages), JSON.stringify(plan.assignmentUnderstanding), JSON.stringify(plan.assemblyRules), plan.generatedBy, now, now),
    ...plan.workPackages.map((item) => DB.prepare(`INSERT INTO tasks (id, project_id, owner_member_id, title, goal, expected_output, acceptance_criteria_json, personal_deadline, status, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'unassigned', ?, ?)`).bind(`${projectId}-${item.id}`, projectId, item.title, item.objective, item.expectedOutput, JSON.stringify(item.acceptanceCriteria), Date.parse(body.deadline) - 18 * 60 * 60 * 1000, now, now)),
    DB.prepare(`UPDATE projects SET status = 'planned', updated_at = ? WHERE id = ?`).bind(Date.now(), projectId),
  ]);
  return NextResponse.json({ ok: true, projectId, leaderToken, plan });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: '未登录' }, { status: 401 });
  await ensureDatabase();
  const { DB } = getBindings();
  const result = await DB.prepare(`SELECT id, name, course, status, final_deadline AS finalDeadline FROM projects WHERE leader_user_id = ? ORDER BY updated_at DESC`).bind(user.userId).all();
  return NextResponse.json({ projects: result.results });
}
