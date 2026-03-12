CREATE TABLE "seat_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seat_assignment" ADD CONSTRAINT "seat_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_assignment" ADD CONSTRAINT "seat_assignment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seat_assignment_orgId_memberId_uidx" ON "seat_assignment" USING btree ("organization_id","member_id");--> statement-breakpoint
CREATE INDEX "seat_assignment_organizationId_idx" ON "seat_assignment" USING btree ("organization_id");