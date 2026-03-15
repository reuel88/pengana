ALTER TABLE "org_todo" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "org_todo" ADD CONSTRAINT "org_todo_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;