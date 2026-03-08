ALTER TABLE "composite_unit_definitions" DROP CONSTRAINT "composite_unit_definitions_origin_composite_id_composite_unit_definitions_id_fk";
--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "origin_template_id" varchar(255);--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "origin_author_id" uuid;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "link_type" varchar(20) DEFAULT 'original' NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "visibility" varchar(10) DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "allow_forking" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "allow_live_linking" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_templates_origin" ON "templates" USING btree ("origin_template_id");--> statement-breakpoint
CREATE INDEX "idx_templates_origin_author" ON "templates" USING btree ("origin_author_id");--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "check_link_type" CHECK (link_type IN ('original', 'forked', 'live-linked'));--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "check_visibility" CHECK (visibility IN ('private', 'unlisted', 'public'));