import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode, useCallback } from "react";
import { HeatmapData, HeatmapBounds, HeatmapView } from "@/types/charts";

import { HeatmapChart } from "@/db/schema";
import { useQuery } from "@tanstack/react-query";
import { getChartView } from "@/lib/queries/chartQueries";

type Range = [number, number];


interface HeatmapDataContextValue {
    // Range State
    xRange: Range;
    yRange: Range;
    setXRange: (range: Range) => void;
    setYRange: (range: Range) => void;
    setXStep: (step: number) => void;
    defaultXStep: number;
    xStep: number;
    handleStepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Computed Values
    bounds: HeatmapBounds;
    filteredData: HeatmapData;

}

const HeatmapDataContext = createContext<HeatmapDataContextValue | null>(null);

export const useHeatmapData = () => {
    const context = useContext(HeatmapDataContext);
    if (!context) {
        throw new Error("useHeatmapData must be used within a HeatmapDataProvider");
    }
    return context;
};

interface HeatmapDataProviderProps {
    chart: HeatmapChart;
    children: ReactNode;
}

export const HeatmapDataProvider: React.FC<HeatmapDataProviderProps> = ({ chart, children }) => {
    const data = chart.data
    const { data: chartView, isSuccess: isChartViewSuccess } = useQuery<HeatmapView | null>({
        queryKey: ["chartView", chart.id],
        queryFn: () => getChartView(chart.id),
        enabled: !!chart.id,
    })

    // Calculate bounds
    const bounds = useMemo(() => {
        const xMax = data.rows.length && data.rows[0].data.length ? data.rows[0].data.length - 1 : 100;
        const yMax = data.rows.length ? data.rows.length - 1 : 100;
        return {
            minRow: 0,
            maxRow: yMax,
            minCol: 0,
            maxCol: xMax,
        };
    }, [data]);

    // Range State, default to full bounds
    const [xRange, setXRange] = useState<Range>([bounds.minCol, bounds.maxCol]);
    const [yRange, setYRange] = useState<Range>([bounds.minRow, bounds.maxRow]);

    // Calculate default step
    const defaultXStep = useMemo(() => {
        const width = bounds.maxCol - bounds.minCol;
        return Math.max(1, Math.floor(width / 10));
    }, [bounds.maxCol, bounds.minCol]);

    // Step State
    const [xStep, setXStep] = useState<number>(1);

    // Update the X step when there's new data
    useEffect(() => {
        setXStep(defaultXStep);
    }, [data]);

    // Update the Y range to the last 10 tokens when there's new data
    useEffect(() => {
        const start = Math.max(bounds.minRow, bounds.maxRow - 9);
        setYRange([start, bounds.maxRow]);
    }, [data]);

    // This should only run on loading a stored chart
    useEffect(() => {
        if (isChartViewSuccess && chartView) {
            setXRange([chartView.bounds.minCol, chartView.bounds.maxCol])
            setYRange([chartView.bounds.minRow, chartView.bounds.maxRow])
            setXStep(chartView.xStep)
        }
    }, [chartView, isChartViewSuccess])

    const handleStepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (Number.isNaN(val)) {
            setXStep(1);
        } else {
            setXStep(Math.max(1, Math.min(val, Math.max(1, bounds.maxCol - bounds.minCol))));
        }
    }, [bounds.maxCol, bounds.minCol])

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

    const contextValue: HeatmapDataContextValue = {
        // Range State
        xRange,
        yRange,
        xStep,
        setXRange,
        setYRange,
        setXStep,
        defaultXStep,
        handleStepChange,

        // Computed Values
        bounds,
        filteredData,
    };

    return (
        <HeatmapDataContext.Provider value={contextValue}>
            {children}
        </HeatmapDataContext.Provider>
    );
};
