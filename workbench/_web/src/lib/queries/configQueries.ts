"use server";

import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { chartConfigs, NewChartConfig, ChartConfig, chartConfigLinks } from "@/db/schema";

export const setChartConfig = async (configId: string, config: NewChartConfig): Promise<void> => {
    await db.update(chartConfigs).set(config).where(eq(chartConfigs.id, configId));
};

export const addChartConfig = async (config: NewChartConfig): Promise<void> => {
    await db.insert(chartConfigs).values(config);
};

export const deleteChartConfig = async (configId: string): Promise<void> => {
    await db.delete(chartConfigs).where(eq(chartConfigs.id, configId));
};

export const addChartConfigLink = async (configId: string, chartId: string): Promise<void> => {
    await db.insert(chartConfigLinks).values({ configId, chartId });
};

export const getChartConfigs = async (chartId: string): Promise<ChartConfig[]> => {
    const chartConfigsData = await db
        .select()
        .from(chartConfigs)
        .innerJoin(chartConfigLinks, eq(chartConfigs.id, chartConfigLinks.configId))
        .where(eq(chartConfigLinks.chartId, chartId));
    return chartConfigsData.map((data) => data.chart_configs);
};
