import { Chart, ChartData } from "@/types/charts";
import { WorkspaceData } from "@/types/workspace";
import { Annotation } from "@/types/annotations";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { charts, workspaces, annotations } from "@/db/schema";
import { eq, inArray, and, SQL } from "drizzle-orm";
import { chartTypes } from "@/db/schema";

const setWorkspaceData = withAuth(
    async (
        user: User,
        chartId: string,
        completions: WorkspaceData[keyof WorkspaceData]
    ): Promise<void> => {
        await db.update(charts).set({ workspaceData: completions }).where(eq(charts.id, chartId));
    }
);

const getWorkspaceData = withAuth(
    async (user: User, chartId: string): Promise<WorkspaceData[keyof WorkspaceData]> => {
        const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
        return chart?.workspaceData as WorkspaceData[keyof WorkspaceData];
    }
);

const setChartData = withAuth(
    async (user: User, chartId: string, chartData: ChartData[keyof ChartData]): Promise<void> => {
        await db.update(charts).set({ chartData }).where(eq(charts.id, chartId));
    }
);

const getChartData = withAuth(
    async (user: User, chartId: string): Promise<ChartData[keyof ChartData]> => {
        const [chart] = await db.select().from(charts).where(eq(charts.id, chartId));
        return chart?.chartData as ChartData[keyof ChartData];
    }
);

const getCharts = withAuth(async (user: User, workspaceId: string, _clause?: SQL): Promise<Chart[]> => {
    const chartsData = await db
        .select().from(charts)
        .where(
            and(
                eq(charts.workspaceId, workspaceId),
                _clause
            )
        )

    const annotationData = await db.select().from(annotations).where(inArray(annotations.chartId, chartsData.map(chart => chart.id)));
    
    return chartsData.map((chart) => {
        return {
            chartData: chart.chartData,
            annotations: annotationData
                .filter(annotation => annotation.chartId === chart.id)
                .map(annotation => annotation.data as Annotation),
            workspaceData: chart.workspaceData,
            position: chart.position,
        };
    });
});



export { setWorkspaceData, getWorkspaceData, setChartData, getChartData, getCharts };
