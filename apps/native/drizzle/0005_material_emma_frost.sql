CREATE TABLE `media_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`media_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_upload_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`file_uri` text NOT NULL,
	`mime_type` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_upload_queue`("id", "file_uri", "mime_type", "entity_type", "entity_id", "status", "retry_count", "created_at") SELECT "id", "file_uri", "mime_type", "entity_type", "entity_id", "status", "retry_count", "created_at" FROM `upload_queue`;--> statement-breakpoint
DROP TABLE `upload_queue`;--> statement-breakpoint
ALTER TABLE `__new_upload_queue` RENAME TO `upload_queue`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `media` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `scope_type` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `scope_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `organization_id` text;--> statement-breakpoint
ALTER TABLE `media` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `media` DROP COLUMN `entity_id`;--> statement-breakpoint
ALTER TABLE `media` DROP COLUMN `entity_type`;--> statement-breakpoint
ALTER TABLE `media` DROP COLUMN `position`;--> statement-breakpoint
ALTER TABLE `todos` ADD `scope_type` text DEFAULT 'personal' NOT NULL;