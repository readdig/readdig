DROP INDEX "follows_primary_idx";--> statement-breakpoint
DROP INDEX "reads_view_idx";--> statement-breakpoint
DROP INDEX "reads_user_article_view_idx";--> statement-breakpoint
CREATE INDEX "feeds_duplicate_valid_idx" ON "feeds" USING btree ("duplicate_of_id","valid");--> statement-breakpoint
CREATE INDEX "follows_user_primary_idx" ON "follows" USING btree ("user_id","primary");--> statement-breakpoint
CREATE INDEX "reads_user_view_idx" ON "reads" USING btree ("user_id","view");