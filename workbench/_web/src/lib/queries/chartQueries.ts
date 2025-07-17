"use server";

import { ChartData } from "@/types/charts";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import {
    charts,
    chartConfigs,
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

export const getLensCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
        const chartsData = await db
            .select()
            .from(charts)
            .innerJoin(chartConfigs, eq(charts.id, chartConfigs.chartId))
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

export const createChart = await withAuth(async (user: User, chart: NewChart): Promise<void> => {
    await db.insert(charts).values(chart).returning();
});
