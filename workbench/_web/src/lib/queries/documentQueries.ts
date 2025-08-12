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

// Default content with headings and paragraphs; cast to SerializedEditorState to satisfy types
const defaultInitialContent = {
    root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: "ltr",
        children: [
            {
                type: "heading",
                tag: "h1",
                version: 1,
                format: "",
                indent: 0,
                direction: "ltr",
                children: [
                    {
                        type: "text",
                        version: 1,
                        text: "Overview",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                    },
                ],
            },
            {
                type: "paragraph",
                version: 1,
                format: "",
                indent: 0,
                direction: "ltr",
                children: [
                    {
                        type: "text",
                        version: 1,
                        text: "This is your overview.",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                    },
                ],
            },
            {
                type: "heading",
                tag: "h2",
                version: 1,
                format: "",
                indent: 0,
                direction: "ltr",
                children: [
                    {
                        type: "text",
                        version: 1,
                        text: "Getting Started",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                    },
                ],
            },
            {
                type: "paragraph",
                version: 1,
                format: "",
                indent: 0,
                direction: "ltr",
                children: [
                    {
                        type: "text",
                        version: 1,
                        text: "- Type markdown, it autoformats",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                    },
                ],
            },
            {
                type: "paragraph",
                version: 1,
                format: "",
                indent: 0,
                direction: "ltr",
                children: [
                    {
                        type: "text",
                        version: 1,
                        text: "- Use '/' to insert charts",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                    },
                ],
            },
        ],
    },
} as unknown as SerializedEditorState;

export const createDocument = async (workspaceId: string): Promise<Document> => {
    const initialContent = defaultInitialContent;

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