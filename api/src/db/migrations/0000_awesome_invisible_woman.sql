CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"duplicate_of_id" uuid,
	"url" text DEFAULT '',
	"canonical_url" text,
	"guid" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '',
	"content" text DEFAULT '',
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"type" text NOT NULL,
	"images" jsonb DEFAULT '{"featured":"","banner":"","icon":"","og":""}'::jsonb,
	"author" jsonb DEFAULT '{"name":"","url":"","avatar":""}'::jsonb,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"fingerprint" text NOT NULL,
	"date_published" timestamp DEFAULT now(),
	"date_modified" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blocklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"blocklist" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"article_id" uuid NOT NULL,
	"title" text NOT NULL,
	"image" text,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"date_published" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duplicate_of_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"feed_url" text NOT NULL,
	"feed_urls" jsonb DEFAULT '[]'::jsonb,
	"feed_type" text,
	"canonical_url" text,
	"type" text,
	"description" text DEFAULT '',
	"images" jsonb DEFAULT '{"featured":"","banner":"","favicon":"","icon":"","og":""}'::jsonb,
	"featured" boolean DEFAULT false,
	"full_text" boolean DEFAULT false,
	"date_published" timestamp DEFAULT now(),
	"date_modified" timestamp DEFAULT now(),
	"likes" integer DEFAULT 0,
	"valid" boolean DEFAULT true,
	"language" text DEFAULT '',
	"fingerprint" text NOT NULL,
	"last_scraped" timestamp DEFAULT now(),
	"scrape_interval" integer DEFAULT 0,
	"consecutive_scrape_failures" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feed_id" uuid NOT NULL,
	"folder_id" uuid,
	"alias" text,
	"primary" boolean DEFAULT true,
	"full_text" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"open" boolean DEFAULT false,
	"playing" boolean DEFAULT false,
	"played" double precision DEFAULT 0 NOT NULL,
	"duration" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"amount" text NOT NULL,
	"country" text,
	"coupon" text,
	"payout_date" timestamp NOT NULL,
	"next_bill_date" timestamp,
	"next_payment_amount" text,
	"status" text NOT NULL,
	"order_id" text NOT NULL,
	"checkout_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"payment_method" text,
	"payment_user_id" text NOT NULL,
	"payment_subscription_id" text NOT NULL,
	"refund_date" timestamp NOT NULL,
	"refund_type" text,
	"refund_reason" text,
	"receipt_url" text,
	"update_url" text,
	"cancel_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slogan" text DEFAULT '',
	"product_id" text DEFAULT '',
	"billing_period" integer DEFAULT 1 NOT NULL,
	"billing_type" text DEFAULT 'month' NOT NULL,
	"base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"features" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"article_id" uuid,
	"view" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"tag_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'inactive' NOT NULL,
	"payment_subscription_id" text,
	"payout_date" timestamp,
	"next_bill_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text DEFAULT '',
	"bio" text DEFAULT '',
	"url" text DEFAULT '',
	"background" text DEFAULT '',
	"recovery_code" text DEFAULT '',
	"admin" boolean DEFAULT false,
	"suspended" boolean DEFAULT false,
	"active_at" timestamp DEFAULT now(),
	"settings" jsonb DEFAULT '{"unreadOnly":false,"mobileHideSidebar":true,"fontSize":0,"textSize":0,"language":""}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_duplicate_of_id_articles_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_duplicate_of_id_feeds_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."feeds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listens" ADD CONSTRAINT "listens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listens" ADD CONSTRAINT "listens_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reads" ADD CONSTRAINT "reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reads" ADD CONSTRAINT "reads_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stars" ADD CONSTRAINT "stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stars" ADD CONSTRAINT "stars_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_feed_idx" ON "articles" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "articles_duplicate_of_idx" ON "articles" USING btree ("duplicate_of_id");--> statement-breakpoint
