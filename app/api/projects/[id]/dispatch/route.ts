import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase, getBindings, sha256Hex } from '@/lib/persistence';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  await ensureDatabase();
  const { DB } = getBindings();
  const body = await request.json() as { mode?: 'auto' | 'claim' | 'manual'; assignments?: Record<string, string>; leaderToken?: string };
  const project = user ? await DB.prepare(`SELECT id FROM projects WHERE id = ? AND leader_user_id = ?`).bind(id, user.userId).first() : null;
  const linkAccess = body.leaderToken ? await DB.prepare(`SELECT id FROM leader_links WHERE project_id = ? AND token_hash = ?`).bind(id, await sha256Hex(body.leaderToken)).first() : null;
  if (!project && !linkAccess) return NextResponse.json({ message: '项目不存在或负责人链接无效。' }, { status: 404 });
  const mode = body.mode ?? 'claim';
  const members = await DB.prepare(`SELECT id, name FROM members WHERE project_id = ?`).bind(id).all<{ id: string; name: string }>();
  const memberByName = new Map(members.results.map((member) => [member.name, member.id]));
  const tasks = await DB.prepare(`SELECT id FROM tasks WHERE project_id = ?`).bind(id).all<{ id: string }>();
  const now = Date.now();
  await DB.batch([
    DB.prepare(`UPDATE project_plans SET assignment_mode = ?, updated_at = ? WHERE project_id = ?`).bind(mode, now, id),
    ...tasks.results.map((task) => {
      const workPackageId = task.id.slice(id.length + 1);
      const memberId = mode === 'claim' ? null : memberByName.get(body.assignments?.[workPackageId] ?? '') ?? null;
      return DB.prepare(`UPDATE tasks SET owner_member_id = ?, status = ?, updated_at = ? WHERE id = ?`).bind(memberId, memberId ? 'assigned' : 'unassigned', now, task.id);
    }),
    DB.prepare(`UPDATE projects SET status = 'collecting', updated_at = ? WHERE id = ?`).bind(now, id),
    DB.prepare(`INSERT INTO audit_log (id, project_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, 'leader', ?, 'plan.dispatched', 'project', ?, ?, ?)`).bind(crypto.randomUUID(), id, user?.userId ?? 'leader-link', id, JSON.stringify({ mode }), now),
  ]);
  return NextResponse.json({ ok: true, mode, claimUrl: `/projects/${id}/claim` });
}
