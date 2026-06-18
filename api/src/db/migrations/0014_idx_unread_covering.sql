DROP INDEX "articles_feed_idx";--> statement-breakpoint
DROP INDEX "reads_user_idx";--> statement-breakpoint
DROP INDEX "articles_feed_created_at_idx";--> statement-breakpoint
CREATE INDEX "articles_feed_created_at_idx" ON "articles" USING btree ("feed_id","created_at","id");