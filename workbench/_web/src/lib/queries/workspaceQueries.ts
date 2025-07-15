"use server";

import { Chart, ChartData } from "@/types/charts";
import { Workspace, WorkspaceData } from "@/types/workspace";
import { Annotation } from "@/types/annotations";
import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { charts, workspaces, annotations } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { Workspace as WorkspaceType } from "@/types/workspace";

const getWorkspaces = await withAuth(async (user: User): Promise<Workspace[]> => {
    const workspacesData = await db.select().from(workspaces).where(eq(workspaces.userId, user.id));
    return workspacesData.map((workspace) => {
        return {
            ...workspace,
            charts: []
        };
    });
});

