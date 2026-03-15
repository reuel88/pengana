CREATE TABLE "todo_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"todo_id" text NOT NULL,
	"todo_type" text NOT NULL,
	"attachment_url" text,
	"mime_type" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "todo_attachment_todoId_idx" ON "todo_attachment" USING btree ("todo_id");--> statement-breakpoint
ALTER TABLE "org_todo" DROP COLUMN "attachment_url";--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "attachment_url";