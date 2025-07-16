"use server";

import { ChartData, ChartConfig } from "@/types/charts";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { charts, chartConfigs, NewChart, Chart, ChartConfig } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { LensConfig } from "@/types/lens";

export const setChartConfig = await withAuth(
    async (
        user: User,
        chartId: string,
        config: ChartConfig
    ): Promise<void> => {
        await db.update(chartConfigs).set({ data: config }).where(eq(chartConfigs.chartId, chartId));
    }
);

export const getChartConfig = await withAuth(
    async (user: User, chartId: string): Promise<ChartConfig | null> => {
        const [chartConfig] = await db.select().from(chartConfigs).where(eq(chartConfigs.chartId, chartId));
        return chartConfig?.data as ChartConfig | null;
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

const LENS_CHART_TYPES = or(
    eq(charts.type, "lensLine"),
    eq(charts.type, "lensHeatmap")
);

export const getLensCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
        const chartsData = await db
            .select()
            .from(charts)
            .where(
                and(
                    eq(charts.workspaceId, workspaceId),
                    LENS_CHART_TYPES
                ));

        return chartsData;
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
    async (user: User, workspaceId: string, position: number): Promise<ChartConfig> => {
        const chartConfigsData = await db
            .select({
                data: chartConfigs.data
            })
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
            throw new Error("Expected 1 chart config, got " + chartConfigsData.length);
        }

        return chartConfigsData[0];
    }
);

export const createChart = await withAuth(
    async (
        user: User,
        chart: NewChart,
    ): Promise<void> => {
        if (!chart.workspaceId) {
            throw new Error("workspaceId is required");
        }

        await db
            .insert(charts)
            .values(chart);
    }
);
