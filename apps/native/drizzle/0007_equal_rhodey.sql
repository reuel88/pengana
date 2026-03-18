PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_media` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`url` text,
	`local_uri` text,
	`status` text,
	`mime_type` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`scope_type` text DEFAULT 'personal' NOT NULL,
	`scope_id` text DEFAULT '' NOT NULL,
	`organization_id` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_media`("id", "user_id", "url", "local_uri", "status", "mime_type", "created_at", "updated_at", "scope_type", "scope_id", "organization_id", "created_by") SELECT "id", "user_id", "url", "local_uri", "status", "mime_type", "created_at", "updated_at", "scope_type", "scope_id", "organization_id", "created_by" FROM `media`;--> statement-breakpoint
DROP TABLE `media`;--> statement-breakpoint
ALTER TABLE `__new_media` RENAME TO `media`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_todos` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`scope_id` text DEFAULT '' NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`scope_type` text DEFAULT 'personal' NOT NULL,
	`organization_id` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_todos`("id", "updated_at", "user_id", "scope_id", "sync_status", "deleted", "title", "completed", "scope_type", "organization_id", "created_by") SELECT "id", "updated_at", "user_id", "scope_id", "sync_status", "deleted", "title", "completed", "scope_type", "organization_id", "created_by" FROM `todos`;--> statement-breakpoint
DROP TABLE `todos`;--> statement-breakpoint
ALTER TABLE `__new_todos` RENAME TO `todos`;