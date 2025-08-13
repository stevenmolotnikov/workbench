import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { LineChart } from "@/db/schema";
import { LineGraphData } from "@/types/charts";
import { RangeSelector } from "../RangeSelector";
import ChartTitle from "../ChartTitle";

type Range = [number, number];
// Using simple Range state; map to/from RangeSelector's array shape inline

interface LineControlsContextValue {
    // Range State
    data: LineGraphData;
    yRange?: Range;
}

const LineControlsContext = createContext<LineControlsContextValue | null>(null);

export const useLineControls = () => {
    const context = useContext(LineControlsContext);
    if (!context) {
        throw new Error("useLineControls must be used within a LineControlsProvider");
    }
    return context;
};

interface LineControlsProviderProps {
    chart: LineChart;
    children: ReactNode;
}

export const LineControlsProvider: React.FC<LineControlsProviderProps> = ({ chart, children }) => {

    const { data } = chart;

    const [xRange, setXRange] = useState<Range | undefined>(undefined);
    const [yRange, setYRange] = useState<Range | undefined>(undefined);

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


    const contextValue: LineControlsContextValue = {
        data: filteredData,
        yRange: yRange,
    };

    return (
        <LineControlsContext.Provider value={contextValue}>
            <div className="flex h-[10%] gap-2 p-4 lg:p-8 justify-between">
                <ChartTitle chart={chart} />
                <div className="flex items-center gap-2">
                    <RangeSelector
                        min={bounds.xMin}
                        max={bounds.xMax}
                        ranges={xRange ? [{ id: "x", range: xRange }] : []}
                        onRangesChange={(ranges) => {
                            if (ranges.length === 0) {
                                setXRange(undefined);
                            } else {
                                setXRange([ranges[0].range[0], ranges[0].range[1]]);
                            }
                        }}
                        maxRanges={1}
                        axisLabel="X Range"
                    />

                    <RangeSelector
                        min={0}
                        max={1}
                        ranges={yRange ? [{ id: "y", range: yRange }] : []}
                        onRangesChange={(ranges) => {
                            if (ranges.length === 0) {
                                setYRange(undefined);
                            } else {
                                setYRange([ranges[0].range[0], ranges[0].range[1]]);
                            }
                        }}
                        maxRanges={1}
                        axisLabel="Y Range"
                        step={0.01}
                    />
                </div>
            </div>

            {children}
        </LineControlsContext.Provider>
    );
};
