export interface AnnotationBase {
    id: string;
    text: string;
    isOrphaned?: boolean;
    originalChartIndex?: number;
    groupId?: string;
}

export interface LineGraphAnnotation extends AnnotationBase { 
    lineId: string;
    layer: number;
    chartIndex: number;
}

export interface LineGraphRangeAnnotation extends AnnotationBase { 
    lineId: string;
    start: number;
    end: number;
    chartIndex: number;
}

export interface CellPosition {
    row: number;
    col: number;
}

export interface HeatmapAnnotation extends AnnotationBase { 
    positions: CellPosition[];
    chartIndex: number;
}

export type Annotation = {
    point: LineGraphAnnotation;
    heatmap: HeatmapAnnotation;
    token: AnnotationBase;
    range: LineGraphRangeAnnotation;
}