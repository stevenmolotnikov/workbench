import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { HeatmapData } from "@/types/charts";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw, Eraser } from "lucide-react";
import { useDeleteAnnotation } from "@/lib/api/annotationsApi";
import { useQuery } from "@tanstack/react-query";
import { getAnnotations } from "@/lib/queries/annotationQueries";
import type { Annotation } from "@/db/schema";
import { HeatmapChart } from "@/db/schema";
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

    // Zoom State
    isZoomSelecting: boolean;
    setIsZoomSelecting: (selecting: boolean) => void;
    toggleZoomSelecting: (next?: boolean) => void;
    handleZoomComplete: (bounds: ZoomBounds) => void;
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
    const { data: allAnnotations = [] } = useQuery<Annotation[]>({
        queryKey: ["annotations", chart.id],
        queryFn: () => getAnnotations(chart.id),
        enabled: !!chart.id,
    })
    const { mutateAsync: deleteAnnotation } = useDeleteAnnotation()

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


    // ZOOM STATE

    // Zoom State
    const [isZoomSelecting, setIsZoomSelecting] = useState(false);

    const computeNewRanges = (zoomBounds: ZoomBounds) => {
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

        const newX: Range = [
            Math.max(currentX[0], Math.min(absMinCol, absMaxCol)),
            Math.min(currentX[1], Math.max(absMinCol, absMaxCol))
        ];
        const newY: Range = [
            Math.max(currentY[0], Math.min(absMinRow, absMaxRow)),
            Math.min(currentY[1], Math.max(absMinRow, absMaxRow))
        ];

        return {
            newX,
            newY
        }
    }

    // Handle zoom completion
    const handleZoomComplete = (zoomBounds: ZoomBounds) => {
        const { newX, newY } = computeNewRanges(zoomBounds);

        setXRange(newX);
        setYRange(newY);

        setIsZoomSelecting(false);
    };

    const toggleZoomSelecting = (next?: boolean) => {
        const value = typeof next === "boolean" ? next : !isZoomSelecting;
        setIsZoomSelecting(value);
    };

    // Handle reset
    const handleReset = () => {
        setIsZoomSelecting(false);
        setXRange([bounds.xMin, bounds.xMax]);
        const start = Math.max(bounds.yMin, bounds.yMax - 9);
        const end = bounds.yMax;
        setYRange([start, end]);
        setXStep(defaultXStep);
    };

    const contextValue: HeatmapControlsContextValue = {
        // Range State
        xRange,
        yRange,
        setXRange,
        setYRange,

        // Computed Values
        bounds,
        filteredData,

        // Zoom State
        isZoomSelecting,
        setIsZoomSelecting,
        toggleZoomSelecting,
        handleZoomComplete,
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
                        variant={isZoomSelecting ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => toggleZoomSelecting()}
                        aria-pressed={isZoomSelecting}

                        title={isZoomSelecting ? "Exit zoom selection" : "Enter zoom selection"}
                    >
                        <Crop className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={handleReset} title="Reset ranges">
                        <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8"
                        onClick={async () => {
                            // delete all heatmap annotations; no confirmation
                            const toDelete = allAnnotations.filter(a => a.type === 'heatmap')
                            for (const ann of toDelete) {
                                await deleteAnnotation({ id: ann.id, chartId: chart.id })
                            }
                        }}
                        title="Clear all annotations"
                    >
                        <Eraser className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            {children}
        </HeatmapControlsContext.Provider>
    );
};
