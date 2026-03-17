CREATE TABLE "media_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"media_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "media_entity_id_idx";--> statement-breakpoint
ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_attachments_entity_idx" ON "media_attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "media_attachments_media_id_idx" ON "media_attachments" USING btree ("media_id");--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "entity_id";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "entity_type";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "position";