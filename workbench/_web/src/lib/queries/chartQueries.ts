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
    LensConfig,
} from "@/db/schema";
import { LensConfigData } from "@/types/lens";
import { eq, and, asc, notExists } from "drizzle-orm";


export const setChartData = await withAuth(
    async (user: User, chartId: string, configId: string, chartData: ChartData): Promise<void> => {

        const hasLinkedConfig = await getHasLinkedConfig(chartId);
        if (!hasLinkedConfig) {
            await db.insert(chartConfigLinks).values({
                chartId,
                configId,
            });
        }

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


export const getOrCreateLensCharts = await withAuth(
    async (user: User, workspaceId: string, fallbackChart: NewChart): Promise<{lensCharts: Chart[], unlinkedCharts: Chart[]}> => {
        const existingCharts = await getLensCharts(workspaceId);
        const unlinkedCharts = await getUnlinkedCharts(workspaceId);
        
        // If there are unlinked charts, return that
        if (unlinkedCharts.length > 0) {
            return {lensCharts: existingCharts, unlinkedCharts: unlinkedCharts};
        }

        const [newChart] = await db.insert(charts).values(fallbackChart).returning();

        return {lensCharts: [], unlinkedCharts: [newChart]};
    }
);

export const getLensConfigs = await withAuth(
    async (user: User, workspaceId: string): Promise<LensConfig[]> => {
        const chartConfigsData = await db
            .select()
            .from(chartConfigs)
            .where(and(eq(chartConfigs.workspaceId, workspaceId), eq(chartConfigs.type, "lens")))
            .orderBy(asc(chartConfigs.createdAt));

        return chartConfigsData as LensConfig[];
    }
);

export const createChart = await withAuth(async (user: User, chart: NewChart): Promise<Chart> => {
    const [createdChart] = await db.insert(charts).values(chart).returning();
    return createdChart;
});

export const deleteChart = await withAuth(async (user: User, chartId: string): Promise<void> => {
    await db.delete(charts).where(eq(charts.id, chartId));
});

export const getOrCreateLensConfig = await withAuth(
    async (user: User, workspaceId: string, fallbackConfig: LensConfigData): Promise<LensConfig> => {
        const existingConfigs = await db
            .select()
            .from(chartConfigs)
            .where(and(eq(chartConfigs.workspaceId, workspaceId), eq(chartConfigs.type, "lens")))
            .orderBy(asc(chartConfigs.createdAt))
            .limit(1);

        if (existingConfigs.length > 0) {
            return existingConfigs[0] as LensConfig;
        }

        const [newConfig] = await db
            .insert(chartConfigs)
            .values({
                workspaceId,
                type: "lens",
                data: fallbackConfig,
            })
            .returning();

        return newConfig as LensConfig;
    }
);

export const getHasLinkedConfig = await withAuth(
    async (user: User, chartId: string): Promise<boolean> => {
        const linkedConfigs = await db
            .select()
            .from(chartConfigLinks)
            .where(eq(chartConfigLinks.chartId, chartId));

        return linkedConfigs.length > 0;
    }
);

export const getUnlinkedCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
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
    }
);

