"use server";

import { ChartData } from "@/types/charts";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import {
    charts,
    chartConfigs,
    chartConfigLinks,
    NewChart,
    Chart,
    LensChartConfig,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";


export const setChartData = await withAuth(
    async (user: User, chartId: string, chartData: ChartData): Promise<void> => {
        await db.update(charts).set({ data: chartData }).where(eq(charts.id, chartId));
    }
);

export const getChartData = await withAuth(
    async (user: User, chartId: string): Promise<ChartData> => {
        const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
        return chart?.data as ChartData;
    }
);

export const getLensCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
        const chartsData = await db
            .select()
            .from(charts)
            .innerJoin(chartConfigLinks, eq(charts.id, chartConfigLinks.chartId))
            .innerJoin(chartConfigs, eq(chartConfigLinks.configId, chartConfigs.id))
            .where(and(eq(charts.workspaceId, workspaceId), eq(chartConfigs.type, "lens")));

        return chartsData.map(({charts,}) => charts);
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

export const createChart = await withAuth(async (user: User, chart: NewChart): Promise<Chart> => {
    const [createdChart] = await db.insert(charts).values(chart).returning();
    return createdChart;
});

export const deleteChart = await withAuth(async (user: User, chartId: string): Promise<void> => {
    await db.delete(charts).where(eq(charts.id, chartId));
});
