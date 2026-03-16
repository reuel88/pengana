DROP INDEX "media_user_id_idx";--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scope_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scope_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_scope_updatedAt_idx" ON "media" USING btree ("scope_type","scope_id","updated_at");