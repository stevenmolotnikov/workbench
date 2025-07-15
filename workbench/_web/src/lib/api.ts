"use server";

import { db } from "../db/client";
import { workspaces, charts, users } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser, withAuth, type User } from "./auth-wrapper";
import type { Workspace as WorkspaceType } from "../types/workspace";
import type { LensCompletion } from "../types/lens";
import type { PatchingCompletion } from "../types/patching";

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Chart = typeof charts.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Account creation function
export async function createAccount(
  email: string,
  password: string,
  name?: string
) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User already exists with this email");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

// Workspace operations
export async function getWorkspaces(includePublic = true) {
  const user = await getAuthenticatedUser();
  
  // If no user and we're not including public workspaces, return empty array
  if (!user && !includePublic) {
    return [];
  }
  
  // Get workspaces that belong to the user or are public
  const whereClause = includePublic
    ? user
      ? or(
          eq(workspaces.userId, user.id),
          eq(workspaces.public, true)
        )
      : eq(workspaces.public, true)
    : eq(workspaces.userId, user!.id); // Safe due to check above
  
  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .where(whereClause);
  
  return userWorkspaces;
}

export async function getWorkspaceById(id: string) {
  const user = await getAuthenticatedUser();
  
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, id),
        user
          ? or(
              eq(workspaces.userId, user.id),
              eq(workspaces.public, true)
            )
          : eq(workspaces.public, true)
      )
    );
  
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  // Get charts associated with this workspace
  const chartsData = await db
    .select()
    .from(charts)
    .where(eq(charts.workspaceId, id));
  
  return { 
    ...workspace, 
    charts: chartsData
  };
}

export async function createWorkspace(
  name: string,
  isPublic = false
) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Create the workspace
  const [newWorkspace] = await db
    .insert(workspaces)
    .values({
      name,
      public: isPublic,
      userId: user.id,
    })
    .returning();
  
  revalidatePath("/workbench");
  return newWorkspace;
}

export async function updateWorkspace(
  id: string,
  updates: {
    name?: string;
    public?: boolean;
  }
) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify ownership
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, id),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!existing) {
    throw new Error("Workspace not found or access denied");
  }
  
  const [updated] = await db
    .update(workspaces)
    .set(updates)
    .where(eq(workspaces.id, id))
    .returning();
  
  revalidatePath("/workbench");
  return updated;
}

// Chart operations

// Chart operations
export async function createChart(
  workspaceId: string,
  chartType: "heatmap" | "line",
  workspaceType: "lens" | "patching",
  data: Record<string, unknown> = {}
) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify workspace ownership
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  const [newChart] = await db
    .insert(charts)
    .values({
      workspaceId,
      chartType,
      workspaceType,
      data,
    })
    .returning();
  
  revalidatePath(`/workbench/${workspaceId}`);
  return newChart;
}

export async function updateChart(
  chartId: string,
  data: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify ownership through workspace
  const [chart] = await db
    .select({
      chart: charts,
      workspace: workspaces,
    })
    .from(charts)
    .innerJoin(workspaces, eq(charts.workspaceId, workspaces.id))
    .where(
      and(
        eq(charts.id, chartId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!chart) {
    throw new Error("Chart not found or access denied");
  }
  
  await db
    .update(charts)
    .set({ data })
    .where(eq(charts.id, chartId));
  
  revalidatePath(`/workbench/${chart.workspace.id}`);
  return { success: true };
}

export async function deleteChart(chartId: string) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify ownership through workspace
  const [chart] = await db
    .select({
      chart: charts,
      workspace: workspaces,
    })
    .from(charts)
    .innerJoin(workspaces, eq(charts.workspaceId, workspaces.id))
    .where(
      and(
        eq(charts.id, chartId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!chart) {
    throw new Error("Chart not found or access denied");
  }
  
  // Delete the chart
  await db
    .delete(charts)
    .where(eq(charts.id, chartId));
  
  revalidatePath(`/workbench/${chart.workspace.id}`);
  return { success: true };
}

export async function deleteWorkspace(id: string) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify ownership
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, id),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  // Delete all charts for this workspace
  await db
    .delete(charts)
    .where(eq(charts.workspaceId, id));
  
  // Delete the workspace
  await db
    .delete(workspaces)
    .where(eq(workspaces.id, id));
  
  revalidatePath("/workbench");
  return { success: true };
}

// Get workspaces with their charts
export async function getWorkspacesWithCharts(includePublic = true) {
  const user = await getAuthenticatedUser();
  
  // If no user and we're not including public workspaces, return empty array
  if (!user && !includePublic) {
    return [];
  }
  
  const whereClause = includePublic
    ? user
      ? or(
          eq(workspaces.userId, user.id),
          eq(workspaces.public, true)
        )
      : eq(workspaces.public, true)
    : eq(workspaces.userId, user!.id); // Safe due to check above
  
  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .where(whereClause);
  
  // For each workspace, get its charts
  const workspacesWithCharts = await Promise.all(
    userWorkspaces.map(async (workspace) => {
      const chartsData = await db
        .select()
        .from(charts)
        .where(eq(charts.workspaceId, workspace.id));
      
      return {
        ...workspace,
        charts: chartsData,
      };
    })
  );
  
  return workspacesWithCharts;
}

// Lens workspace operations
export async function getLensWorkspace(workspaceId: string): Promise<WorkspaceType | null> {
  const workspace = await getWorkspaceById(workspaceId);
  
  if (!workspace) {
    return null;
  }
  
  // Find the lens chart for this workspace
  const lensChart = workspace.charts.find(chart => chart.workspaceType === "lens");
  
  if (!lensChart) {
    return {
      id: workspace.id,
      name: workspace.name,
      charts: []
    };
  }
  
  return {
    id: workspace.id,
    name: workspace.name,
    charts: [lensChart.data as any] // Cast to Chart type from types/charts.ts
  };
}

export async function setLensWorkspace(workspaceId: string, lensData: WorkspaceType): Promise<void> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify workspace ownership
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  // Find existing lens chart
  const [existingChart] = await db
    .select()
    .from(charts)
    .where(
      and(
        eq(charts.workspaceId, workspaceId),
        eq(charts.workspaceType, "lens")
      )
    );
  
  if (existingChart) {
    // Update existing chart
    await db
      .update(charts)
      .set({ data: lensData })
      .where(eq(charts.id, existingChart.id));
  } else {
    // Create new lens chart
    await db
      .insert(charts)
      .values({
        workspaceId,
        workspaceType: "lens",
        chartType: "line",
        data: lensData
      });
  }
  
  revalidatePath(`/workbench/${workspaceId}`);
}

