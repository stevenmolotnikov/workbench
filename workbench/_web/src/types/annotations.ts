export interface LineAnnotation { 
    type: "line";
    lineId: string;
    layerStart: number;
    layerEnd?: number;
}

export interface HeatmapAnnotation { 
    type: "heatmap";
    cellIds: string[];
}

export type AnnotationData = LineAnnotation | HeatmapAnnotation;