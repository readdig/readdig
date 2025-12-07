DROP INDEX "users_admin_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE "admin" = true;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "admin";