import { boolean, integer, jsonb, pgTable, serial, text, varchar, uuid } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull().unique(),
    password: varchar("password", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }),
});

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    name: varchar("name", { length: 256 }),
    public: boolean("public").default(false),
});

export const collectionTypes = ["lens", "patching"] as const;

export const collections = pgTable("collections", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    type: varchar("type", { enum: collectionTypes, length: 32 }),
    data: jsonb("data"),
});

export const chartTypes = ["heatmap", "line"] as const;

export const charts = pgTable("charts", {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id").references(() => collections.id),
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