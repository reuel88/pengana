ALTER TABLE `todos` ADD `attachment_url` text;
--> statement-breakpoint
ALTER TABLE `todos` ADD `attachment_local_uri` text;
--> statement-breakpoint
ALTER TABLE `todos` ADD `attachment_status` text;
--> statement-breakpoint
CREATE TABLE `upload_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`todo_id` text NOT NULL,
	`file_uri` text NOT NULL,
	`mime_type` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
