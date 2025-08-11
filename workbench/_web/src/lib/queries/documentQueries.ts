"use server";

import { db } from "@/db/client";
import { documents, Document } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SerializedEditorState } from "lexical";

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

export const upsertDocument = async (workspaceId: string, content: SerializedEditorState): Promise<Document> => {
    const [document] = await db
        .insert(documents)
        .values({
            workspaceId,
            content: content,
        })
        .onConflictDoUpdate({
            target: documents.workspaceId,
            set: {
                content: content,
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
    const initialContent = {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "Start writing your overview here...",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1
                }
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    } as SerializedEditorState;

    const [document] = await db
        .insert(documents)
        .values({
            workspaceId,
            content: initialContent,
        })
        .onConflictDoUpdate({
            target: documents.workspaceId,
            set: {
                content: initialContent,
            },
        })
        .returning();
    
    return document;
};