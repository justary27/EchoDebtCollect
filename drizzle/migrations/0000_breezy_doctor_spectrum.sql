CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`scenario` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`system_prompt` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `debt_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`amount` text NOT NULL,
	`context` text NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
