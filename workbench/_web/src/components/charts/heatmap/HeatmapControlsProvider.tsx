import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode, useCallback, useRef } from "react";
import { HeatmapData } from "@/types/charts";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { useCreateAnnotation, useDeleteAnnotation, useUpdateAnnotation } from "@/lib/api/annotationsApi";
import { useQuery } from "@tanstack/react-query";
import { getHeatmapAnnotation } from "@/lib/queries/annotationQueries";
import { useDebouncedCallback } from "use-debounce";
import { HeatmapAnnotation, HeatmapChart } from "@/db/schema";
import ChartTitle from "../ChartTitle";

type Range = [number, number];

export interface ZoomBounds {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
}

export interface Bounds {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

interface HeatmapControlsContextValue {
    // Range State
    xRange: Range;
    yRange: Range;
    setXRange: (range: Range) => void;
    setYRange: (range: Range) => void;

    // Computed Values
    bounds: Bounds;
    filteredData: HeatmapData;

    // Selection (provided by SelectionProvider, persisted here)
    activeSelection: ZoomBounds | null;
    setActiveSelection: (bounds: ZoomBounds | null) => void;
    clearSelection: () => Promise<void>;
    zoomIntoActiveSelection: () => Promise<void>;
}

const HeatmapControlsContext = createContext<HeatmapControlsContextValue | null>(null);

export const useHeatmapControls = () => {
    const context = useContext(HeatmapControlsContext);
    if (!context) {
        throw new Error("useHeatmapControls must be used within a HeatmapControlsProvider");
    }
    return context;
};

interface HeatmapControlsProviderProps {
    chart: HeatmapChart;
    children: ReactNode;
}

export const HeatmapControlsProvider: React.FC<HeatmapControlsProviderProps> = ({ chart, children }) => {

    const data = chart.data;
    const { data: annotation, isSuccess } = useQuery<HeatmapAnnotation | null>({
        queryKey: ["annotations", chart.id],
        queryFn: () => getHeatmapAnnotation(chart.id),
        enabled: !!chart.id,
    })
    const { mutateAsync: deleteAnnotation } = useDeleteAnnotation()
    const { mutateAsync: createAnnotation } = useCreateAnnotation()
    const { mutateAsync: updateAnnotation } = useUpdateAnnotation()

    // Calculate bounds
    const bounds = useMemo(() => {
        const xMax = data.rows.length && data.rows[0].data.length ? data.rows[0].data.length - 1 : 100;
        const yMax = data.rows.length ? data.rows.length - 1 : 100;
        return {
            xMin: 0,
            yMin: 0,
            xMax,
            yMax,
        };
    }, [data]);

    // Range State
    const [xRange, setXRange] = useState<Range>([0, 0]);
    const [yRange, setYRange] = useState<Range>([0, 0]);

    // Calculate default step
    const defaultXStep = useMemo(() => {
        const width = bounds.xMax - bounds.xMin;
        return Math.max(1, Math.floor(width / 10));
    }, [bounds.xMax, bounds.xMin]);

    // Step State
    const [xStep, setXStep] = useState<number>(defaultXStep);

    // Update step when default changes
    useEffect(() => {
        if (xRange[0] === 0 && xRange[1] === 0) {
            setXStep(defaultXStep);
        }
    }, [defaultXStep, xRange]);

    // Auto-initialize X range to full bounds
    useEffect(() => {
        if (xRange[0] === 0 && xRange[1] === 0 && bounds.xMax >= bounds.xMin) {
            setXRange([bounds.xMin, bounds.xMax]);
        }
    }, [bounds.xMin, bounds.xMax, xRange]);

    // Auto-initialize Y range to last 10 tokens
    useEffect(() => {
        if (yRange[0] === 0 && yRange[1] === 0 && bounds.yMax >= 0) {
            const start = Math.max(bounds.yMin, bounds.yMax - 9);
            const end = bounds.yMax;
            setYRange([start, end]);
        }
    }, [bounds.yMax, bounds.yMin, yRange]);

    // Filter data based on ranges and stepping
    const filteredData = useMemo(() => {
        const stride = Math.max(1, Math.floor(xStep));

        return {
            ...data,
            rows: data.rows
                .map((row, yIndex) => {
                    // Check if this row index is within Y range
                    const inYRange = yIndex >= yRange[0] && yIndex <= yRange[1];
                    if (!inYRange) return null;

                    // Apply X range filtering and stepping
                    const filteredAndSampled = row.data
                        .map((cell, idx) => ({ cell, idx }))
                        .filter(({ idx }) => {
                            // First check if within X range
                            const inXRange = idx >= xRange[0] && idx <= xRange[1];
                            if (!inXRange) return false;
                            // Then apply stepping (take every Nth element)
                            const relativeIdx = idx - xRange[0];
                            return relativeIdx % stride === 0;
                        })
                        .map(({ cell }) => cell);

                    return {
                        ...row,
                        data: filteredAndSampled
                    };
                })
                .filter(row => row !== null) as typeof data.rows
        };
    }, [data, xRange, yRange, xStep]);

    const [activeSelection, setActiveSelectionState] = useState<ZoomBounds | null>(null)

    // Initialize active selection from existing DB annotation (if present)
    useEffect(() => {
        if (isSuccess && annotation) {
            setActiveSelectionState(annotation.data.bounds)
        }
    }, [annotation, isSuccess])

    const debouncedPersist = useDebouncedCallback(async () => {
        if (!activeSelection) return
        const payload = { type: 'heatmap' as const, bounds: { ...activeSelection } }
        if (annotation) {
            await updateAnnotation({ id: annotation.id, chartId: chart.id, data: payload })
        } else {
            await createAnnotation({ chartId: chart.id, type: 'heatmap', data: payload })
        }
    }, 3000)

    // Cancel pending persist on unmount
    useEffect(() => {
        return () => {
            debouncedPersist.cancel()
        }
    }, [debouncedPersist])

    // Exposed setter that persists when selection is set
    const setActiveSelection = useCallback((bounds: ZoomBounds | null) => {
        setActiveSelectionState(bounds)
        if (bounds) {
            debouncedPersist()
        } else {
            debouncedPersist.cancel()
        }
    }, [debouncedPersist])

    const clearSelection = useCallback(async () => {
        debouncedPersist.cancel()
        const existing = annotation
        setActiveSelection(null)
        if (existing) {
            await deleteAnnotation({ id: existing.id, chartId: chart.id })
        }
    }, [annotation, deleteAnnotation, chart.id, debouncedPersist, setActiveSelection])

    const zoomIntoActiveSelection = useCallback(async () => {
        if (!activeSelection) return
        const zoomBounds = activeSelection
        const hasX = xRange[0] !== 0 && xRange[1] !== 0;
        const hasY = yRange[0] !== 0 && yRange[1] !== 0;

        const xOffset = 0;
        const yOffset = hasY ? Math.floor(yRange[0]) : 0;

        const absMinCol = Math.max(bounds.xMin, Math.min(bounds.xMax, xOffset + zoomBounds.minCol));
        const absMaxCol = Math.max(bounds.xMin, Math.min(bounds.xMax, xOffset + zoomBounds.maxCol));
        const absMinRow = Math.max(bounds.yMin, Math.min(bounds.yMax, yOffset + zoomBounds.minRow));
        const absMaxRow = Math.max(bounds.yMin, Math.min(bounds.yMax, yOffset + zoomBounds.maxRow));

        const currentX = hasX ? xRange : [bounds.xMin, bounds.xMax] as Range;
        const currentY = hasY ? yRange : [bounds.yMin, bounds.yMax] as Range;

        await clearSelection()

        setXRange([
            Math.max(currentX[0], Math.min(absMinCol, absMaxCol)),
            Math.min(currentX[1], Math.max(absMinCol, absMaxCol))
        ])
        setYRange([
            Math.max(currentY[0], Math.min(absMinRow, absMaxRow)),
            Math.min(currentY[1], Math.max(absMinRow, absMaxRow))
        ])
    }, [clearSelection, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, xRange, yRange, activeSelection])

    // Handle reset: clear selection and reset ranges/step
    const handleReset = useCallback(async () => {
        await clearSelection()
        setXRange([bounds.xMin, bounds.xMax]);
        const start = Math.max(bounds.yMin, bounds.yMax - 9);
        const end = bounds.yMax;
        setYRange([start, end]);
        setXStep(defaultXStep);
    }, [clearSelection, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, defaultXStep])

    const contextValue: HeatmapControlsContextValue = {
        // Range State
        xRange,
        yRange,
        setXRange,
        setYRange,

        // Computed Values
        bounds,
        filteredData,

        // Selection
        activeSelection,
        setActiveSelection,
        clearSelection,
        zoomIntoActiveSelection,
    };

    return (
        <HeatmapControlsContext.Provider value={contextValue}>
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-between">
                <ChartTitle chart={chart} />
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={Math.max(1, bounds.xMax - bounds.xMin)}
                            step={1}
                            value={xStep}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (Number.isNaN(val)) {
                                    setXStep(1);
                                } else {
                                    setXStep(Math.max(1, Math.min(val, Math.max(1, bounds.xMax - bounds.xMin))));
                                }
                            }}
                            className="w-20 h-8 border rounded px-2 text-xs bg-background"
                            aria-label="X Range Step"
                            title="X Range Step"
                        />
                    </div>

                    <Button
                        variant={activeSelection ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => { void zoomIntoActiveSelection() }}
                        disabled={!activeSelection}
                        title={activeSelection ? "Zoom into selection and clear annotation" : "Draw a selection on the chart first"}
                    >
                        <Crop className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => { void handleReset() }} title="Reset zoom and clear selection">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            {children}
        </HeatmapControlsContext.Provider>
    );
};
