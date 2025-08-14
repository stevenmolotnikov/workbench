"use server";

import type { ChartData, ChartMetadata, ChartView } from "@/types/charts";
import { db } from "@/db/client";
import { charts, configs, chartConfigLinks, Chart, LensConfig, Config } from "@/db/schema";
import { LensConfigData } from "@/types/lens";
import { PatchingConfig } from "@/types/patching";
import { eq, desc } from "drizzle-orm";

export const setChartData = async (chartId: string, chartData: ChartData, chartType: "line" | "heatmap") => {
    await db.update(charts).set({ data: chartData, type: chartType }).where(eq(charts.id, chartId));
};

export const updateChartName = async (chartId: string, name: string) => {
    await db.update(charts).set({ name }).where(eq(charts.id, chartId));
};

export const getChartById = async (chartId: string): Promise<Chart | null> => {
    const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
    return (chart ?? null) as Chart | null;
};

export const getChartView = async (chartId: string): Promise<ChartView | null> => {
    const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
    return (chart?.view ?? null) as ChartView | null;
};

export const updateChartView = async (chartId: string, view: ChartView) => {
    await db.update(charts).set({ view }).where(eq(charts.id, chartId));
};

export const deleteChart = async (chartId: string): Promise<void> => {
    await db.delete(charts).where(eq(charts.id, chartId));
};

export const getConfigForChart = async (chartId: string): Promise<Config | null> => {
    const rows = await db
        .select()
        .from(configs)
        .innerJoin(chartConfigLinks, eq(configs.id, chartConfigLinks.configId))
        .where(eq(chartConfigLinks.chartId, chartId))
        .limit(1);
    if (rows.length === 0) return null;
    return rows[0].configs as Config;
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

// Create a new patch chart and config pair
export const createPatchChartPair = async (
    workspaceId: string,
    defaultConfig: PatchingConfig
): Promise<{ chart: Chart; config: Config }> => {
    const [newChart] = await db.insert(charts).values({ workspaceId }).returning();
    const [newConfig] = await db
        .insert(configs)
        .values({ workspaceId, type: "patch", data: defaultConfig })
        .returning();
    
    // Create the link between chart and config
    await db.insert(chartConfigLinks).values({
        chartId: newChart.id,
        configId: newConfig.id,
    });
    
    return { chart: newChart as Chart, config: newConfig as Config };
};

export const getAllChartsByType = async (workspaceId?: string): Promise<Record<string, Chart[]>> => {
    // Join charts with their configs to get the config type
    const query = db
        .select({
            chart: charts,
            configType: configs.type,
        })
        .from(charts)
        .leftJoin(chartConfigLinks, eq(charts.id, chartConfigLinks.chartId))
        .leftJoin(configs, eq(chartConfigLinks.configId, configs.id));
    
    const chartsWithConfigs = workspaceId 
        ? await query.where(eq(charts.workspaceId, workspaceId))
        : await query;

    // Group charts by their config type
    const chartsByType: Record<string, Chart[]> = {};
    
    for (const { chart, configType } of chartsWithConfigs) {
        const type = configType || 'unknown';
        if (!chartsByType[type]) {
            chartsByType[type] = [];
        }
        chartsByType[type].push(chart);
    }
    
    return chartsByType;
};

export const getChartsMetadata = async (workspaceId: string): Promise<ChartMetadata[]> => {
    const rows = await db
        .select({
            id: charts.id,
            name: charts.name,
            chartType: charts.type,
            updatedAt: charts.updatedAt,
            toolType: configs.type,
        })
        .from(charts)
        .leftJoin(chartConfigLinks, eq(charts.id, chartConfigLinks.chartId))
        .leftJoin(configs, eq(chartConfigLinks.configId, configs.id))
        .where(eq(charts.workspaceId, workspaceId))
        .groupBy(charts.id, charts.updatedAt, charts.type, configs.type)
        .orderBy(desc(charts.updatedAt));

    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        chartType: (r.chartType as "line" | "heatmap" | null) ?? null,
        toolType: (r.toolType as "lens" | "patch" | null) ?? null,
        updatedAt: r.updatedAt as Date,
    } as ChartMetadata));
};

export const getMostRecentChartForWorkspace = async (workspaceId: string): Promise<Chart | null> => {
    const [chart] = await db
        .select()
        .from(charts)
        .where(eq(charts.workspaceId, workspaceId))
        .orderBy(desc(charts.updatedAt))
        .limit(1);
    
    return (chart ?? null) as Chart | null;
};