CREATE TABLE "annotation_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"chart_id" integer,
	"name" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"chart_id" integer,
	"group_id" integer,
	"text" text
);
--> statement-breakpoint
CREATE TABLE "charts" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"name" varchar(128),
	"type" varchar(32),
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "lens_workspace" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "patching_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(256),
	"name" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"public" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "annotation_groups" ADD CONSTRAINT "annotation_groups_chart_id_charts_id_fk" FOREIGN KEY ("chart_id") REFERENCES "public"."charts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_chart_id_charts_id_fk" FOREIGN KEY ("chart_id") REFERENCES "public"."charts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_group_id_annotation_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."annotation_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charts" ADD CONSTRAINT "charts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lens_workspace" ADD CONSTRAINT "lens_workspace_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patching_workspaces" ADD CONSTRAINT "patching_workspaces_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;