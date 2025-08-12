CREATE TABLE `annotations` (
	`id` text PRIMARY KEY NOT NULL,
	`chart_id` text NOT NULL,
	`data` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chart_config_links` (
	`id` text PRIMARY KEY NOT NULL,
	`chart_id` text NOT NULL,
	`config_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `charts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`data` text,
	`type` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `configs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`data` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`public` integer DEFAULT false NOT NULL
);
