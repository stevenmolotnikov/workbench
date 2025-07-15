import { boolean, jsonb, pgTable, text, varchar, uuid, integer } from "drizzle-orm/pg-core";
import type { ChartData } from "@/types/charts";
import type { WorkspaceData } from "@/types/workspace";
import type { Annotation } from "@/types/annotations";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull().unique(),
    password: varchar("password", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }),
});

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    name: varchar("name", { length: 256 }).notNull(),
    public: boolean("public").default(false).notNull(),
});

export const collectionTypes = ["lens", "patching"] as const;
export const chartTypes = ["line", "heatmap"] as const;

export const charts = pgTable("charts", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),

    // Data used to generate the chart
    workspaceType: varchar("workspace_type", { enum: collectionTypes, length: 32 }).notNull(),
    workspaceData: jsonb("workspaceData").$type<WorkspaceData[keyof WorkspaceData]>(),

    // Data used to display the chart
    chartType: varchar("chart_type", { enum: chartTypes, length: 32 }).notNull(),
    chartData: jsonb("chartData").$type<ChartData[keyof ChartData]>(),
    
    // Layout position in the grid
    position: integer("position").notNull(),
});

export const annotationTypes = ["point", "heatmap", "token", "range"] as const;

export const annotations = pgTable("annotations", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id).notNull(),
    groupId: uuid("group_id").references(() => annotationGroups.id),
    
    type: varchar("type", { enum: annotationTypes, length: 32 }).notNull(),
    data: jsonb("data").$type<Annotation>().notNull(),
});

export const annotationGroups = pgTable("annotation_groups", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id),
    name: varchar("name", { length: 256 }),
});