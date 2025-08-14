import {
    workspaces as sqliteWorkspaces,
    charts as sqliteCharts,
    configs as sqliteConfigs,
    chartConfigLinks as sqliteChartConfigLinks,
    annotations as sqliteAnnotations,
    documents as sqliteDocuments,
} from './schema.sqlite';
import {
    workspaces as pgWorkspaces,
    charts as pgCharts,
    configs as pgConfigs,
    chartConfigLinks as pgChartConfigLinks,
    annotations as pgAnnotations,
    documents as pgDocuments,
} from './schema.pg';
import type { LensConfigData } from '@/types/lens';
import type { HeatmapData, LineGraphData } from '@/types/charts';
import type { HeatmapAnnotationData } from '@/types/annotations';

// Conditionally export the appropriate schema based on environment
const isLocal = process.env.NEXT_PUBLIC_LOCAL === 'true';

export const workspaces = isLocal ? sqliteWorkspaces : pgWorkspaces;
export const charts = isLocal ? sqliteCharts : pgCharts;
export const configs = isLocal ? sqliteConfigs : pgConfigs;
export const chartConfigLinks = isLocal ? sqliteChartConfigLinks : pgChartConfigLinks;
export const annotations = isLocal ? sqliteAnnotations : pgAnnotations;
export const documents = isLocal ? sqliteDocuments : pgDocuments;

// Generate types from schema
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Chart = typeof charts.$inferSelect;
export type NewChart = typeof charts.$inferInsert;

export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;

export type ChartConfigLink = typeof chartConfigLinks.$inferSelect;
export type NewChartConfigLink = typeof chartConfigLinks.$inferInsert;

export type Annotation = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type HeatmapAnnotation = Omit<Annotation, 'data'> & {
    data: HeatmapAnnotationData;
};

export type HeatmapChart = Omit<Chart, 'data'> & {
    data: HeatmapData;
};

export type LineChart = Omit<Chart, 'data'> & {
    data: LineGraphData;
};

// Specific chart config types
export type LensConfig = Omit<Config, 'data'> & {
    data: LensConfigData;
};