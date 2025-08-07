import { useState, useMemo } from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapData } from "@/types/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { RangeSelector } from "./RangeSelector";

type Range = [number, number];
type RangeWithId = {
    id: string;
    range: Range;
};

interface HeatmapCardProps {
    data: HeatmapData
}



export const HeatmapCard = ({ data }: HeatmapCardProps) => {
    const [title, setTitle] = useState("Title");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [xRanges, setXRanges] = useState<RangeWithId[]>([]);
    const [yRanges, setYRanges] = useState<RangeWithId[]>([]);

    // Calculate the bounds for the range selectors
    const xMax = useMemo(() => {
        if (!data.rows.length || !data.rows[0].data.length) return 100;
        return data.rows[0].data.length - 1;
    }, [data]);

    const yMax = useMemo(() => {
        if (!data.rows.length) return 100;
        return data.rows.length - 1;
    }, [data]);

    // Filter the heatmap data based on selected ranges
    const filteredData = useMemo(() => {
        // If no ranges selected, return all data
        if (xRanges.length === 0 && yRanges.length === 0) {
            return data;
        }

        return {
            ...data,
            rows: data.rows
                .map((row, yIndex) => {
                    // Check if this row index is within any Y range
                    const inYRange = yRanges.length === 0 ||
                        yRanges.some(r => yIndex >= r.range[0] && yIndex <= r.range[1]);

                    if (!inYRange) {
                        return null;
                    }

                    // Filter cells based on X ranges
                    return {
                        ...row,
                        data: row.data.filter((_, xIndex) => {
                            if (xRanges.length === 0) return true;
                            return xRanges.some(r => xIndex >= r.range[0] && xIndex <= r.range[1]);
                        })
                    };
                })
                .filter(row => row !== null) as typeof data.rows
        };
    }, [data, xRanges, yRanges]);

    return (
        <div className="flex flex-col h-full border rounded bg-muted m-2">
            <div className="flex h-[10%] items-center gap-2 p-4">
                {isEditingTitle ? (
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setIsEditingTitle(false);
                            }
                        }}
                        className="text-xl font-bold h-auto py-0 px-1 w-fit"
                        autoFocus
                    />
                ) : (
                    <h1 className="text-xl font-bold">
                        {title}
                    </h1>
                )}



                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>

                    <RangeSelector
                        min={0}
                        max={xMax}
                        ranges={xRanges}
                        onRangesChange={setXRanges}
                        axisLabel="X Range"
                    />

                    <RangeSelector
                        min={0}
                        max={yMax}
                        ranges={yRanges}
                        onRangesChange={setYRanges}
                        axisLabel="Y Range"
                    />
                </div>
            </div>
            <div className="flex h-[90%] w-full">
                <Heatmap
                    data={filteredData}
                />
            </div>
        </div>
    )
}

