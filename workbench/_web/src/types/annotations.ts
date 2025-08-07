export interface BaseAnnotation {
    text: string;
}

export interface LineAnnotation extends BaseAnnotation { 
    type: "line";
    lineId: string;
    layerStart: number;
    layerEnd?: number;
}

export interface HeatmapAnnotation extends BaseAnnotation { 
    type: "heatmap";
    x: number;
    y: number;
}

export type AnnotationData = LineAnnotation | HeatmapAnnotation;