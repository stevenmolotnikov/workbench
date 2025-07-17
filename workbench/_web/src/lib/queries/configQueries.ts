"use server";

import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { chartConfigs, NewChartConfig, ChartConfig, chartConfigLinks } from "@/db/schema";

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

export const addChartConfigLink = await withAuth(
    async (user: User, configId: string, chartId: string): Promise<void> => {
        await db.insert(chartConfigLinks).values({ configId, chartId });
    }
);

export const getChartConfigs = await withAuth(
    async (user: User, chartId: string): Promise<ChartConfig[]> => {
        const chartConfigsData = await db
            .select()
            .from(chartConfigs)
            .innerJoin(chartConfigLinks, eq(chartConfigs.id, chartConfigLinks.configId))
            .where(eq(chartConfigLinks.chartId, chartId));
        return chartConfigsData.map(data => data.chart_configs);
    }
);