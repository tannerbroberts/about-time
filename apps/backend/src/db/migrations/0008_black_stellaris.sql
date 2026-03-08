ALTER TABLE "library_memberships" ADD COLUMN "last_used_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "library_memberships" ADD COLUMN "usage_count" integer DEFAULT 0 NOT NULL;