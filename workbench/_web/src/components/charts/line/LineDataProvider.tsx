import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { LineChart } from "@/db/schema";
import { LineGraphData, Range } from "@/types/charts";

interface LineDataContextValue {
    // Range State
    data: LineGraphData;
    xRange?: Range;
    yRange?: Range;
    setXRange: (r: Range | undefined) => void;
    setYRange: (r: Range | undefined) => void;
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
}

const LineDataContext = createContext<LineDataContextValue | null>(null);

export const useLineData = () => {
    const context = useContext(LineDataContext);
    if (!context) {
        throw new Error("useLineData must be used within a LineDataProvider");
    }
    return context;
};

interface LineDataProviderProps {
    chart: LineChart;
    children: ReactNode;
}

export const LineDataProvider: React.FC<LineDataProviderProps> = ({ chart, children }) => {

    const { data } = chart;

    const [xRange, setXRange] = useState<Range | undefined>(undefined);
    const [yRange, setYRange] = useState<Range | undefined>([0, 1]);

    // Calculate the bounds from the data
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        data.lines.forEach(line => {
            line.data.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });
        });

        return {
            xMin: minX === Infinity ? 0 : minX,
            xMax: maxX === -Infinity ? 100 : maxX,
            yMin: minY === Infinity ? 0 : minY,
            yMax: maxY === -Infinity ? 1 : maxY,
        };
    }, [data]);

    // Filter the data based on X range only
    const filteredData = useMemo(() => {
        if (!xRange) {
            return data;
        }

        const xMin = xRange[0];
        const xMax = xRange[1];

        return {
            ...data,
            lines: data.lines.map(line => ({
                ...line,
                data: line.data.filter(point =>
                    point.x >= xMin && point.x <= xMax
                )
            }))
        };
    }, [data, xRange]);


    const contextValue: LineDataContextValue = {
        data: filteredData,
        xRange,
        yRange,
        setXRange,
        setYRange,
        bounds,
    };

    return (
        <LineDataContext.Provider value={contextValue}>
            {children}
        </LineDataContext.Provider>
    );
};
