CREATE TABLE `leader_links` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_leader_links_token_hash` ON `leader_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_leader_links_project` ON `leader_links` (`project_id`);--> statement-breakpoint
CREATE TABLE `project_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`outline_json` text NOT NULL,
	`work_packages_json` text NOT NULL,
	`assignment_understanding_json` text NOT NULL,
	`assembly_rules_json` text NOT NULL,
	`assignment_mode` text DEFAULT 'claim' NOT NULL,
	`generated_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_project_plans_project` ON `project_plans` (`project_id`);