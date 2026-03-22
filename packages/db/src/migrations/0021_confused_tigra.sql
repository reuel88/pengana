ALTER TABLE "todo" ADD COLUMN "hlc_timestamp" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "field_clocks" jsonb DEFAULT '{}'::jsonb NOT NULL;