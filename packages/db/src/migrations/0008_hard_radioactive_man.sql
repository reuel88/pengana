CREATE TABLE "org_todo" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"attachment_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" text NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "org_todo" ADD CONSTRAINT "org_todo_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_todo" ADD CONSTRAINT "org_todo_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_todo_organizationId_idx" ON "org_todo" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_todo_organizationId_updatedAt_idx" ON "org_todo" USING btree ("organization_id","updated_at");