"use server";

import { Chart, ChartData, LineGraphData } from "@/types/charts";
import { WorkspaceData } from "@/types/workspace";
import { Annotation } from "@/types/annotations";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { charts, workspaces, annotations } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export const setWorkspaceData = await withAuth(
    async (
        user: User,
        chartId: string,
        completions: WorkspaceData[keyof WorkspaceData]
    ): Promise<void> => {
        await db.update(charts).set({ workspaceData: completions }).where(eq(charts.id, chartId));
    }
);

export const getWorkspaceData = await withAuth(
    async (user: User, chartId: string): Promise<WorkspaceData[keyof WorkspaceData] | null> => {
        const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
        return chart?.workspaceData as WorkspaceData[keyof WorkspaceData] | null;
    }
);

export const setChartData = await withAuth(
    async (user: User, chartId: string, chartData: ChartData[keyof ChartData]): Promise<void> => {
        await db.update(charts).set({ chartData }).where(eq(charts.id, chartId));
    }
);

export const getChartData = await withAuth(
    async (user: User, chartId: string): Promise<ChartData[keyof ChartData] | null> => {
        const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
        return chart?.chartData as ChartData[keyof ChartData] | null;
    }
);

export const getCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {
        const chartsData = await db
            .select()
            .from(charts)
            .where(eq(charts.workspaceId, workspaceId));

        const annotationData = await db
            .select()
            .from(annotations)
            .where(
                inArray(
                    annotations.chartId,
                    chartsData.map((chart) => chart.id)
                )
            );

        return chartsData.map((chart) => {
            return {
                id: chart.id,
                chartType: chart.chartType,
                chartData: chart.chartData || null,
                annotations: annotationData
                    .filter((annotation) => annotation.chartId === chart.id)
                    .map((annotation) => annotation.data as Annotation),
                workspaceData: chart.workspaceData || null,
                position: chart.position,
            };
        });
    }
);

export const getLensCharts = await withAuth(
    async (user: User, workspaceId: string): Promise<Chart[]> => {

        const chartsData = await db
            .select()
            .from(charts)
            .where(and(eq(charts.workspaceId, workspaceId), eq(charts.workspaceType, "lens")));

        const annotationData = await db
            .select()
            .from(annotations)
            .where(
                inArray(
                    annotations.chartId,
                    chartsData.map((chart) => chart.id)
                )
            );

        return chartsData.map((chart) => {
            return {
                id: chart.id,
                chartType: chart.chartType,
                chartData: chart.chartData || null,
                annotations: annotationData
                    .filter((annotation) => annotation.chartId === chart.id)
                    .map((annotation) => annotation.data as Annotation),
                workspaceData: chart.workspaceData || null,
                position: chart.position,
            };
        });
    }
);

export const getLensChartByPosition = await withAuth(
    async (user: User, workspaceId: string, position: number): Promise<Chart> => {
        const chartsData = await db
            .select()
            .from(charts)
            .where(and(eq(charts.workspaceId, workspaceId), eq(charts.position, position)));

        const annotationData = await db
            .select()
            .from(annotations)
            .where(
                inArray(
                    annotations.chartId,
                    chartsData.map((chart) => chart.id)
                )
            );

        if (chartsData.length !== 1) {
            throw new Error("Expected 1 chart, got " + chartsData.length);
        }

        const chart = chartsData[0];

        return {
            id: chart.id,
            chartType: chart.chartType,
            chartData: chart.chartData || null,
            annotations: annotationData
                .filter((annotation) => annotation.chartId === chart.id)
                .map((annotation) => annotation.data as Annotation),
            workspaceData: chart.workspaceData || null,
            position: chart.position,
        };
    }
);

export const createChart = await withAuth(
    async (
        user: User,
        workspaceId: string,
        chart: Chart,
        chartType: "line" | "heatmap",
        workspaceType: "lens" | "patching"
    ): Promise<void> => {

        await db
            .insert(charts)
            .values({
                id: chart.id,
                workspaceId,
                workspaceType,
                workspaceData: chart.workspaceData,
                chartType,
                chartData: chart.chartData,
                position: chart.position,
            });
    }
);
