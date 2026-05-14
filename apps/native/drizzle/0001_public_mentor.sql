ALTER TABLE `media` ADD `hlc_timestamp` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `field_clocks` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `sync_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `deleted` integer DEFAULT false NOT NULL;