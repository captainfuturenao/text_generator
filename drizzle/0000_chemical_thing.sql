CREATE TABLE `generations` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`input_json` text NOT NULL,
	`output_text` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`prompt_base` text NOT NULL,
	`form_schema` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_public` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer
);
