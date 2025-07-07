"use server";

import { db } from "../db/client";
import { workspaces, lensWorkspace, patchingWorkspaces, workspaceTypes, users } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Type exports
export type WorkspaceType = typeof workspaceTypes[number];
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type LensWorkspaceData = typeof lensWorkspace.$inferSelect;
export type PatchingWorkspaceData = typeof patchingWorkspaces.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Helper to get authenticated user
// TODO: Replace this with proper session management
async function getAuthenticatedUser() {
  // For now, get the first user from the database
  // In a real app, you'd get the user ID from cookies/session
  const [user] = await db
    .select()
    .from(users)
    .limit(1);
  
  if (!user) {
    throw new Error("No user found. Please create a user account first.");
  }
  
  return user;
}

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
  
  // Get workspaces that belong to the user or are public
  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .where(
      includePublic
        ? or(
            eq(workspaces.userId, user.id),
            eq(workspaces.public, true)
          )
        : eq(workspaces.userId, user.id)
    );
  
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
        or(
          eq(workspaces.userId, user.id),
          eq(workspaces.public, true)
        )
      )
    );
  
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }
  
  // Get associated data based on workspace type
  let data = null;
  if (workspace.type === "logit_lens") {
    const [lensData] = await db
      .select()
      .from(lensWorkspace)
      .where(eq(lensWorkspace.workspaceId, id));
    data = lensData;
  } else if (workspace.type === "patching") {
    const [patchingData] = await db
      .select()
      .from(patchingWorkspaces)
      .where(eq(patchingWorkspaces.workspaceId, id));
    data = patchingData;
  }
  
  return { ...workspace, data };
}

export async function createWorkspace(
  name: string,
  type: typeof workspaceTypes[number],
  isPublic = false,
  initialData?: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  // Create the workspace
  const [newWorkspace] = await db
    .insert(workspaces)
    .values({
      name,
      type,
      public: isPublic,
      userId: user.id,
    })
    .returning();
  
  // Create associated data table entry
  if (type === "logit_lens") {
    await db
      .insert(lensWorkspace)
      .values({
        workspaceId: newWorkspace.id,
        data: initialData || {},
      });
  } else if (type === "patching") {
    await db
      .insert(patchingWorkspaces)
      .values({
        workspaceId: newWorkspace.id,
        data: initialData || {},
      });
  }
  
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

export async function updateWorkspaceData(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  // Verify ownership and get workspace type
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
  
  // Update the appropriate data table
  if (workspace.type === "logit_lens") {
    await db
      .update(lensWorkspace)
      .set({ data })
      .where(eq(lensWorkspace.workspaceId, workspaceId));
  } else if (workspace.type === "patching") {
    await db
      .update(patchingWorkspaces)
      .set({ data })
      .where(eq(patchingWorkspaces.workspaceId, workspaceId));
  }
  
  revalidatePath(`/workbench/${workspaceId}`);
  return { success: true };
}

export async function deleteWorkspace(id: string) {
  const user = await getAuthenticatedUser();
  
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
  
  // Delete associated data first
  if (workspace.type === "logit_lens") {
    await db
      .delete(lensWorkspace)
      .where(eq(lensWorkspace.workspaceId, id));
  } else if (workspace.type === "patching") {
    await db
      .delete(patchingWorkspaces)
      .where(eq(patchingWorkspaces.workspaceId, id));
  }
  
  // Delete the workspace
  await db
    .delete(workspaces)
    .where(eq(workspaces.id, id));
  
  revalidatePath("/workbench");
  return { success: true };
}

// Get user's workspaces by type
export async function getWorkspacesByType(type: typeof workspaceTypes[number]) {
  const user = await getAuthenticatedUser();
  
  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.type, type),
        or(
          eq(workspaces.userId, user.id),
          eq(workspaces.public, true)
        )
      )
    );
  
  return userWorkspaces;
}
