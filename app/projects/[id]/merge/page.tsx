import { notFound } from 'next/navigation';
import LiveMergeClient from '@/components/live-merge-client';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase, getBindings, sha256Hex } from '@/lib/persistence';
import { integrateWithoutCompression } from '@/lib/merge-engine';
import type { OutlineNode, WorkPackage } from '@/lib/planning-engine';

export const dynamic = 'force-dynamic';
export const metadata = { title: '项目整合稿 · FreeLeader', robots: { index: false, follow: false } };

export default async function ProjectMergePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ leader?: string }> }) {
  const { id } = await params; const { leader = '' } = await searchParams; const user = await getChatGPTUser();
  await ensureDatabase(); const { DB } = getBindings();
  const project = user ? await DB.prepare(`SELECT name FROM projects WHERE id = ? AND leader_user_id = ?`).bind(id, user.userId).first<{ name: string }>() : null;
  const linkedProject = leader ? await DB.prepare(`SELECT p.name FROM leader_links ll JOIN projects p ON p.id = ll.project_id WHERE ll.project_id = ? AND ll.token_hash = ?`).bind(id, await sha256Hex(leader)).first<{ name: string }>() : null;
  const activeProject = project ?? linkedProject; if (!activeProject) notFound();
  const planRow = await DB.prepare(`SELECT outline_json AS outlineJson, work_packages_json AS workPackagesJson FROM project_plans WHERE project_id = ?`).bind(id).first<{ outlineJson: string; workPackagesJson: string }>(); if (!planRow) notFound();
  const outline = JSON.parse(planRow.outlineJson) as OutlineNode[]; const packages = JSON.parse(planRow.workPackagesJson) as WorkPackage[]; const packageByTitle = new Map(packages.map((item) => [item.title, item]));
  const rows = await DB.prepare(`SELECT s.id, s.task_id AS taskId, s.version, s.content, t.title AS taskTitle, m.name AS memberName, rr.status AS reviewStatus FROM submissions s JOIN tasks t ON t.id = s.task_id JOIN members m ON m.id = s.member_id LEFT JOIN review_results rr ON rr.submission_id = s.id WHERE t.project_id = ? ORDER BY s.task_id, s.version DESC`).bind(id).all<Record<string, string | number>>();
  const latest = new Map<string, Record<string, string | number>>(); for (const row of rows.results) if (!latest.has(String(row.taskId))) latest.set(String(row.taskId), row);
  const merged = await integrateWithoutCompression(outline, [...latest.values()].map((row) => ({ id: String(row.id), taskTitle: String(row.taskTitle), outlineSectionIds: packageByTitle.get(String(row.taskTitle))?.outlineSectionIds ?? [], memberName: String(row.memberName), version: Number(row.version), content: String(row.content), reviewStatus: String(row.reviewStatus ?? 'pending') })));
  return <LiveMergeClient projectName={activeProject.name} projectId={id} leaderToken={leader} initialSections={merged.sections} originalCharacters={merged.originalCharacters} integratedCharacters={merged.integratedCharacters} removedDuplicateCount={merged.removedDuplicates.length} />;
}
