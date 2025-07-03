import { boolean, integer, jsonb, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 256 }),
    name: varchar("name", { length: 256 }),
});

export const workspaces = pgTable("workspaces", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
    public: boolean("public").default(false),
});

export const chartTypes = ["patching", "logit_lens"] as const;

export const charts = pgTable("charts", {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id").references(() => workspaces.id),
    name: varchar("name", { length: 128 }),
    type: varchar("type", { enum: chartTypes, length: 32 }),
    data: jsonb("data"),
});

export const annotations = pgTable("annotations", {
    id: serial("id").primaryKey(),
    chartId: integer("chart_id").references(() => charts.id),
    groupId: integer("group_id").references(() => annotationGroups.id),
    text: text("text"),
});

export const annotationGroups = pgTable("annotation_groups", {
    id: serial("id").primaryKey(),
    chartId: integer("chart_id").references(() => charts.id),
    name: varchar("name", { length: 256 }),
});


/*
##############
# LOGIT LENS #
##############
*/


export const lensWorkspace = pgTable("lens_workspace", {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id").references(() => workspaces.id),
    data: jsonb("data"),
});


/*
#######################
# ACTIVATION PATCHING #
#######################
*/

// Contains information on edits and metrics
export const patchingWorkspaces = pgTable("patching_workspaces", {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id").references(() => workspaces.id),
    data: jsonb("data"),
});