CREATE INDEX "articles_url_idx" ON "articles" USING btree ("url");--> statement-breakpoint
CREATE INDEX "articles_guid_idx" ON "articles" USING btree ("guid");--> statement-breakpoint
CREATE INDEX "articles_title_idx" ON "articles" USING btree ("title");--> statement-breakpoint
CREATE INDEX "articles_type_idx" ON "articles" USING btree ("type");--> statement-breakpoint
CREATE INDEX "articles_fingerprint_idx" ON "articles" USING btree ("fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_feed_guid_idx" ON "articles" USING btree ("feed_id","guid");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_feed_fingerprint_idx" ON "articles" USING btree ("feed_id","fingerprint");--> statement-breakpoint
CREATE INDEX "articles_feed_created_at_idx" ON "articles" USING btree ("feed_id","created_at");--> statement-breakpoint
CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "articles_views_idx" ON "articles" USING btree ("views");--> statement-breakpoint
CREATE UNIQUE INDEX "blocklists_key_idx" ON "blocklists" USING btree ("key");--> statement-breakpoint
CREATE INDEX "blocklists_created_at_idx" ON "blocklists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blocklists_updated_at_idx" ON "blocklists" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_url_idx" ON "contents" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_article_idx" ON "contents" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "contents_created_at_idx" ON "contents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contents_updated_at_idx" ON "contents" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "feeds_duplicate_of_idx" ON "feeds" USING btree ("duplicate_of_id");--> statement-breakpoint
CREATE INDEX "feeds_title_idx" ON "feeds" USING btree ("title");--> statement-breakpoint
CREATE INDEX "feeds_url_idx" ON "feeds" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "feeds_feed_url_idx" ON "feeds" USING btree ("feed_url");--> statement-breakpoint
CREATE INDEX "feeds_feed_urls_gin_idx" ON "feeds" USING gin ("feed_urls");--> statement-breakpoint
CREATE INDEX "feeds_feed_type_idx" ON "feeds" USING btree ("feed_type");--> statement-breakpoint
CREATE INDEX "feeds_type_idx" ON "feeds" USING btree ("type");--> statement-breakpoint
CREATE INDEX "feeds_featured_idx" ON "feeds" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "feeds_valid_idx" ON "feeds" USING btree ("valid");--> statement-breakpoint
CREATE INDEX "feeds_fingerprint_idx" ON "feeds" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "feeds_last_scraped_idx" ON "feeds" USING btree ("last_scraped");--> statement-breakpoint
CREATE INDEX "feeds_scrape_interval_idx" ON "feeds" USING btree ("scrape_interval");--> statement-breakpoint
CREATE INDEX "feeds_consecutive_scrape_failures_idx" ON "feeds" USING btree ("consecutive_scrape_failures");--> statement-breakpoint
CREATE INDEX "feeds_created_at_idx" ON "feeds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feeds_updated_at_idx" ON "feeds" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "folders_user_name_idx" ON "folders" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "folders_user_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "folders_created_at_idx" ON "folders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "folders_updated_at_idx" ON "folders" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "follows_user_idx" ON "follows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follows_feed_idx" ON "follows" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "follows_folder_idx" ON "follows" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "follows_alias_idx" ON "follows" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "follows_primary_idx" ON "follows" USING btree ("primary");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_user_feed_folder_idx" ON "follows" USING btree ("user_id","feed_id","folder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_user_feed_alias_idx" ON "follows" USING btree ("user_id","feed_id","alias");--> statement-breakpoint
CREATE INDEX "follows_created_at_idx" ON "follows" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "follows_updated_at_idx" ON "follows" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "listens_user_idx" ON "listens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "listens_article_idx" ON "listens" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listens_user_article_idx" ON "listens" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "listens_created_at_idx" ON "listens" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "listens_updated_at_idx" ON "listens" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_subscription_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_payment_id_idx" ON "payments" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_name_idx" ON "plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX "plans_created_at_idx" ON "plans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "plans_updated_at_idx" ON "plans" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "reads_user_idx" ON "reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reads_article_idx" ON "reads" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "reads_view_idx" ON "reads" USING btree ("view");--> statement-breakpoint
CREATE UNIQUE INDEX "reads_user_article_idx" ON "reads" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "reads_user_article_view_idx" ON "reads" USING btree ("user_id","article_id","view");--> statement-breakpoint
CREATE INDEX "reads_created_at_idx" ON "reads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reads_updated_at_idx" ON "reads" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "stars_user_idx" ON "stars" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stars_article_idx" ON "stars" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stars_user_article_idx" ON "stars" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "stars_tag_ids_gin_idx" ON "stars" USING gin ("tag_ids");--> statement-breakpoint
CREATE INDEX "stars_created_at_idx" ON "stars" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stars_updated_at_idx" ON "stars" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_plan_idx" ON "subscriptions" USING btree ("user_id","plan_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "tags_user_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_admin_idx" ON "users" USING btree ("admin");--> statement-breakpoint
CREATE INDEX "users_suspended_idx" ON "users" USING btree ("suspended");--> statement-breakpoint
CREATE INDEX "users_active_at_idx" ON "users" USING btree ("active_at");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");