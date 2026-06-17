CREATE TABLE "replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" text NOT NULL,
	"reply_id" text NOT NULL,
	"content" text DEFAULT '',
	"content_rendered" text DEFAULT '',
	"author" jsonb DEFAULT '{"name":"","url":"","avatar":""}'::jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "replies_topic_reply_idx" ON "replies" USING btree ("topic_id","reply_id");--> statement-breakpoint
CREATE INDEX "replies_topic_created_idx" ON "replies" USING btree ("topic_id","created_at");