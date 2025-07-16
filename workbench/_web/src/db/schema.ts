import { boolean, jsonb, pgTable, varchar, uuid, integer, index, unique } from "drizzle-orm/pg-core";
import type { ChartConfigData, ChartData } from "@/types/charts";
import type { AnnotationData } from "@/types/annotations";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull().unique(),
    password: varchar("password", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }),
});

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    public: boolean("public").default(false).notNull(),
});

export const chartTypes = [
    "lensLine",
    "lensHeatmap",
    "patchingHeatmap",
] as const;

export const charts = pgTable("charts", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),

    // Data used to display the chart
    data: jsonb("data").$type<ChartData>(),
    type: varchar("type", { enum: chartTypes, length: 32 }).notNull(),

    // Layout position in the grid
    position: integer("position").notNull(),
});

export const chartConfigs = pgTable("chart_configs", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id, { onDelete: "cascade" }),

    data: jsonb("data").$type<ChartConfigData>().notNull(),
});

// Index on chart config and chart ids
export const chartsWorkspaceIdIdx = index("charts_workspace_id_idx").on(charts.workspaceId);
export const chartConfigsChartIdIdx = index("chart_configs_chart_id_idx").on(chartConfigs.chartId);

// Constraint on workspace id and position
export const chartsWorkspacePositionUnique = unique("charts_workspace_position_unique").on(charts.workspaceId, charts.position);

export const annotationTypes = ["point", "heatmap", "token", "range"] as const;

export const annotations = pgTable("annotations", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id, { onDelete: "cascade" }).notNull(),
    groupId: uuid("group_id").references(() => annotationGroups.id, { onDelete: "set null" }),
    
    type: varchar("type", { enum: annotationTypes, length: 32 }).notNull(),
    data: jsonb("data").$type<AnnotationData>().notNull(),
});

export const annotationGroups = pgTable("annotation_groups", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }),
});

// Generate types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Chart = typeof charts.$inferSelect;
export type NewChart = typeof charts.$inferInsert;

export type ChartConfig = typeof chartConfigs.$inferSelect;
export type NewChartConfig = typeof chartConfigs.$inferInsert;

export type AnnotationRow = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;

export type AnnotationGroup = typeof annotationGroups.$inferSelect;
export type NewAnnotationGroup = typeof annotationGroups.$inferInsert;

// Full annotation type (matches the interface in @/types/annotations)
export type Annotation = AnnotationRow;