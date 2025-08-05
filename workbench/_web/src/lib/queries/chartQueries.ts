"use server";

import { ChartData } from "@/types/charts";
import { db } from "@/db/client";
import { charts, configs, chartConfigLinks, NewChart, Chart, LensConfig } from "@/db/schema";
import { LensConfigData } from "@/types/lens";
import { eq, and, asc, notExists } from "drizzle-orm";

export const setChartData = async (chartId: string, configId: string, chartData: ChartData) => {
    const hasLinkedConfig = await getHasLinkedConfig(chartId);
    if (!hasLinkedConfig) {
        await db.insert(chartConfigLinks).values({
            chartId,
            configId,
        });
    }

    await db.update(charts).set({ data: chartData }).where(eq(charts.id, chartId));
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

export const getOrCreateLensCharts = async (
    workspaceId: string,
    fallbackChart: NewChart
): Promise<{ lensCharts: Chart[]; unlinkedCharts: Chart[] }> => {
    const existingCharts = await getLensCharts(workspaceId);
    const unlinkedCharts = await getUnlinkedCharts(workspaceId);

    // If there are unlinked charts, return that
    if (unlinkedCharts.length > 0 || existingCharts.length > 0) {
        return { lensCharts: existingCharts, unlinkedCharts: unlinkedCharts };
    }

    const [newChart] = await db.insert(charts).values(fallbackChart).returning();

    return { lensCharts: [], unlinkedCharts: [newChart] };
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

export const getUnlinkedCharts = async (workspaceId: string): Promise<Chart[]> => {
    const unlinkedCharts = await db
        .select()
        .from(charts)
        .where(
            and(
                eq(charts.workspaceId, workspaceId),
                notExists(
                    db
                        .select()
                        .from(chartConfigLinks)
                        .where(eq(chartConfigLinks.chartId, charts.id))
                )
            )
        );

    return unlinkedCharts;
};
