CREATE TABLE `media` (
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
CREATE TABLE `media_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`media_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
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
CREATE TABLE `upload_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`file_uri` text NOT NULL,
	`mime_type` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
