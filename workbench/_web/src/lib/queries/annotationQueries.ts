"use server";

import { db } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { annotations, charts, type Annotation, type NewAnnotation, type Chart } from "@/db/schema";
import { LineAnnotation, AnnotationData, HeatmapAnnotation } from "@/types/annotations";

export const getAnnotations = async (chartId: string): Promise<Annotation[]> => {
    const result = await db.select().from(annotations).where(eq(annotations.chartId, chartId));
    return result;
}

export const getHeatmapAnnotations = async (chartId: string): Promise<HeatmapAnnotation[]> => {
    const result = await db.select().from(annotations).where(and(eq(annotations.chartId, chartId), eq(annotations.type, "heatmap")));
    return result.map(({ data }) => data as HeatmapAnnotation);
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