import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase, getBindings, sha256Hex } from '@/lib/persistence';
import { integrateWithoutCompression } from '@/lib/merge-engine';
import type { OutlineNode, WorkPackage } from '@/lib/planning-engine';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  await ensureDatabase();
  const { DB } = getBindings();
  const body = await request.json().catch(() => ({})) as { leaderToken?: string };
  const project = user ? await DB.prepare(`SELECT id FROM projects WHERE id = ? AND leader_user_id = ?`).bind(id, user.userId).first() : null;
  const linkAccess = body.leaderToken ? await DB.prepare(`SELECT id FROM leader_links WHERE project_id = ? AND token_hash = ?`).bind(id, await sha256Hex(body.leaderToken)).first() : null;
  if (!project && !linkAccess) return NextResponse.json({ message: '项目不存在或负责人链接无效。' }, { status: 404 });
  const planRow = await DB.prepare(`SELECT outline_json AS outlineJson, work_packages_json AS workPackagesJson FROM project_plans WHERE project_id = ?`).bind(id).first<{ outlineJson: string; workPackagesJson: string }>();
  if (!planRow) return NextResponse.json({ message: '项目还没有确认大纲。' }, { status: 409 });
  const outline = JSON.parse(planRow.outlineJson) as OutlineNode[];
  const packages = JSON.parse(planRow.workPackagesJson) as WorkPackage[];
  const packageByTitle = new Map(packages.map((item) => [item.title, item]));
  const rows = await DB.prepare(`SELECT s.id, s.task_id AS taskId, s.version, s.content, t.title AS taskTitle, m.name AS memberName, rr.status AS reviewStatus FROM submissions s JOIN tasks t ON t.id = s.task_id JOIN members m ON m.id = s.member_id LEFT JOIN review_results rr ON rr.submission_id = s.id WHERE t.project_id = ? ORDER BY s.task_id, s.version DESC`).bind(id).all<Record<string, string | number>>();
  const latest = new Map<string, Record<string, string | number>>();
  for (const row of rows.results) if (!latest.has(String(row.taskId))) latest.set(String(row.taskId), row);
  const merged = await integrateWithoutCompression(outline, [...latest.values()].map((row) => ({ id: String(row.id), taskTitle: String(row.taskTitle), outlineSectionIds: packageByTitle.get(String(row.taskTitle))?.outlineSectionIds ?? [], memberName: String(row.memberName), version: Number(row.version), content: String(row.content), reviewStatus: String(row.reviewStatus ?? 'pending') })));
  const previous = await DB.prepare(`SELECT COALESCE(MAX(version), 0) AS version FROM integrated_documents WHERE project_id = ?`).bind(id).first<{ version: number }>();
  const version = Number(previous?.version ?? 0) + 1;
  await DB.prepare(`INSERT INTO integrated_documents (id, project_id, version, content_markdown, polishing_level, contribution_summary_json, unresolved_issues_json, created_at) VALUES (?, ?, ?, ?, 'low', ?, ?, ?)`).bind(crypto.randomUUID(), id, version, merged.contentMarkdown, JSON.stringify(merged.sections.map((section) => ({ outlineId: section.outlineId, sources: section.sources }))), JSON.stringify(merged.sections.flatMap((section) => section.unresolved)), Date.now()).run();
  return NextResponse.json({ ok: true, version, ...merged });
}
