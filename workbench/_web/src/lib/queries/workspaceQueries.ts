"use server";

import { db } from "@/db/client";
import { workspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth-wrapper";


export async function getWorkspaceById(workspaceId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  
  return workspace || null;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: { name?: string; public?: boolean },
  userId: string
) {
  const [updatedWorkspace] = await db
    .update(workspaces)
    .set(updates)
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.userId, userId)
      )
    )
    .returning();
  
  if (!updatedWorkspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  return updatedWorkspace;
}

export const getWorkspaces = await withAuth(async (user) => {
  return await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, user.id));
});

export const deleteWorkspace = await withAuth(async (user, workspaceId: string) => {
  await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, user.id)));
});

// Wrapped versions for use with server actions/components that use withAuth
export const createWorkspace = await withAuth(async (user, name: string, isPublic: boolean = false) => {
  const [workspace] = await db
    .insert(workspaces)
    .values({
      userId: user.id,
      name,
      public: isPublic
    })
    .returning();
  
  return workspace;
});