export async function getLensCompletion(workspaceId: string): Promise<LensCompletion | null> {
  const workspace = await getWorkspaceById(workspaceId);
  
  if (!workspace) {
    return null;
  }
  
  // Find the lens chart for this workspace
  const lensChart = workspace.charts.find(chart => chart.workspaceType === "lens");
  
  if (!lensChart || !lensChart.data) {
    return null;
  }
  
  // Extract lens completion from chart data
  return (lensChart.data as any)?.config as LensCompletion;
}

export async function setLensCompletion(workspaceId: string, completion: LensCompletion): Promise<void> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Get existing lens chart
  const [existingChart] = await db
    .select()
    .from(charts)
    .where(
      and(
        eq(charts.workspaceId, workspaceId),
        eq(charts.workspaceType, "lens")
      )
    );
  
  if (existingChart) {
    // Update the config within the chart data
    const currentData = existingChart.data as any;
    const updatedData = {
      ...currentData,
      config: completion
    };
    
    await db
      .update(charts)
      .set({ data: updatedData })
      .where(eq(charts.id, existingChart.id));
  } else {
    // Create new lens chart with completion config
    await db
      .insert(charts)
      .values({
        workspaceId,
        workspaceType: "lens",
        chartType: "line",
        data: {
          config: completion,
          data: null,
          annotations: []
        }
      });
  }
  
  revalidatePath(`/workbench/${workspaceId}`);
}

// Patching workspace operations
export async function getPatchingWorkspace(workspaceId: string): Promise<WorkspaceType | null> {
  const workspace = await getWorkspaceById(workspaceId);
  
  if (!workspace) {
    return null;
  }
  
  // Find the patching chart for this workspace
  const patchingChart = workspace.charts.find(chart => chart.workspaceType === "patching");
  
  if (!patchingChart) {
    return {
      id: workspace.id,
      name: workspace.name,
      charts: []
    };
  }
  
  return {
    id: workspace.id,
    name: workspace.name,
    charts: [patchingChart.data as any] // Cast to Chart type from types/charts.ts
  };
}

export async function setPatchingWorkspace(workspaceId: string, patchingData: WorkspaceType): Promise<void> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Verify workspace ownership
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  // Find existing patching chart
  const [existingChart] = await db
    .select()
    .from(charts)
    .where(
      and(
        eq(charts.workspaceId, workspaceId),
        eq(charts.workspaceType, "patching")
      )
    );
  
  if (existingChart) {
    // Update existing chart
    await db
      .update(charts)
      .set({ data: patchingData })
      .where(eq(charts.id, existingChart.id));
  } else {
    // Create new patching chart
    await db
      .insert(charts)
      .values({
        workspaceId,
        workspaceType: "patching",
        chartType: "heatmap",
        data: patchingData
      });
  }
  
  revalidatePath(`/workbench/${workspaceId}`);
}

export async function getPatchingCompletion(workspaceId: string): Promise<PatchingCompletion | null> {
  const workspace = await getWorkspaceById(workspaceId);
  
  if (!workspace) {
    return null;
  }
  
  // Find the patching chart for this workspace
  const patchingChart = workspace.charts.find(chart => chart.workspaceType === "patching");
  
  if (!patchingChart || !patchingChart.data) {
    return null;
  }
  
  // Extract patching completion from chart data
  return (patchingChart.data as any)?.config as PatchingCompletion;
}

export async function setPatchingCompletion(workspaceId: string, completion: PatchingCompletion): Promise<void> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  // Get existing patching chart
  const [existingChart] = await db
    .select()
    .from(charts)
    .where(
      and(
        eq(charts.workspaceId, workspaceId),
        eq(charts.workspaceType, "patching")
      )
    );
  
  if (existingChart) {
    // Update the config within the chart data
    const currentData = existingChart.data as any;
    const updatedData = {
      ...currentData,
      config: completion
    };
    
    await db
      .update(charts)
      .set({ data: updatedData })
      .where(eq(charts.id, existingChart.id));
  } else {
    // Create new patching chart with completion config
    await db
      .insert(charts)
      .values({
        workspaceId,
        workspaceType: "patching",
        chartType: "heatmap",
        data: {
          config: completion,
          data: null,
          annotations: []
        }
      });
  }
  
  revalidatePath(`/workbench/${workspaceId}`);
}
