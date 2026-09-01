CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_audit_project_time` ON `audit_log` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `conflicts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`summary` text NOT NULL,
	`evidence_json` text NOT NULL,
	`decision_status` text DEFAULT 'pending' NOT NULL,
	`leader_decision` text,
	`resolved_by_user_id` text,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_conflicts_project_status` ON `conflicts` (`project_id`,`decision_status`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`uploader_member_id` text,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploader_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_files_project` ON `files` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_files_sha256` ON `files` (`sha256`);--> statement-breakpoint
CREATE TABLE `integrated_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`version` integer NOT NULL,
	`content_markdown` text NOT NULL,
	`polishing_level` text DEFAULT 'low' NOT NULL,
	`contribution_summary_json` text NOT NULL,
	`unresolved_issues_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_integrated_project_version` ON `integrated_documents` (`project_id`,`version`);--> statement-breakpoint
CREATE TABLE `member_links` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_links_token_hash` ON `member_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_member_links_member` ON `member_links` (`member_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_members_project` ON `members` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`leader_user_id` text NOT NULL,
	`name` text NOT NULL,
	`course` text NOT NULL,
	`assignment_description` text NOT NULL,
	`final_deadline` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`ai_allowed` integer DEFAULT true NOT NULL,
	`allow_external_research` integer DEFAULT false NOT NULL,
	`need_ai_disclosure` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`leader_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_projects_leader` ON `projects` (`leader_user_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_status` ON `projects` (`status`);--> statement-breakpoint
CREATE TABLE `review_results` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`status` text NOT NULL,
	`score` real NOT NULL,
	`summary` text NOT NULL,
	`criteria_results_json` text NOT NULL,
	`risk_flags_json` text NOT NULL,
	`model_name` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_review_submission` ON `review_results` (`submission_id`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`member_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`file_id` text,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_submissions_task_version` ON `submissions` (`task_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_submissions_member` ON `submissions` (`member_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`owner_member_id` text,
	`title` text NOT NULL,
	`goal` text NOT NULL,
	`expected_output` text NOT NULL,
	`acceptance_criteria_json` text NOT NULL,
	`personal_deadline` integer NOT NULL,
	`status` text DEFAULT 'assigned' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_project_status` ON `tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_owner` ON `tasks` (`owner_member_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);