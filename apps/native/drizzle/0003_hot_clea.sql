ALTER TABLE `upload_queue` RENAME TO `upload_queue_old`;
--> statement-breakpoint
CREATE TABLE `upload_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text DEFAULT 'todo' NOT NULL,
	`entity_id` text NOT NULL,
	`file_uri` text NOT NULL,
	`mime_type` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `upload_queue` (
	`id`,
	`entity_type`,
	`entity_id`,
	`file_uri`,
	`mime_type`,
	`status`,
	`retry_count`,
	`created_at`
)
SELECT
	`id`,
	'todo',
	`todo_id`,
	`file_uri`,
	`mime_type`,
	`status`,
	`retry_count`,
	`created_at`
FROM `upload_queue_old`;
--> statement-breakpoint
DROP TABLE `upload_queue_old`;
