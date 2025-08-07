"use server";

import { db } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { annotations, type Annotation, type NewAnnotation } from "@/db/schema";
import { LineAnnotation, AnnotationData } from "@/types/annotations";

export const getAnnotations = async (chartId: string): Promise<Annotation[]> => {
    const result = await db.select().from(annotations).where(eq(annotations.chartId, chartId));
    return result;
}

export const createAnnotation = async (chartId: string, type: "line" | "heatmap", data: AnnotationData): Promise<Annotation> => {
    const [newAnnotation] = await db.insert(annotations).values({
        chartId,
        type,
        data,
    }).returning();
    return newAnnotation;
}

export const deleteAnnotation = async (id: string): Promise<void> => {
    await db.delete(annotations).where(eq(annotations.id, id));
}