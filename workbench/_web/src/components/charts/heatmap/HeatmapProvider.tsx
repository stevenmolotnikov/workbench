import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { HeatmapData } from "@/types/charts";

type Range = [number, number];
type RangeWithId = {
    id: string;
    range: Range;
};

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

interface HeatmapContextValue {
    // Range State
    xRanges: RangeWithId[];
    yRanges: RangeWithId[];
    setXRanges: (ranges: RangeWithId[]) => void;
    setYRanges: (ranges: RangeWithId[]) => void;

    // Step State
    xStepInput: number;
    setXStepInput: (step: number) => void;

    // Computed Values
    bounds: Bounds;
    filteredData: HeatmapData;
}

const HeatmapContext = createContext<HeatmapContextValue | null>(null);

export const useHeatmap = () => {
    const context = useContext(HeatmapContext);
    if (!context) {
        throw new Error("useHeatmap must be used within a HeatmapProvider");
    }
    return context;
};

interface HeatmapProviderProps {
    data: HeatmapData;
    children: ReactNode;
}

export const HeatmapProvider: React.FC<HeatmapProviderProps> = ({ data, children }) => {
    // Range State
    const [xRanges, setXRanges] = useState<RangeWithId[]>([]);
    const [yRanges, setYRanges] = useState<RangeWithId[]>([]);

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

    // Calculate default step
    const defaultXStep = useMemo(() => {
        const width = bounds.xMax - bounds.xMin;
        return Math.max(1, Math.floor(width / 10));
    }, [bounds.xMax, bounds.xMin]);

    // Step State
    const [xStepInput, setXStepInput] = useState<number>(defaultXStep);

    // Update step when default changes
    useEffect(() => {
        if (xRanges.length === 0) {
            setXStepInput(defaultXStep);
        }
    }, [defaultXStep, xRanges.length]);

    // Auto-initialize Y range to last 10 tokens
    useEffect(() => {
        if (yRanges.length === 0 && bounds.yMax >= 0) {
            const start = Math.max(bounds.yMin, bounds.yMax - 9);
            const end = bounds.yMax;
            setYRanges([{ id: `y-default-${Date.now()}`, range: [start, end] }]);
        }
    }, [bounds.yMax, bounds.yMin, yRanges.length]);

    // Filter data based on ranges and stepping
    const filteredData = useMemo(() => {
        const xRange = xRanges[0]?.range || [bounds.xMin, bounds.xMax];
        const yRange = yRanges[0]?.range || [bounds.yMin, bounds.yMax];
        const stride = Math.max(1, Math.floor(xStepInput));

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
    }, [data, xRanges, yRanges, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax]);

    const contextValue: HeatmapContextValue = {
        // Range State
        xRanges,
        yRanges,
        setXRanges,
        setYRanges,

        // Step State
        xStepInput,
        setXStepInput,

        // Computed Values
        bounds,
        filteredData,
    };

    return (
        <HeatmapContext.Provider value={contextValue}>
            {children}
        </HeatmapContext.Provider>
    );
};
