import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), email: text('email').notNull(), displayName: text('display_name'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_users_email').on(table.email)]);

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), leaderUserId: text('leader_user_id').notNull().references(() => users.id), name: text('name').notNull(), course: text('course').notNull(), assignmentDescription: text('assignment_description').notNull(), finalDeadline: integer('final_deadline', { mode: 'timestamp_ms' }).notNull(), status: text('status', { enum: ['draft', 'planned', 'collecting', 'reviewing', 'merge_ready', 'finalized'] }).notNull().default('draft'), aiAllowed: integer('ai_allowed', { mode: 'boolean' }).notNull().default(true), allowExternalResearch: integer('allow_external_research', { mode: 'boolean' }).notNull().default(false), needAiDisclosure: integer('need_ai_disclosure', { mode: 'boolean' }).notNull().default(true), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_projects_leader').on(table.leaderUserId), index('idx_projects_status').on(table.status)]);

export const members = sqliteTable('members', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), name: text('name').notNull(), email: text('email'), role: text('role', { enum: ['leader', 'member'] }).notNull().default('member'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_members_project').on(table.projectId)]);

export const projectPlans = sqliteTable('project_plans', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), outlineJson: text('outline_json').notNull(), workPackagesJson: text('work_packages_json').notNull(), assignmentUnderstandingJson: text('assignment_understanding_json').notNull(), assemblyRulesJson: text('assembly_rules_json').notNull(), assignmentMode: text('assignment_mode', { enum: ['auto', 'claim', 'manual'] }).notNull().default('claim'), generatedBy: text('generated_by').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_project_plans_project').on(table.projectId)]);

export const leaderLinks = sqliteTable('leader_links', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), tokenHash: text('token_hash').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_leader_links_token_hash').on(table.tokenHash), index('idx_leader_links_project').on(table.projectId)]);

export const memberLinks = sqliteTable('member_links', {
  id: text('id').primaryKey(), memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }), tokenHash: text('token_hash').notNull(), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }), revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_member_links_token_hash').on(table.tokenHash), index('idx_member_links_member').on(table.memberId)]);

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), ownerMemberId: text('owner_member_id').references(() => members.id), title: text('title').notNull(), goal: text('goal').notNull(), expectedOutput: text('expected_output').notNull(), acceptanceCriteriaJson: text('acceptance_criteria_json').notNull(), personalDeadline: integer('personal_deadline', { mode: 'timestamp_ms' }).notNull(), status: text('status', { enum: ['unassigned', 'assigned', 'submitted', 'revision_required', 'passed', 'merged'] }).notNull().default('assigned'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_tasks_project_status').on(table.projectId, table.status), index('idx_tasks_owner').on(table.ownerMemberId)]);

export const files = sqliteTable('files', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), uploaderMemberId: text('uploader_member_id').references(() => members.id), objectKey: text('object_key').notNull(), originalName: text('original_name').notNull(), contentType: text('content_type').notNull(), sizeBytes: integer('size_bytes').notNull(), sha256: text('sha256').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_files_project').on(table.projectId), index('idx_files_sha256').on(table.sha256)]);

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(), taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }), memberId: text('member_id').notNull().references(() => members.id), version: integer('version').notNull(), content: text('content').notNull().default(''), fileId: text('file_id').references(() => files.id), submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_submissions_task_version').on(table.taskId, table.version), index('idx_submissions_member').on(table.memberId)]);

export const reviewResults = sqliteTable('review_results', {
  id: text('id').primaryKey(), submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }), status: text('status', { enum: ['pass', 'minor_issue', 'fail'] }).notNull(), score: real('score').notNull(), summary: text('summary').notNull(), criteriaResultsJson: text('criteria_results_json').notNull(), riskFlagsJson: text('risk_flags_json').notNull(), modelName: text('model_name'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_review_submission').on(table.submissionId)]);

export const conflicts = sqliteTable('conflicts', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), type: text('type', { enum: ['factual', 'data', 'viewpoint', 'terminology', 'duplicate'] }).notNull(), severity: text('severity', { enum: ['P0', 'P1', 'P2', 'P3'] }).notNull(), summary: text('summary').notNull(), evidenceJson: text('evidence_json').notNull(), decisionStatus: text('decision_status', { enum: ['pending', 'resolved'] }).notNull().default('pending'), leaderDecision: text('leader_decision'), resolvedByUserId: text('resolved_by_user_id').references(() => users.id), resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_conflicts_project_status').on(table.projectId, table.decisionStatus)]);

export const integratedDocuments = sqliteTable('integrated_documents', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), version: integer('version').notNull(), contentMarkdown: text('content_markdown').notNull(), polishingLevel: text('polishing_level', { enum: ['low', 'medium', 'high'] }).notNull().default('low'), contributionSummaryJson: text('contribution_summary_json').notNull(), unresolvedIssuesJson: text('unresolved_issues_json').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_integrated_project_version').on(table.projectId, table.version)]);

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), actorType: text('actor_type', { enum: ['leader', 'member', 'system'] }).notNull(), actorId: text('actor_id'), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: text('entity_id').notNull(), metadataJson: text('metadata_json').notNull().default('{}'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_audit_project_time').on(table.projectId, table.createdAt)]);
