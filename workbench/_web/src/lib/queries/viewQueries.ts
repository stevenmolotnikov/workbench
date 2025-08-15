"use server";

import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { views, type View, type NewView, type HeatmapView } from "@/db/schema";
import type { ChartView } from "@/types/charts";

export const getHeatmapView = async (chartId: string): Promise<HeatmapView | null> => {
    const result = await db.select().from(views).where(eq(views.chartId, chartId));
    return result[0] || null;
}

export const getView = async (chartId: string): Promise<View | null> => {
    const result = await db.select().from(views).where(eq(views.chartId, chartId));
    return result[0] || null;
}

export const createView = async (newView: NewView): Promise<View> => {
    const [view] = await db.insert(views).values(newView).returning();
    return view;
}

export const deleteView = async (id: string): Promise<void> => {
    await db.delete(views).where(eq(views.id, id));
}

export const updateView = async (id: string, data: ChartView): Promise<View> => {
    const [updated] = await db
        .update(views)
        .set({ data })
        .where(eq(views.id, id))
        .returning()
    return updated
}