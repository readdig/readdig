DROP INDEX "reads_user_view_idx";--> statement-breakpoint
CREATE INDEX "reads_user_view_created_at_idx" ON "reads" USING btree ("user_id","created_at") WHERE "reads"."view" = true;