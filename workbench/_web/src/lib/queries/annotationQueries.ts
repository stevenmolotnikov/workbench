"use server";

import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { annotations, charts, type Annotation, type NewAnnotation, type Chart } from "@/db/schema";

export const getAnnotations = async (chartId: string): Promise<Annotation[]> => {
    const result = await db.select().from(annotations).where(eq(annotations.chartId, chartId));
    return result;
}

export const createAnnotation = async (newAnnotation: NewAnnotation): Promise<Annotation> => {
    const [annotation] = await db.insert(annotations).values(newAnnotation).returning();
    return annotation;
}

export const deleteAnnotation = async (id: string): Promise<void> => {
    await db.delete(annotations).where(eq(annotations.id, id));
}

export const getAllAnnotationsForWorkspace = async (workspaceId: string): Promise<(Annotation & { chart: Chart })[]> => {
    const result = await db
        .select()
        .from(annotations)
        .innerJoin(charts, eq(annotations.chartId, charts.id))
        .where(eq(charts.workspaceId, workspaceId));
    
    return result.map(({ annotations, charts }) => ({
        ...annotations,
        chart: charts
    }));
}