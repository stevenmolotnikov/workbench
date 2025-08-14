import React, { type RefObject } from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapControlsProvider, useHeatmapControls } from "./HeatmapControlsProvider";
import { PaintProvider } from "./PaintProvider";
import { ZoomProvider } from "./ZoomProvider";
import { TooltipProvider } from "./TooltipProvider";
import { HeatmapChart } from "@/db/schema";

interface HeatmapCardProps {
    chart: HeatmapChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const HeatmapCard = ({ chart, captureRef }: HeatmapCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <HeatmapControlsProvider chart={chart}>
                <div className="flex h-[90%] w-full" ref={captureRef}>

                    <PaintProvider>
                        <TooltipProvider>
                            <ZoomProvider>
                                <HeatmapCardContent />
                            </ZoomProvider>
                        </TooltipProvider>
                    </PaintProvider>

                </div>
            </HeatmapControlsProvider>
        </div>
    );
};


const HeatmapCardContent = () => {
    const { filteredData: data } = useHeatmapControls()

    return (
        <Heatmap data={data} />
    );
};