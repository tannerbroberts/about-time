CREATE TABLE "composite_unit_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"composition" jsonb NOT NULL,
	"author_id" uuid NOT NULL,
	"origin_composite_id" uuid,
	"link_type" varchar(20) DEFAULT 'original' NOT NULL,
	"changelog" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_composite_name_author_version" UNIQUE("name","author_id","version")
);
--> statement-breakpoint
ALTER TABLE "composite_unit_definitions" ADD CONSTRAINT "composite_unit_definitions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "composite_unit_definitions" ADD CONSTRAINT "composite_unit_definitions_origin_composite_id_composite_unit_definitions_id_fk" FOREIGN KEY ("origin_composite_id") REFERENCES "public"."composite_unit_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_composites_author" ON "composite_unit_definitions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_composites_name" ON "composite_unit_definitions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_composites_origin" ON "composite_unit_definitions" USING btree ("origin_composite_id");--> statement-breakpoint
ALTER TABLE "composite_unit_definitions" ADD CONSTRAINT "check_link_type" CHECK (link_type IN ('original', 'forked', 'live-linked'));