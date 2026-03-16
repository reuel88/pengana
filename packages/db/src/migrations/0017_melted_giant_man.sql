CREATE INDEX "media_user_id_idx" ON "media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_organization_id_idx" ON "media" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "media_created_by_idx" ON "media" USING btree ("created_by");