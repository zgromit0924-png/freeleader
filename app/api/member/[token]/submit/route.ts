import { NextResponse } from 'next/server';
import { getBindings, seedDemoProject, sha256Hex } from '@/lib/persistence';
import { reviewWithOptionalModel } from '@/lib/review-engine';
import { extractSubmissionText } from '@/lib/file-text-extraction';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/octet-stream', '']);
const ALLOWED_EXTENSIONS = new Set(['doc', 'docx', 'pdf', 'txt', 'md']);

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await seedDemoProject();
  const { DB, FILES } = getBindings();
  const tokenHash = await sha256Hex(token);
  const access = await DB.prepare(`SELECT m.id AS memberId, m.project_id AS projectId, t.id AS taskId, t.acceptance_criteria_json AS criteriaJson FROM member_links ml JOIN members m ON m.id = ml.member_id JOIN tasks t ON t.owner_member_id = m.id WHERE ml.token_hash = ? AND ml.revoked_at IS NULL AND (ml.expires_at IS NULL OR ml.expires_at > ?) LIMIT 1`).bind(tokenHash, Date.now()).first<{ memberId: string; projectId: string; taskId: string; criteriaJson: string }>();
  if (!access) return NextResponse.json({ message: '任务链接无效或已过期。' }, { status: 404 });
  const form = await request.formData();
  let content = String(form.get('content') ?? '').trim().slice(0, 80_000);
  const fileEntry = form.get('file');
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (!content && !file) return NextResponse.json({ message: '请粘贴正文或选择一个文件。' }, { status: 400 });
  if (file && file.size > MAX_FILE_SIZE) return NextResponse.json({ message: '单个文件不能超过 10 MB。' }, { status: 413 });
  const extension = file?.name.split('.').pop()?.toLowerCase() ?? '';
  if (file && (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension))) return NextResponse.json({ message: '当前只支持 Word、PDF、Markdown 和纯文本文件。' }, { status: 415 });

  const now = Date.now();
  const submissionId = crypto.randomUUID();
  const latest = await DB.prepare(`SELECT COALESCE(MAX(version), 0) AS version FROM submissions WHERE task_id = ?`).bind(access.taskId).first<{ version: number }>();
  const version = Number(latest?.version ?? 0) + 1;
  let fileId: string | null = null;
  let duplicateFile = false;
  if (file) {
    const bytes = await file.arrayBuffer();
    if (!content) content = extractSubmissionText(bytes, extension);
    const hash = await sha256Hex(bytes);
    duplicateFile = Boolean(await DB.prepare(`SELECT id FROM files WHERE project_id = ? AND sha256 = ? LIMIT 1`).bind(access.projectId, hash).first());
    fileId = crypto.randomUUID();
    const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 120) || 'submission';
    const objectKey = FILES
      ? `projects/${access.projectId}/submissions/${submissionId}/${safeName}`
      : `metadata-only/${access.projectId}/${submissionId}/${safeName}`;
    if (FILES) {
      await FILES.put(objectKey, bytes, { httpMetadata: { contentType: file.type || 'application/octet-stream' }, customMetadata: { originalName: file.name, memberId: access.memberId } });
    }
    await DB.prepare(`INSERT INTO files (id, project_id, uploader_member_id, object_key, original_name, content_type, size_bytes, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(fileId, access.projectId, access.memberId, objectKey, file.name, file.type || 'application/octet-stream', file.size, hash, now).run();
  }
  const criteria = JSON.parse(access.criteriaJson) as string[];
  const review = await reviewWithOptionalModel(content, criteria, duplicateFile);
  await DB.batch([
    DB.prepare(`INSERT INTO submissions (id, task_id, member_id, version, content, file_id, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(submissionId, access.taskId, access.memberId, version, content, fileId, now),
    DB.prepare(`INSERT INTO review_results (id, submission_id, status, score, summary, criteria_results_json, risk_flags_json, model_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), submissionId, review.status, review.score, review.summary, JSON.stringify(review.criteriaResults), JSON.stringify(review.riskFlags), review.modelName, now),
    DB.prepare(`UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?`).bind(review.status === 'pass' ? 'passed' : 'revision_required', now, access.taskId),
    DB.prepare(`INSERT INTO audit_log (id, project_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, 'member', ?, 'submission.created', 'submission', ?, ?, ?)`).bind(crypto.randomUUID(), access.projectId, access.memberId, submissionId, JSON.stringify({ version, hasFile: Boolean(file), duplicateFile }), now),
  ]);
  return NextResponse.json({ ok: true, submissionId, version, review: { status: review.status, score: review.score, summary: review.summary } });
}
