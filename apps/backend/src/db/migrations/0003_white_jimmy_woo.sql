CREATE TABLE "library_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"library_id" uuid NOT NULL,
	"template_id" varchar(255) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" uuid NOT NULL,
	"notes" text,
	"tags" text[],
	"order" integer,
	CONSTRAINT "unique_library_template" UNIQUE("library_id","template_id")
);
--> statement-breakpoint
ALTER TABLE "library_memberships" ADD CONSTRAINT "library_memberships_library_id_libraries_id_fk" FOREIGN KEY ("library_id") REFERENCES "public"."libraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_memberships" ADD CONSTRAINT "library_memberships_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_memberships" ADD CONSTRAINT "library_memberships_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_library_memberships_library" ON "library_memberships" USING btree ("library_id");--> statement-breakpoint
CREATE INDEX "idx_library_memberships_template" ON "library_memberships" USING btree ("template_id");