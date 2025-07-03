'use server';

import { db } from '@/db/client';
import { workspaces } from '@/db/schema';

export interface Workspace {
    id: number;
    name: string | null;
    public: boolean | null;
}

export interface CreateWorkspaceData {
    name: string;
    public?: boolean;
}

export async function getWorkspaces(): Promise<Workspace[]> {
    try {
        const result = await db.select().from(workspaces);
        return result;
    } catch (error) {
        console.error('Failed to get workspaces:', error);
        throw new Error('Failed to get workspaces');
    }
}

export async function createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    try {
        const result = await db.insert(workspaces).values({
            name: data.name,
            public: data.public || false
        }).returning();
        
        return result[0];
    } catch (error) {
        console.error('Failed to create workspace:', error);
        throw new Error('Failed to create workspace');
    }
} 