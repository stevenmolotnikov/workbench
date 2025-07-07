"use server";

import { db } from "../db/client";
import { workspaces, collections, charts, users } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Chart = typeof charts.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Helper to get authenticated user
// TODO: Replace this with proper session management
async function getAuthenticatedUser() {
  try {
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
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error("Unable to connect to database. Please ensure the database is set up and accessible.");
  }
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
  const collectionsData = await db
    .select()
    .from(collections)
    .where(eq(collections.workspaceId, id));
    
  // Get charts associated with this workspace's collections
  const collectionIds = collectionsData.map(c => c.id);
  const chartsData = collectionIds.length > 0 ? await db
    .select()
    .from(charts)
    .where(
      or(...collectionIds.map(id => eq(charts.collectionId, id)))
    ) : [];
  
  return { 
    ...workspace, 
    collections: collectionsData,
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
export async function createCollection(
  workspaceId: string,
  type: "lens" | "patching",
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
    .insert(collections)
    .values({
      workspaceId,
      type,
      data,
    })
    .returning();
  
  revalidatePath(`/workbench/${workspaceId}`);
  return newCollection;
}

export async function updateCollection(
  collectionId: string,
  data: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  // Verify ownership through workspace
  const [collection] = await db
    .select({
      collection: collections,
      workspace: workspaces,
    })
    .from(collections)
    .innerJoin(workspaces, eq(collections.workspaceId, workspaces.id))
    .where(
      and(
        eq(collections.id, collectionId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!collection) {
    throw new Error("Collection not found or access denied");
  }
  
  await db
    .update(collections)
    .set({ data })
    .where(eq(collections.id, collectionId));
  
  revalidatePath(`/workbench/${collection.workspace.id}`);
  return { success: true };
}

// Chart operations
export async function createChart(
  collectionId: string,
  type: "heatmap" | "line",
  data: Record<string, unknown> = {}
) {
  const user = await getAuthenticatedUser();
  
  // Verify collection ownership through workspace
  const [collection] = await db
    .select({
      collection: collections,
      workspace: workspaces,
    })
    .from(collections)
    .innerJoin(workspaces, eq(collections.workspaceId, workspaces.id))
    .where(
      and(
        eq(collections.id, collectionId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!collection) {
    throw new Error("Collection not found or access denied");
  }
  
  const [newChart] = await db
    .insert(charts)
    .values({
      collectionId,
      type,
      data,
    })
    .returning();
  
  revalidatePath(`/workbench/${collection.workspace.id}`);
  return newChart;
}

export async function updateChart(
  chartId: string,
  data: Record<string, unknown>
) {
  const user = await getAuthenticatedUser();
  
  // Verify ownership through collection and workspace
  const [chart] = await db
    .select({
      chart: charts,
      collection: collections,
      workspace: workspaces,
    })
    .from(charts)
    .innerJoin(collections, eq(charts.collectionId, collections.id))
    .innerJoin(workspaces, eq(collections.workspaceId, workspaces.id))
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

export async function deleteCollection(collectionId: string) {
  const user = await getAuthenticatedUser();
  
  // Verify ownership through workspace
  const [collection] = await db
    .select({
      collection: collections,
      workspace: workspaces,
    })
    .from(collections)
    .innerJoin(workspaces, eq(collections.workspaceId, workspaces.id))
    .where(
      and(
        eq(collections.id, collectionId),
        eq(workspaces.userId, user.id)
      )
    );
  
  if (!collection) {
    throw new Error("Collection not found or access denied");
  }
  
  // Delete associated charts first
  await db
    .delete(charts)
    .where(eq(charts.collectionId, collectionId));
  
  // Delete the collection
  await db
    .delete(collections)
    .where(eq(collections.id, collectionId));
  
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
  
  // Get all collections for this workspace
  const workspaceCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.workspaceId, id));
  
  // Delete charts associated with all collections
  for (const collection of workspaceCollections) {
    await db
      .delete(charts)
      .where(eq(charts.collectionId, collection.id));
  }
  
  // Delete all collections
  await db
    .delete(collections)
    .where(eq(collections.workspaceId, id));
  
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
  
  // For each workspace, get its collections and charts
  const workspacesWithCollections = await Promise.all(
    userWorkspaces.map(async (workspace) => {
      const collectionsData = await db
        .select()
        .from(collections)
        .where(eq(collections.workspaceId, workspace.id));
        
      // Get charts for all collections in this workspace
      const collectionIds = collectionsData.map(c => c.id);
      const chartsData = collectionIds.length > 0 ? await db
        .select()
        .from(charts)
        .where(
          or(...collectionIds.map(id => eq(charts.collectionId, id)))
        ) : [];
      
      return {
        ...workspace,
        collections: collectionsData,
        charts: chartsData,
      };
    })
  );
  
  return workspacesWithCollections;
}
