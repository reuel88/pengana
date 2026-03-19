ALTER TABLE "media" DROP CONSTRAINT "media_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "media_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "todo" DROP CONSTRAINT "todo_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "todo" DROP CONSTRAINT "todo_created_by_user_id_fk";
--> statement-breakpoint
DELETE FROM "media" WHERE "organization_id" IS NULL OR "created_by" IS NULL;--> statement-breakpoint
DELETE FROM "todo" WHERE "organization_id" IS NULL OR "created_by" IS NULL;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;