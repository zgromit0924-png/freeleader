import { NextResponse } from 'next/server';
import { ensureDatabase, getBindings, sha256Hex } from '@/lib/persistence';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureDatabase();
  const { DB } = getBindings();
  const body = await request.json() as { memberName?: string; workPackageId?: string };
  if (!body.memberName || !body.workPackageId) return NextResponse.json({ message: '请选择成员和任务。' }, { status: 400 });
  const member = await DB.prepare(`SELECT id FROM members WHERE project_id = ? AND name = ?`).bind(id, body.memberName).first<{ id: string }>();
  if (!member) return NextResponse.json({ message: '成员不在这个小组中。' }, { status: 404 });
  const taskId = `${id}-${body.workPackageId}`;
  const updated = await DB.prepare(`UPDATE tasks SET owner_member_id = ?, status = 'assigned', updated_at = ? WHERE id = ? AND project_id = ? AND owner_member_id IS NULL`).bind(member.id, Date.now(), taskId, id).run();
  if (!updated.meta.changes) return NextResponse.json({ message: '这个任务刚刚被其他成员认领了，请选择另一项。' }, { status: 409 });
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const tokenHash = await sha256Hex(token);
  await DB.batch([
    DB.prepare(`INSERT INTO member_links (id, member_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), member.id, tokenHash, Date.now() + 30 * 24 * 60 * 60 * 1000, Date.now()),
    DB.prepare(`INSERT INTO audit_log (id, project_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, 'member', ?, 'task.claimed', 'task', ?, '{}', ?)`).bind(crypto.randomUUID(), id, member.id, taskId, Date.now()),
  ]);
  return NextResponse.json({ ok: true, taskLink: `/member/${token}` });
}
