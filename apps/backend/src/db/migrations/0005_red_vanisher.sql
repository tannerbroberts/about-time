CREATE TABLE "template_variables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar(255) NOT NULL,
	"variable_name" varchar(255) NOT NULL,
	"variable_type" varchar(10) NOT NULL,
	"nominal_value" bigint NOT NULL,
	"lower_bound" bigint,
	"upper_bound" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_template_variable" UNIQUE("template_id","variable_name","variable_type")
);
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_library_id_libraries_id_fk";
--> statement-breakpoint
ALTER TABLE "template_variables" ADD CONSTRAINT "template_variables_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_template_variables_template" ON "template_variables" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_template_variables_name" ON "template_variables" USING btree ("variable_name");--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "library_id";