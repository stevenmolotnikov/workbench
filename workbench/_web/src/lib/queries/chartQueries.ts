"use server";

import { ChartData } from "@/types/charts";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { charts, chartConfigs, NewChart, NewChartConfig, Chart, ChartConfig, LensChartConfig } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { LensConfig } from "@/types/lens";

export const setChartConfig = await withAuth(
    async (user: User, chartId: string, config: NewChartConfig): Promise<void> => {
        await db
            .update(chartConfigs)
            .set(config)
            .where(eq(chartConfigs.chartId, chartId));
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

const LENS_CHART_TYPES = or(eq(charts.type, "lensLine"), eq(charts.type, "lensHeatmap"));

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
            .where(
                and(
                    eq(chartConfigs.chartId, chartId),
                    LENS_CHART_TYPES
                )
            );

        if (chartConfigsData.length !== 1) {
            console.error("Expected 1 chart config, got " + chartConfigsData.length);
            return null;
        }

        return chartConfigsData[0].chart_configs as LensChartConfig;
    }
);

export const getLensChartByPosition = await withAuth(
    async (user: User, workspaceId: string, position: number): Promise<Chart> => {
        const chartsData = await db
            .select()
            .from(charts)
            .where(
                and(
                    eq(charts.workspaceId, workspaceId),
                    eq(charts.position, position),
                    LENS_CHART_TYPES
                )
            );

        if (chartsData.length !== 1) {
            throw new Error("Expected 1 chart, got " + chartsData.length);
        }

        return chartsData[0];
    }
);

export const getLensChartConfigByPosition = await withAuth(
    async (user: User, workspaceId: string, position: number): Promise<LensChartConfig | null> => {
        const chartConfigsData = await db
            .select()
            .from(chartConfigs)
            .innerJoin(charts, eq(chartConfigs.chartId, charts.id))
            .where(
                and(
                    eq(charts.workspaceId, workspaceId),
                    eq(charts.position, position),
                    LENS_CHART_TYPES
                )
            );

        if (chartConfigsData.length !== 1) {
            return null;
        }

        return chartConfigsData[0].chart_configs as LensChartConfig;
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
}

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
        data: newChartConfig.data
    });
});
