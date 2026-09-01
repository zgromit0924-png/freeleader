import { notFound } from 'next/navigation';
import PlanClient from '@/components/plan-client';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase, getBindings, sha256Hex } from '@/lib/persistence';
import type { ProjectPlan } from '@/lib/planning-engine';

export const dynamic = 'force-dynamic';

export default async function ProjectPlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ leader?: string }> }) {
  const { id } = await params;
  const { leader = '' } = await searchParams;
  const user = await getChatGPTUser();
  await ensureDatabase();
  const { DB } = getBindings();
  const linkAccess = leader ? await DB.prepare(`SELECT id FROM leader_links WHERE project_id = ? AND token_hash = ?`).bind(id, await sha256Hex(leader)).first() : null;
  const project = user ? await DB.prepare(`SELECT id FROM projects WHERE id = ? AND leader_user_id = ?`).bind(id, user.userId).first() : null;
  if (!project && !linkAccess) notFound();
  const planRow = await DB.prepare(`SELECT outline_json AS outlineJson, work_packages_json AS workPackagesJson, assignment_understanding_json AS assignmentUnderstandingJson, assembly_rules_json AS assemblyRulesJson, generated_by AS generatedBy FROM project_plans WHERE project_id = ?`).bind(id).first<Record<string, string>>();
  if (!planRow) notFound();
  const memberRows = await DB.prepare(`SELECT name FROM members WHERE project_id = ? ORDER BY created_at`).bind(id).all<{ name: string }>();
  const plan: ProjectPlan = {
    outline: JSON.parse(planRow.outlineJson), workPackages: JSON.parse(planRow.workPackagesJson), assignmentUnderstanding: JSON.parse(planRow.assignmentUnderstandingJson), assemblyRules: JSON.parse(planRow.assemblyRulesJson), generatedBy: planRow.generatedBy,
  };
  return <PlanClient suppliedPlan={plan} suppliedMembers={memberRows.results.map((row) => row.name)} projectId={id} leaderToken={leader} />;
}
