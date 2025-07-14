export interface Annotation {
    id: string;
    text: string;
    isOrphaned?: boolean;
    originalChartIndex?: number;
    groupId?: string;
}

export interface LineGraphAnnotation extends Annotation { 
    lineId: string;
    layer: number;
    chartIndex: number;
}

export interface LineGraphRangeAnnotation extends Annotation { 
    lineId: string;
    start: number;
    end: number;
    chartIndex: number;
}

export interface CellPosition {
    row: number;
    col: number;
}

export interface HeatmapAnnotation extends Annotation { 
    positions: CellPosition[];
    chartIndex: number;
}

export type WorkspaceAnnotation =
    | { type: "lineGraph"; data: LineGraphAnnotation }
    | { type: "lineGraphRange"; data: LineGraphRangeAnnotation }
    | { type: "heatmap"; data: HeatmapAnnotation }
    | { type: "token"; data: Annotation };
