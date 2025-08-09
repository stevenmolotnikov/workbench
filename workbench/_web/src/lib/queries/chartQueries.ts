"use server";

import { ChartData } from "@/types/charts";
import { db } from "@/db/client";
import { charts, configs, chartConfigLinks, NewChart, Chart, LensConfig } from "@/db/schema";
import { LensConfigData } from "@/types/lens";
import { eq, and, asc, notExists, or } from "drizzle-orm";

export const setChartData = async (chartId: string, chartData: ChartData, chartType: "line" | "heatmap") => {
    await db.update(charts).set({ data: chartData, type: chartType }).where(eq(charts.id, chartId));
};

export const getChartData = async (chartId: string): Promise<ChartData> => {
    const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
    return chart?.data as ChartData;
};

export const getLensCharts = async (workspaceId: string): Promise<Chart[]> => {
    const chartsData = await db
        .select()
        .from(charts)
        .innerJoin(chartConfigLinks, eq(charts.id, chartConfigLinks.chartId))
        .innerJoin(configs, eq(chartConfigLinks.configId, configs.id))
        .where(and(eq(charts.workspaceId, workspaceId), eq(configs.type, "lens")));

    return chartsData.map(({ charts }) => charts);
};

export const getLensConfigs = async (workspaceId: string): Promise<LensConfig[]> => {
    const configsData = await db
        .select()
        .from(configs)
        .where(and(eq(configs.workspaceId, workspaceId), eq(configs.type, "lens")))
        .orderBy(asc(configs.createdAt));

    return configsData as LensConfig[];
};

export const createChart = async (chart: NewChart): Promise<Chart> => {
    const [createdChart] = await db.insert(charts).values(chart).returning();
    return createdChart;
};

export const deleteChart = async (chartId: string): Promise<void> => {
    await db.delete(charts).where(eq(charts.id, chartId));
};

export const getOrCreateLensConfig = async (
    workspaceId: string,
    fallbackConfig: LensConfigData
): Promise<LensConfig> => {
    const existingConfigs = await db
        .select()
        .from(configs)
        .where(and(eq(configs.workspaceId, workspaceId), eq(configs.type, "lens")))
        .orderBy(asc(configs.createdAt))
        .limit(1);

    if (existingConfigs.length > 0) {
        return existingConfigs[0] as LensConfig;
    }

    const [newConfig] = await db
        .insert(configs)
        .values({
            workspaceId,
            type: "lens",
            data: fallbackConfig,
        })
        .returning();

    return newConfig as LensConfig;
};

export const getHasLinkedConfig = async (chartId: string): Promise<boolean> => {
    const linkedConfigs = await db
        .select()
        .from(chartConfigLinks)
        .where(eq(chartConfigLinks.chartId, chartId));

    return linkedConfigs.length > 0;
};

export const getConfigForChart = async (chartId: string): Promise<LensConfig | null> => {
    const rows = await db
        .select()
        .from(configs)
        .innerJoin(chartConfigLinks, eq(configs.id, chartConfigLinks.configId))
        .where(eq(chartConfigLinks.chartId, chartId))
        .limit(1);
    if (rows.length === 0) return null;
    return rows[0].configs as LensConfig;
};

// Create a new chart and config at once. Used in the ChartDisplay.
export const createLensChartPair = async (
    workspaceId: string,
    defaultConfig: LensConfigData
): Promise<{ chart: Chart; config: LensConfig }> => {
    const [newChart] = await db.insert(charts).values({ workspaceId }).returning();
    const [newConfig] = await db
        .insert(configs)
        .values({ workspaceId, type: "lens", data: defaultConfig })
        .returning();
    
    // Create the link between chart and config
    await db.insert(chartConfigLinks).values({
        chartId: newChart.id,
        configId: newConfig.id,
    });
    
    return { chart: newChart as Chart, config: newConfig as LensConfig };
};
