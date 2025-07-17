import { boolean, jsonb, pgTable, varchar, uuid, integer, index, unique } from "drizzle-orm/pg-core";
import type { ChartConfigData, ChartData } from "@/types/charts";
import type { AnnotationData } from "@/types/annotations";
import type { LensConfig } from "@/types/lens";
import { users } from "./authSchema";

// Re-export auth tables from authSchema
export { users, accounts, sessions, verificationTokens, authenticators } from "./authSchema";

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 256 }).references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    public: boolean("public").default(false).notNull(),
});

export const chartTypes = [
    "line",
    "heatmap",
] as const;

export const charts = pgTable("charts", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),

    // Data used to display the chart
    data: jsonb("data").$type<ChartData>(),
    type: varchar("type", { enum: chartTypes, length: 32 }),
});

export const configTypes = [
    "lens",
    "patch",
] as const;

export const chartConfigs = pgTable("chart_configs", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),

    data: jsonb("data").$type<ChartConfigData>().notNull(),
    type: varchar("type", { enum: configTypes, length: 32 }).notNull(),
});

export const chartConfigLinks = pgTable("chart_config_links", {
    id: uuid("id").primaryKey().defaultRandom(),
    chartId: uuid("chart_id").references(() => charts.id, { onDelete: "cascade" }).notNull(),
    configId: uuid("config_id").references(() => chartConfigs.id, { onDelete: "cascade" }).notNull(),
});

// Index on chart config and chart ids
// export const chartsWorkspaceIdIdx = index("charts_workspace_id_idx").on(charts.workspaceId);
// export const chartConfigsChartIdIdx = index("chart_configs_chart_id_idx").on(chartConfigs.chartId);

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

export type ChartConfigLink = typeof chartConfigLinks.$inferSelect;
export type NewChartConfigLink = typeof chartConfigLinks.$inferInsert;

export type AnnotationRow = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;

export type AnnotationGroup = typeof annotationGroups.$inferSelect;
export type NewAnnotationGroup = typeof annotationGroups.$inferInsert;

// Full annotation type (matches the interface in @/types/annotations)
export type Annotation = AnnotationRow;

// Specific chart config types
export type LensChartConfig = Omit<ChartConfig, 'data'> & {
    data: LensConfig;
};