"use server";

import { db } from "@/db/client";
import { documents, Document, NewDocument } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EditorJSData } from "@/types/editor";

export const getDocumentById = async (documentId: string): Promise<Document | null> => {
    const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId));
    
    return document ?? null;
};

export const getDocumentByWorkspaceId = async (workspaceId: string): Promise<Document | null> => {
    const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.workspaceId, workspaceId));
    
    return document ?? null;
};

export const upsertDocument = async (workspaceId: string, content: EditorJSData): Promise<Document> => {
    const [document] = await db
        .insert(documents)
        .values({
            workspaceId,
            content: content as any,
        })
        .onConflictDoUpdate({
            target: documents.workspaceId,
            set: {
                content: content as any,
            },
        })
        .returning();
    
    return document;
};

export const getDocumentsForWorkspace = async (workspaceId: string): Promise<Document[]> => {
    const docs = await db
        .select()
        .from(documents)
        .where(eq(documents.workspaceId, workspaceId));
    
    return docs;
};

export const createDocument = async (workspaceId: string): Promise<Document> => {
    const initialContent: EditorJSData = {
        time: Date.now(),
        blocks: [
            {
                id: "initial-block",
                type: "paragraph",
                data: {
                    text: "Start writing your overview here..."
                }
            }
        ],
        version: "2.28.0"
    };

    const [document] = await db
        .insert(documents)
        .values({
            workspaceId,
            content: initialContent as any,
        })
        .onConflictDoUpdate({
            target: documents.workspaceId,
            set: {
                content: initialContent as any,
            },
        })
        .returning();
    
    return document;
};