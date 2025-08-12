import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { LineChart } from "@/db/schema";
import { LineGraphData } from "@/types/charts";
import { RangeSelector } from "../RangeSelector";

type Range = [number, number];
type RangeWithId = {
    id: string;
    range: Range;
};

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

    const [title, setTitle] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [xRanges, setXRanges] = useState<RangeWithId[]>([]);
    const [yRanges, setYRanges] = useState<RangeWithId[]>([]);

    // Extract single range from array format
    const xRange = xRanges.length > 0 ? xRanges[0].range : undefined;
    const yRange = yRanges.length > 0 ? yRanges[0].range : undefined;

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
                {isEditingTitle ? (
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setIsEditingTitle(false);
                            }
                        }}
                        placeholder="Untitled Chart"
                        className="text-xl font-bold p-0 m-0 border-primary border overflow-clip rounded bg-transparent w-64"
                        autoFocus
                    />
                ) : (
                    <h1
                        className="text-xl font-bold cursor-pointer border rounded border-transparent w-64 overflow-clip items-center flex hover:border-border transition-opacity p-0 m-0"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {title || "Untitled Chart"}
                    </h1>
                )}

                <div className="flex items-center gap-2">
                    <RangeSelector
                        min={bounds.xMin}
                        max={bounds.xMax}
                        ranges={xRanges}
                        onRangesChange={setXRanges}
                        maxRanges={1}
                        axisLabel="X Range"
                    />

                    <RangeSelector
                        min={0}
                        max={1}
                        ranges={yRanges}
                        onRangesChange={setYRanges}
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
