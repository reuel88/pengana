CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"to" text NOT NULL,
	"from" text NOT NULL,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "email_log_createdAt_idx" ON "email_log" USING btree ("created_at");