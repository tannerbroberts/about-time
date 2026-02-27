ALTER TABLE "templates" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "author_display_name" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_templates_public" ON "templates" USING btree ("is_public","published_at");--> statement-breakpoint
CREATE INDEX "idx_templates_public_type" ON "templates" USING btree ("is_public","template_type","published_at");