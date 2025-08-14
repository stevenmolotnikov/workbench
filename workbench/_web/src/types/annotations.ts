export interface LineAnnotation { 
    type: "line";
    lineId: string;
    layerStart: number;
    layerEnd?: number;
}

export interface HeatmapAnnotationData { 
    type: "heatmap";
    bounds: {
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
    };
}

export type AnnotationData = LineAnnotation | HeatmapAnnotationData;