CREATE TABLE "libraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"lane_template_id" varchar(255),
	"owner_id" uuid NOT NULL,
	"visibility" varchar(10) DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"template_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_lane_template_id_templates_id_fk" FOREIGN KEY ("lane_template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_libraries_owner" ON "libraries" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_libraries_lane" ON "libraries" USING btree ("lane_template_id");