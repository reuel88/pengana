ALTER TABLE "org_todo" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "org_todo" CASCADE;--> statement-breakpoint
DROP INDEX "todo_userId_idx";--> statement-breakpoint
DROP INDEX "todo_userId_updatedAt_idx";--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "scope_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "scope_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "todo_scope_updatedAt_idx" ON "todo" USING btree ("scope_type","scope_id","updated_at");