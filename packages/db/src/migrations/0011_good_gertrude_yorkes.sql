CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text,
	"entity_type" text,
	"user_id" text NOT NULL,
	"url" text,
	"mime_type" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "media_entity_id_idx" ON "media" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "media_user_id_idx" ON "media" USING btree ("user_id");