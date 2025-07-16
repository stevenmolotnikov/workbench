export interface BaseAnnotationData {
    text: string;
}

export interface LineGraphAnnotation extends BaseAnnotationData { 
    lineId: string;
    layer: number;
    chartIndex: number;
}

export interface LineGraphRangeAnnotation extends BaseAnnotationData { 
    lineId: string;
    start: number;
    end: number;
    chartIndex: number;
}

export interface CellPosition {
    row: number;
    col: number;
}

export interface HeatmapAnnotation extends BaseAnnotationData { 
    positions: CellPosition[];
    chartIndex: number;
}   

export type AnnotationData = LineGraphAnnotation | LineGraphRangeAnnotation | HeatmapAnnotation | BaseAnnotationData;