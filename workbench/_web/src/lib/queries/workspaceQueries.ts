"use server";

import { withAuth, User } from "@/lib/auth-wrapper";
import { db } from "@/db/client";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Workspace } from "@/types/workspace";

const getWorkspaces = await withAuth(async (user: User): Promise<Workspace[]> => {
    return await db.select().from(workspaces).where(eq(workspaces.userId, user.id));
});

const getWorkspaceById = await withAuth(async (user: User, workspaceId: string): Promise<Workspace | null> => {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    return workspace;
});

const createWorkspace = await withAuth(async (user: User, name: string) => {
    const workspace = await db.insert(workspaces).values({
        userId: user.id,
        name,
        public: false
    }).returning();
    return workspace;
});

export { getWorkspaces, getWorkspaceById, createWorkspace };