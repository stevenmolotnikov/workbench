import { boolean, integer, jsonb, pgTable, serial, text, varchar, uuid } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull().unique(),
    password: varchar("password", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }),
});

export const workspaceTypes = ["patching", "logit_lens"] as const;

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    name: varchar("name", { length: 256 }),
    type: varchar("type", { enum: workspaceTypes, length: 32 }),
    public: boolean("public").default(false),
});

export const chartTypes = ["patching", "logit_lens"] as const;

export const charts = pgTable("charts", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    name: varchar("name", { length: 128 }),
    type: varchar("type", { enum: chartTypes, length: 32 }),
    data: jsonb("data"),
});

export const annotations = pgTable("annotations", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id),
    groupId: uuid("group_id").references(() => annotationGroups.id),
    text: text("text"),
});

export const annotationGroups = pgTable("annotation_groups", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id),
    name: varchar("name", { length: 256 }),
});


/*
##############
# LOGIT LENS #
##############
*/


export const lensWorkspace = pgTable("lens_workspace", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    data: jsonb("data"),
});


/*
#######################
# ACTIVATION PATCHING #
#######################
*/

export const patchingWorkspaces = pgTable("patching_workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    data: jsonb("data"),
});

