CREATE TABLE "replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"source" text DEFAULT 'v2ex' NOT NULL,
	"source_id" text NOT NULL,
	"floor" integer DEFAULT 0,
	"content" text DEFAULT '',
	"content_rendered" text DEFAULT '',
	"author" jsonb DEFAULT '{"name":"","url":"","avatar":""}'::jsonb,
	"thanks" integer DEFAULT 0,
	"date_published" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "replies_fetched_at" timestamp;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "replies_article_source_idx" ON "replies" USING btree ("article_id","source_id");--> statement-breakpoint
CREATE INDEX "replies_article_floor_idx" ON "replies" USING btree ("article_id","floor");