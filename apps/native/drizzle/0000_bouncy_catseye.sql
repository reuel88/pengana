CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`deleted` integer DEFAULT false NOT NULL
);
