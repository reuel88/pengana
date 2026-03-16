ALTER TABLE "org_todo" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "org_todo" CASCADE;--> statement-breakpoint
DROP INDEX "todo_userId_idx";--> statement-breakpoint
DROP INDEX "todo_userId_updatedAt_idx";--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "scope_type" text NOT NULL DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "scope_id" text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE "todo" SET "scope_id" = "user_id" WHERE "scope_type" = 'personal';--> statement-breakpoint
ALTER TABLE "todo" ALTER COLUMN "scope_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "todo" ALTER COLUMN "scope_id" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "todo_scope_updatedAt_idx" ON "todo" USING btree ("scope_type","scope_id","updated_at");