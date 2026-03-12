CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"polar_subscription_id" text NOT NULL,
	"polar_product_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seats" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_organizationId_uidx" ON "subscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscription_polarSubscriptionId_idx" ON "subscription" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");