CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text,
	`entity_type` text,
	`user_id` text NOT NULL,
	`url` text,
	`local_uri` text,
	`status` text,
	`mime_type` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `todos` DROP COLUMN `attachment_url`;--> statement-breakpoint
ALTER TABLE `todos` DROP COLUMN `attachment_local_uri`;--> statement-breakpoint
ALTER TABLE `todos` DROP COLUMN `attachment_status`;