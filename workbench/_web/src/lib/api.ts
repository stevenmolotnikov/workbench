"use server";

import { db } from "../db/client";
import { workspaces, lensCollections, patchingCollections, charts, users } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type LensCollection = typeof lensCollections.$inferSelect;
export type PatchingCollection = typeof patchingCollections.$inferSelect;
export type Chart = typeof charts.$inferSelect;
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
  
  // Get associated collections
  const lensCollectionsData = await db
    .select()
    .from(lensCollections)
    .where(eq(lensCollections.workspaceId, id));
    
  const patchingCollectionsData = await db
    .select()
    .from(patchingCollections)
    .where(eq(patchingCollections.workspaceId, id));
    
  const chartsData = await db
    .select()
    .from(charts)
    .where(eq(charts.workspaceId, id));
  
  return { 
    ...workspace, 
    lensCollections: lensCollectionsData,
    patchingCollections: patchingCollectionsData,
    charts: chartsData
  };
}

export async function createWorkspace(
  name: string,
  isPublic = false
) {
  const user = await getAuthenticatedUser();
  
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

// Collection operations
export async function createLensCollection(
  workspaceId: string,
  data: Record<string, unknown> = {}
) {
  const user = await getAuthenticatedUser();
  
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
  
  const [newCollection] = await db
    .insert(lensCollections)
    .values({
      workspaceId,
      data,
    })
    .returning();
  
  revalidatePath(`/workbench/${workspaceId}`);
  return newCollection;
}

export async function createPatchingCollection(
  workspaceId: string,
  data: Record<string, unknown> = {}
) {
  const user = await getAuthenticatedUser();
  
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
  
  const [newCollection] = await db
    .insert(patchingCollections)
    .values({
      workspaceId,
      data,
    })
    .returning();
  
  revalidatePath(`/workbench/${workspaceId}`);
  return newCollection;
}

export async function updateLensCollection(
  collectionId: string,
  data: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  // Verify ownership through workspace
  const [collection] = await db
    .select({
      collection: lensCollections,
      workspace: workspaces,
    })
    .from(lensCollections)
    .innerJoin(workspaces, eq(lensCollections.workspaceId, workspaces.id))
    .where(
      and(
        eq(lensCollections.id, collectionId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!collection) {
    throw new Error("Collection not found or access denied");
  }
  
  await db
    .update(lensCollections)
    .set({ data })
    .where(eq(lensCollections.id, collectionId));
  
  revalidatePath(`/workbench/${collection.workspace.id}`);
  return { success: true };
}

export async function updatePatchingCollection(
  collectionId: string,
  data: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  // Verify ownership through workspace
  const [collection] = await db
    .select({
      collection: patchingCollections,
      workspace: workspaces,
    })
    .from(patchingCollections)
    .innerJoin(workspaces, eq(patchingCollections.workspaceId, workspaces.id))
    .where(
      and(
        eq(patchingCollections.id, collectionId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!collection) {
    throw new Error("Collection not found or access denied");
  }
  
  await db
    .update(patchingCollections)
    .set({ data })
    .where(eq(patchingCollections.id, collectionId));
  
  revalidatePath(`/workbench/${collection.workspace.id}`);
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
  
  // Delete associated collections and charts
  await db
    .delete(lensCollections)
    .where(eq(lensCollections.workspaceId, id));
    
  await db
    .delete(patchingCollections)
    .where(eq(patchingCollections.workspaceId, id));
    
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

// Get workspaces with their collections
export async function getWorkspacesWithCollections(includePublic = true) {
  const user = await getAuthenticatedUser();
  
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
  
  // For each workspace, get its collections
  const workspacesWithCollections = await Promise.all(
    userWorkspaces.map(async (workspace) => {
      const lensCollectionsData = await db
        .select()
        .from(lensCollections)
        .where(eq(lensCollections.workspaceId, workspace.id));
        
      const patchingCollectionsData = await db
        .select()
        .from(patchingCollections)
        .where(eq(patchingCollections.workspaceId, workspace.id));
        
      const chartsData = await db
        .select()
        .from(charts)
        .where(eq(charts.workspaceId, workspace.id));
      
      return {
        ...workspace,
        lensCollections: lensCollectionsData,
        patchingCollections: patchingCollectionsData,
        charts: chartsData,
      };
    })
  );
  
  return workspacesWithCollections;
}
