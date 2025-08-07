"use server";

import { db } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { annotations } from "@/db/schema";
import { LineAnnotation } from "@/types/annotations";

export const getLineAnnotations = async (chartId: string): Promise<LineAnnotation[]> => {
    const lineAnnotations = await db.select().from(annotations).where(and(eq(annotations.chartId, chartId), eq(annotations.type, "line")));
    return lineAnnotations.map((annotation) => annotation.data as LineAnnotation);
}