import { notFound } from 'next/navigation';
import ClaimBoardClient from '@/components/claim-board-client';
import { ensureDatabase, getBindings } from '@/lib/persistence';
import type { ProjectPlan } from '@/lib/planning-engine';

export const dynamic = 'force-dynamic';
export const metadata = { title: '任务认领 · FreeLeader', robots: { index: false, follow: false } };

export default async function ProjectClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureDatabase();
  const { DB } = getBindings();
  const planRow = await DB.prepare(`SELECT outline_json AS outlineJson, work_packages_json AS workPackagesJson, assignment_understanding_json AS assignmentUnderstandingJson, assembly_rules_json AS assemblyRulesJson, generated_by AS generatedBy FROM project_plans WHERE project_id = ? AND assignment_mode = 'claim'`).bind(id).first<Record<string, string>>();
  if (!planRow) notFound();
  const members = await DB.prepare(`SELECT name FROM members WHERE project_id = ? ORDER BY created_at`).bind(id).all<{ name: string }>();
  const owners = await DB.prepare(`SELECT t.id, m.name FROM tasks t LEFT JOIN members m ON m.id = t.owner_member_id WHERE t.project_id = ?`).bind(id).all<{ id: string; name: string | null }>();
  const plan: ProjectPlan = { outline: JSON.parse(planRow.outlineJson), workPackages: JSON.parse(planRow.workPackagesJson), assignmentUnderstanding: JSON.parse(planRow.assignmentUnderstandingJson), assemblyRules: JSON.parse(planRow.assemblyRulesJson), generatedBy: planRow.generatedBy };
  const initialClaims = Object.fromEntries(owners.results.filter((item) => item.name).map((item) => [item.id.slice(id.length + 1), item.name as string]));
  return <ClaimBoardClient suppliedPlan={plan} suppliedMembers={members.results.map((item) => item.name)} projectId={id} initialClaims={initialClaims} />;
}
