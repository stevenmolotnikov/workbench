import { HeatmapBounds } from "./charts";

export interface LineAnnotation { 
    type: "line";
    lineId: string;
    layerStart: number;
    layerEnd?: number;
}

export interface HeatmapAnnotationData { 
    type: "heatmap";
    bounds: HeatmapBounds;
}

export type AnnotationData = LineAnnotation | HeatmapAnnotationData;