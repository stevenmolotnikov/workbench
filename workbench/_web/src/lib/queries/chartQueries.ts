"use server";

import { ChartData } from "@/types/charts";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import {
    charts,
    chartConfigs,
    NewChart,
    NewChartConfig,
    Chart,
    ChartConfig,
    LensChartConfig,
} from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

export const setChartConfig = await withAuth(
    async (user: User, configId: string, config: NewChartConfig): Promise<void> => {
        await db.update(chartConfigs).set(config).where(eq(chartConfigs.id, configId));
    }
);

export const addChartConfig = await withAuth(
    async (user: User, config: NewChartConfig): Promise<void> => {
        await db.insert(chartConfigs).values(config);
    }
);

export const deleteChartConfig = await withAuth(
    async (user: User, configId: string): Promise<void> => {
        await db.delete(chartConfigs).where(eq(chartConfigs.id, configId));
    }
);

export const getChartConfig = await withAuth(
    async (user: User, chartId: string): Promise<ChartConfig> => {
        const [chartConfig] = await db
            .select()
            .from(chartConfigs)
            .where(eq(chartConfigs.chartId, chartId));
        return chartConfig;
    }
);

export const setChartData = await withAuth(
    async (user: User, chartId: string, chartData: ChartData): Promise<void> => {
        await db.update(charts).set({ data: chartData }).where(eq(charts.id, chartId));
    }
);

export const getChartData = await withAuth(
    async (user: User, chartId: string): Promise<ChartData | null> => {
        const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
        return chart?.data as ChartData | null;
    }
);

export const getCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
        const chartsData = await db
            .select()
            .from(charts)
            .where(eq(charts.workspaceId, workspaceId));

        return chartsData;
    }
);

export const getLensCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
        const chartsData = await db
            .select()
            .from(charts)
            .where(and(eq(charts.workspaceId, workspaceId), LENS_CHART_TYPES));

        return chartsData;
    }
);

export const getLensChartConfig = await withAuth(
    async (user: User, chartId: string): Promise<LensChartConfig | null> => {
        const chartConfigsData = await db
            .select()
            .from(chartConfigs)
            .innerJoin(charts, eq(chartConfigs.chartId, charts.id))
            .where(and(eq(chartConfigs.chartId, chartId), LENS_CHART_TYPES));

        if (chartConfigsData.length !== 1) {
            console.error("Expected 1 chart config, got " + chartConfigsData.length);
            return null;
        }

        return chartConfigsData[0].chart_configs as LensChartConfig;
    }
);

export const getLensChartConfigs = await withAuth(
    async (user: User, workspaceId: string): Promise<LensChartConfig[]> => {
        const chartConfigsData = await db
            .select()
            .from(chartConfigs)
            .where(and(eq(chartConfigs.workspaceId, workspaceId), eq(chartConfigs.type, "lens")));

        return chartConfigsData as LensChartConfig[];
    }
);

const getInitialChartConfig = (chartType: string): NewChartConfig => {
    switch (chartType) {
        case "lensLine":
        case "lensHeatmap":
            return { data: { completions: [] } } as NewChartConfig;
        default:
            return {} as NewChartConfig;
    }
};

export const createChart = await withAuth(async (user: User, chart: NewChart): Promise<void> => {
    if (!chart.workspaceId) {
        throw new Error("workspaceId is required");
    }

    // Insert the chart
    const [newChart] = await db.insert(charts).values(chart).returning();

    // Create initial chart config based on chart type
    const newChartConfig: NewChartConfig = getInitialChartConfig(chart.type);

    // Insert the chart config
    await db.insert(chartConfigs).values({
        chartId: newChart.id,
        data: newChartConfig.data,
    });
});
