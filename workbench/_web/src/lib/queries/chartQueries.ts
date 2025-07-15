
import { ChartData } from "@/types/charts";
import { WorkspaceData } from "@/types/workspace";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { charts } from "@/db/schema";
import { eq } from "drizzle-orm";

const setWorkspaceData = withAuth(
    async (user: User, chartId: string, completions: WorkspaceData[keyof WorkspaceData]): Promise<void> => {
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

export { setWorkspaceData, getWorkspaceData, setChartData, getChartData };